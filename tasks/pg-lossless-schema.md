---
status: in-progress
size: medium
---

# Lossless Postgres schema rendering

## Status summary

Just started. Spec and approach written; implementation not started.

## Problem

`draft`, `check` and `generate` all re-read a Postgres schema as SQL text, through `pgDialect.materializeSchemaSql` (apply DDL to a scratch db, read it back) and `pgDialect.extractSchemaFromClient` (read the live db). Both go through `renderCanonicalSchema` in `packages/pg/src/impl/schema.ts`, a hand-rolled `pg_catalog` renderer that only knows `public` tables, columns, constraints, indexes and views. Its own header calls it a wart that vendored schemainspect was meant to replace.

Anything it doesn't know is lost, so `diffSchema(rendered, original)` isn't empty. Against `packages/pg/test/docker-compose.yml`:

- `serial` / `bigserial`: `relation "t_id_seq" does not exist`. `sqlfu generate` fails on a serial pk.
- identity column: spurious `alter column "id" add generated always as identity` in every later draft, and the migration then fails.
- enum, domain: `type "..." does not exist`.
- stored generated column: `cannot use column reference in DEFAULT expression`.
- function, trigger, materialized view, `create extension`, non-`public` schema: redrafted every time.

Fine today: plain tables, FKs, views, checks, indexes, `uuid default gen_random_uuid()`, jsonb, arrays.

## Spec

Round trip: for a schema `S`, `diffSchema({baselineSql: materializeSchemaSql(S), desiredSql: S})` returns `[]`. Same for `extractSchemaFromClient` on a db where `S` was applied. A red test in `packages/pg/test/` covers each shape above.

## Decisions (made AFK, review these)

- **Render with the vendored migra, diffing an empty inspector against the db.** `Migration.create(null, db)` gives the `create` statements for everything migra can see. That's what pgkit's migrator does for `definitions.sql` (`wrapMigra('EMPTY', client)`). `diffSchema` already uses migra, so the renderer and the differ agree on what a schema contains: anything migra can diff, it can render. No second renderer to keep in sync. Skipping the render step entirely was the other option in `tasks/pg.md`, but callers (UI "live schema" pane, drift checks, typegen authorities) want SQL text, and changing the `Dialect` contract for one dialect is a bigger change.
- **Output style changes to migra's.** Schema-qualified names, separate `create unique index` + `add constraint ... using index` statements, same shape as Postgres drafts already have. Less pretty than the old renderer, but drafts already look like this, and the UI shows the same thing in the live-schema pane.
- **`excludedTables` removes the table and everything hanging off it** (indexes, constraints, triggers, RLS policies, owned sequences) from the inspector before rendering. Matched by unqualified table name, as the sqlite dialect does.
- **Leave out objects every fresh database already has**: the `public` schema and the `plpgsql` extension. `create schema if not exists "public"` is noise in the UI pane, and a no-op on replay.
- **Extension versions aren't pinned.** Matches `diffSchema`'s `ignore_extension_versions: true`. Pinning would break replay on a server with a different contrib version.
- **Grants and comments stay out.** `diffSchema` doesn't diff them either (migra's `privileges` flag is off), so the round trip holds. List under known gaps if they matter.
- **Fix migra bugs in the vendored copy, with `sqlfu:` comments.** Found so far: domains were created after the tables that use them, and `create domain` had no trailing `;`.

## Checklist

- [ ] Red round-trip spec covering serial, bigserial, identity, enum, domain, stored generated column, function, trigger, materialized view, extension, non-`public` schema
- [ ] Spec also covers the shapes that already work (plain tables, FKs, views, checks, indexes, uuid default, jsonb, arrays), so they stay working
- [ ] Replace `renderCanonicalSchema` with migra-from-empty
- [ ] `excludedTables` support on the inspector
- [ ] Fix vendored migra domain ordering + missing `;`
- [ ] Probe other real-world shapes (functions used in defaults/checks, partitioned tables, composite types, RLS, comments, grants) and record what still fails
- [ ] Tick step three's first item in `tasks/pg.md`
- [ ] Shrink "Known gaps" in `packages/sqlfu/docs/guides/postgres.md`; drop the "use `uuid` or `text` ids for now" advice
- [ ] Existing `@sqlfu/pg` tests + typecheck pass

## Implementation notes

Stacked on `pg-docs` (PR #156), because the guide's "Known gaps" table only exists there.
