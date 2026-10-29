---
status: done
size: medium
---

# Postgres docs

Status summary: done. Postgres guide and Coming from pgkit pages are in the Guides sidebar, Postgres wording is accurate elsewhere, `tasks/pg.md` is current. Verifying the guide turned up real pg bugs; they're listed in the guide's Known gaps and in `tasks/pg.md` step three, not fixed here.

Postgres support is on main and published (`@sqlfu/pg@0.1.1`): schema diff, migrations, typegen, formatter and the studio all work with `pgDialect`. The docs still read as if Postgres is a runtime adapter only ("broader `@sqlfu/pg` dialect/toolchain docs are still in progress"). The `dialect` config option isn't documented anywhere.

Goal: someone searching "sqlfu postgres" lands on a guide that gets a Postgres project from zero to generated wrappers, and every other place that mentions Postgres says what's true today.

## Decisions (made while scoping; override on review)

- **Not a pgkit drop-in, and the docs say so plainly.** Postgres is supported; moving a pgkit codebase over is not a supported path. A short "Coming from pgkit" page maps pgkit packages to sqlfu equivalents and lists the gaps.
- **Sidebar:** add `Postgres` to Guides, plus `Coming from pgkit` in Guides. That's the "something else" in the sidebar. A thin "Dialects" concept page was considered and dropped: one config key doesn't need its own page; it's documented in the README Configuration section and the guide.
- **Keep "SQLite-first" in the tagline.** SQLite is still the default dialect with more adapters, guides and test coverage. Add a Postgres mention next to it instead of rewording the product's positioning.
- **Blog post gets a one-line edit, not a rewrite.** `introducing-sqlfu.md` says the pg story "still needs fuller docs and examples". PR #121 already edited that same line for accuracy; this PR points it at the new guide.
- **`@sqlfu/pg` gets a short README** so its npm page isn't empty. It links to the guide rather than duplicating it.
- **Verify the guide's snippets for real** against the docker-compose Postgres in `packages/pg/test/` (port 5544): `draft`, `migrate`, `generate`, then run a generated wrapper with `createNodePostgresClient`.

## Checklist

- [x] `packages/sqlfu/docs/guides/postgres.md`: install, config (`pgDialect({adminUrl})` + `db` factory with `Symbol.asyncDispose`), schema + queries, `draft`/`migrate`/`generate`, runtime usage, studio, how it differs from SQLite, current limitations _"Known gaps" section lists everything found while verifying_
- [x] `packages/sqlfu/docs/guides/pgkit.md` ("Coming from pgkit"): package-by-package mapping and gaps _plus a migrator command table_
- [x] Wire both pages into `website/astro.config.mjs` sidebar and `website/scripts/sync-docs.mjs`; add rows to `docs/guides.md` _also `sync-llms.mjs`, so llms.txt lists them as guides, not "Optional"_
- [x] README: intro mentions Postgres; Configuration documents `dialect`; Limitations section is accurate _also runtime-client wording, typed-errors paragraph, prior-art bullets_
- [x] `docs/adapters.md`: Postgres section links to the guide instead of saying docs are in progress _heading renamed to `Postgres` so `#postgres` anchors work_
- [x] `docs/errors.md`, `docs/schema-diff-model.md`, `docs/formatter.md`: fix "SQLite-only" / "in progress" claims _plus `lint-plugin.md`: the `format-sql` rule needs `{dialect: 'postgresql'}`_
- [x] Blog: point the "What it is not for" Postgres line at the guide
- [x] `packages/pg/README.md` _plus an em-dash-free package.json description_
- [x] Run the guide end-to-end against a real Postgres _see notes_
- [x] Update `tasks/pg.md` (stale: still says step one is in review, step two unticked) _new status summary, step two ticked, new "Step three" checklist of bugs_
- [x] Website build passes _`astro build` + `node --test website/test/`; rendered links checked in `dist/`_

## Implementation notes

Verification setup: `docker compose -f packages/pg/test/docker-compose.yml up -d --wait`, a scratch project in `packages/ui/pg-guide.ignoreme/` (so `pg`/`@sqlfu/pg`/`sqlfu` resolve via `packages/ui` devDeps), CLI run as `tsx ../../sqlfu/src/cli.ts`. `sqlfu draft` always prompts, even without a TTY, so it was driven through `script` with a scripted Enter.

What worked as written in the guide: `draft --name`, `migrate`, `check`, `applied`, `pending`, `sync`, `generate`, `format`, a second `draft` after editing `definitions.sql`, and the generated wrappers at runtime with `createNodePostgresClient`.

Bugs found (not fixed here; tracked in `tasks/pg.md` step three):

- The guide originally used `id serial primary key`. `generate` failed with `relation "posts_id_seq" does not exist`. Switching to identity got further, but the second draft added `alter column "id" add generated always as identity` and `check` failed on it. Cause: `renderCanonicalSchema` in `packages/pg/src/impl/schema.ts` (the file's own header calls it a wart). A round-trip script over 17 schema shapes showed what survives (tables, FKs, views, checks, indexes, uuid/jsonb/array columns) and what doesn't. The guide uses `uuid default gen_random_uuid()` ids because that's the simplest id that works.
- Same queries generated with SQLite and Postgres differ: pg returns arrays for `limit 1`, has no row type for `insert ... returning`, and types `= :param` as nullable.
- pg errors are `SqlfuError` with `kind: 'unknown'` for unique/not-null/missing-table violations (checked against codes 23505, 23502, 42P01).
- pg drafts without `--name` are named `_migration.sql`; SQLite derives `_create_table_posts.sql`.

Not done: screenshot for the PR. The browser pane can't capture `file://` pages and this change didn't seem worth adding a launch config to the main checkout.

