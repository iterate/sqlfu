---
status: in-progress
size: large
base: pg-package
---

Make the sqlfu UI work against a postgres project. Stacked PR off `pg-package`. Playwright-driven — every failure is a sqlite-specific assumption to fix.

## Goal

A user with `dialect: pgDialect({adminUrl})` in their `sqlfu.config.ts` can run `sqlfu serve`, open the studio, and have:

- The schema browser show their pg tables/views/columns.
- The query runner execute their `.sql` files against pg.
- Migrations / drift / sync flows work the same shape they do for sqlite (subject to pg-specific differences like `withMigrationLock`).
- The dev-loop (edit `definitions.sql`, see drift, sync) works.

## Approach

TDD against Playwright. Mirror the existing `packages/ui/test/template-project/` to a `template-project-pg/` (or equivalent) configured against the docker-compose pg instance from `@sqlfu/pg`'s test setup. Run a small focused spec; every red is a real gap.

## Decisions (best-guess, override on review)

- **Test pg server**: reuse `packages/pg/test/docker-compose.yml` (postgres:16 on port 5544). Playwright suite asserts pg reachability and skips/throws otherwise (same pattern as `@sqlfu/pg`'s tests).
- **Project layout**: `packages/ui/test/template-project-pg/` mirrors the sqlite `template-project/`. Same `definitions.sql` + `sql/` shape; `sqlfu.config.ts` swaps the dialect.
- **Scope**: smoke-test the golden path. Defer cosmetic gaps (specific colors, tooltip wording) to follow-ups. The TDD specs only need to exercise enough breadth to surface architectural issues.
- **No pg adapter changes** unless a spec failure forces them. We just merged the dialect interface — assume it's enough until proven otherwise.

## Plan

- [ ] **Scaffold the pg template project.** Mirror `packages/ui/test/template-project/` with definitions / migrations / queries that exist in pg. Wire `sqlfu.config.ts` to use `pgDialect({adminUrl: 'postgresql://postgres:postgres@127.0.0.1:5544/<unique-db>'})`. Each test run needs its own scratch db (use the existing `createTempDatabase` helper from `@sqlfu/pg`).
- [ ] **Write the first failing spec.** Pick the most basic flow: open studio → confirm schema browser shows expected tables. Whatever's broken in the path from "config loads" to "schema renders" surfaces here.
- [ ] **Iterate**: each red is one of:
  - sqlite-specific PRAGMA / system-table query in the UI server → make dialect-aware (likely via a new `Dialect.<method>` or inline branch).
  - A sqlite-pinned import / type → swap for the dialect-neutral form.
  - A test fixture detail (path, filename) → just adjust.

  Commit fixes with the failing spec turning green in the same commit when the fix is contained, or one fix per commit when they touch different surfaces.
- [ ] **Repeat for the other golden paths**: query runner, drift, sync, migration apply.
- [ ] **Final pass**: run the full playwright suite. Mark unrelated failures as known limitations; everything that's "actually pg drift" gets fixed.

## Out of scope

- Dialect-aware schema *visualisation* polish (foreign-key arrows for postgres, etc.) — visible in browser, but the existing UI handles it generically enough that it should just work.
- New pg-specific UI features (e.g. live `pg_stat_activity` view). This task is "make existing UI work for pg", not "add pg-only features".
- Performance work. Studio is dev-time, not hot-path.

## Notes during implementation

### Initial scaffold + first failing spec

- `packages/ui/test/template-project-pg/` mirrors the sqlite template with a pg dialect config. The config derives its database name from `path.basename(projectRoot)` so each test directory automatically gets its own pg scratch db.
- `packages/ui/test/pg-fixture.ts` extends the base playwright fixture: per-test slug → unique projectDir + unique pg db (`sqlfu_ui_<slug>`). The fixture creates the db on entry and drops it on exit.
- Added `pg` and `@sqlfu/pg` as devDependencies on `packages/ui`.
- Added `packages/ui/test/pg-studio.spec.ts` — first smoke spec: open the studio for a pg project, expect to see "posts" (the table from `definitions.sql`).
- **Two real gaps surfaced** while getting the spec to a deterministic red:

  1. **`db` factory contract**: `host.openDb(config)` does `await using database = await config.db()` — the factory must return a `DisposableAsyncClient` (with `client` + `[Symbol.asyncDispose]`), not a bare `AsyncClient`. The string form (`db: './app.sqlite'`) wraps it for you in `openLocalSqliteFile`; the factory form has to do it explicitly. Fixed in the template's `sqlfu.config.ts` — needs to be documented in `docs/configuration.md` (or wherever pg-config examples live) so users discover this without a 500.

  2. **`schema/get` RPC queries `sqlite_master` directly** (`packages/sqlfu/src/ui/router.ts` ~line 218): `select name, type, sql from sqlite_master where type in ('table', 'view') and ${excludeReservedSqliteObjects}`. Hits postgres with `relation "sqlite_master" does not exist`. The dialect already has `loadSchemaForTypegen` which returns the same name+kind+columns shape we need here; or we can add a thinner `Dialect.listRelations(client)` that returns just the names + sql/definition. Either way: route the RPC through the dialect.

### `schema.get` now works for pg (smoke spec green)

Inlined a pg branch directly in `packages/sqlfu/src/ui/router.ts` for three sqlite-only call sites:

- `listLiveRelations(client, dialectName)` — was an inline `select ... from sqlite_master ...`. Now branches: pg uses `pg_class` + `pg_namespace` (public schema, table/view kind); sqlite path unchanged.
- `getRelationColumns(client, relationName, dialectName)` — was `PRAGMA table_xinfo(...)`. Now branches: pg uses `pg_attribute` + `pg_class` (with primary-key detection via `pg_index`); sqlite path unchanged. `dialectName` defaults to `'sqlite'` so all the *other* call sites that don't know the dialect yet keep working.
- `getRelationCount(client, relationName, dialectName)` — count is dialect-neutral, but the identifier quoting differs. Branches between `sqliteQuoteIdentifier` and the new `pgQuoteIdentifier`.

Smoke spec is now green (`pg-studio.spec.ts > studio renders the schema for a pg project`). All 67 existing sqlite specs still pass — no regressions.

### Next steps

1. **Migrate the other 21 sqlite-only call sites in `router.ts`.** Quick scan: any reference to `sqlite_master`, `PRAGMA`, `sqliteQuoteIdentifier`, or `getRelationColumns(client, name)` (no third arg — defaulting to sqlite). Each will fail when its corresponding RPC is exercised by a pg-flavored spec.

2. **Decide: inline branches forever, or hoist into Dialect methods?** The current "pass `dialectName` as a string" pattern is fine for the few call sites we have today, but if the count grows past ~5-6 it's worth defining `Dialect.listLiveRelations(client)` / `Dialect.getRelationColumns(client, name)` / etc. and removing the `if (dialectName === 'postgresql')` branches from `router.ts` entirely. Either path is good; the inline branches are the cheaper *commit*, the Dialect methods are the cheaper *long-term maintenance*.

3. **Add more pg-side specs.** The smoke spec just asserts a table name is visible. The morning sweep should add one spec per "class of UI feature" (query runner, drift cards, migration list, sync flow) and let the reds surface the remaining sqlite-isms.

4. **Document the `db` factory disposable contract.** Pg users hitting that 500 will be confused. The fix in `template-project-pg/sqlfu.config.ts` is documented inline; needs a parallel mention in user-facing docs.
