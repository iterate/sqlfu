---
status: done
size: medium
---

# Lossless Postgres schema rendering

## Status summary

Done. `materializeSchemaSql` and `extractSchemaFromClient` render with the vendored migra (empty inspector → db), and every shape in the brief round-trips. Three more vendored schemainspect/migra bugs fixed on the way. Left for later: migra creates functions and composite types after tables, so a default/check/generated column calling a function, or a composite-type column, fails (in drafts too). Tracked in `tasks/pg.md` step three; `test.fails` cases in the spec.

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

- [x] Red round-trip spec covering serial, bigserial, identity, enum, domain, stored generated column, function, trigger, materialized view, extension, non-`public` schema
- [x] Spec also covers the shapes that already work (plain tables, FKs, views, checks, indexes, uuid default, jsonb, arrays), so they stay working
- [x] ~Leave out comments and grants~ _kept out, as decided: `diffSchema` ignores them too. Listed in the guide's known gaps as "never drafted"_
- [x] Replace `renderCanonicalSchema` with migra-from-empty _`renderSchema` in `packages/pg/src/impl/schema.ts`_
- [x] `excludedTables` support on the inspector _`omitTables`, same file_
- [x] Fix vendored migra domain ordering + missing `;` _`Migration.add_all_changes`, `Changes.modified_domain_creations`, `InspectedDomain.create_statement`_
- [x] Probe other real-world shapes (functions used in defaults/checks, partitioned tables, composite types, RLS, comments, grants) and record what still fails _see implementation notes_
- [x] Tick step three's first item in `tasks/pg.md` _and added the function/composite-type ordering item_
- [x] Shrink "Known gaps" in `packages/sqlfu/docs/guides/postgres.md`; drop the "use `uuid` or `text` ids for now" advice
- [x] Existing `@sqlfu/pg` tests + typecheck pass _also ran `packages/ui/test/pg-studio.spec.ts`: 3/3_

## Implementation notes

Stacked on `pg-docs` (PR #156), because the guide's "Known gaps" table only exists there.

Probed 34 extra shapes against postgres:16 (render, then diff both ways):

- Round-trip after this branch: partitioned tables, RLS policies, views on views/functions, standalone sequences, deferrable FKs, inheritance, unlogged tables, partial/expression indexes, enums in function signatures, `setof` table functions, triggers/serial/enums in other schemas, identity options, enum arrays, `unique nulls not distinct`, domains with `not null default`, cross-schema FKs, matviews on matviews, `with check option`, procedures, extensions in other schemas, exclusion constraints, quoted identifiers.
- Fixed here (schemainspect bugs): domain over an enum (the enums query matched it via `typcategory = 'E'`, so it was created twice); column collations (`ColumnInfo.creation_clause` left out `collate`, only `add column` had it).
- Still broken, migra ordering: a function called in a column default, check or generated column; a composite type as a column type. migra creates functions and composite types in `non_table_selectable_creations`, after tables. Drafts from empty fail the same way. Fixing it means knowing which functions depend on which tables (`deps.sql` only reads view rules from `pg_rewrite`), and it reorders draft output for every fixture that adds a function, so it's its own PR.
- Silently lossy, not caught by the differ: custom ICU collations render as `locale = 'null'` and lose `deterministic = false`. Comments and grants: not rendered, not diffed.

Output formatting: kept migra's statement text (same as drafts), but trimmed each statement and joined with one blank line. Not run through `sql-formatter`, since its newline-heavy output is the thing `format.ts` says the user dislikes.
