---
status: in-progress
size: medium
---

# Postgres docs

Status summary: spec only. Nothing implemented yet.

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

- [ ] `packages/sqlfu/docs/guides/postgres.md`: install, config (`pgDialect({adminUrl})` + `db` factory with `Symbol.asyncDispose`), schema + queries, `draft`/`migrate`/`generate`, runtime usage, studio, how it differs from SQLite, current limitations
- [ ] `packages/sqlfu/docs/guides/pgkit.md` ("Coming from pgkit"): package-by-package mapping and gaps
- [ ] Wire both pages into `website/astro.config.mjs` sidebar and `website/scripts/sync-docs.mjs`; add rows to `docs/guides.md`
- [ ] README: intro mentions Postgres; Configuration documents `dialect`; Limitations section is accurate
- [ ] `docs/adapters.md`: Postgres section links to the guide instead of saying docs are in progress
- [ ] `docs/errors.md`, `docs/schema-diff-model.md`, `docs/formatter.md`: fix "SQLite-only" / "in progress" claims
- [ ] Blog: point the "What it is not for" Postgres line at the guide
- [ ] `packages/pg/README.md`
- [ ] Run the guide end-to-end against a real Postgres
- [ ] Update `tasks/pg.md` (stale: still says step one is in review, step two unticked)
- [ ] Website build passes

## Implementation notes
