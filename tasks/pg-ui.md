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

### Next steps for the morning

1. Re-route `schema.get` through a dialect method. Other RPCs in `router.ts` likely have the same shape (grep for `sqlite_master`, `PRAGMA`). Each is a per-RPC fix.
2. Once `schema/get` works, the smoke spec turns green and the next red surfaces — repeat.
3. Probable hot spots from skim: `getRelationColumns`, `getRelationCount`, query-runner endpoints, migration-list endpoints. All probably need the same dialect-routing treatment.

The pattern is: **the UI server reaches into sqlite system tables instead of going through `dialect.*` methods**. Fixing each one is mechanical; the design question is whether to grow `Dialect` with a few more methods or to repurpose existing ones (`loadSchemaForTypegen` covers most of `schema/get`'s needs already).
