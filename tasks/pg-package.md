---
status: in-progress
size: huge
base: extract-dialect-interface
---

Create `@sqlfu/pg` — the postgres dialect package — satisfying the `Dialect` interface defined in step one. Stacked on `extract-dialect-interface` (PR #87); this branch's PR uses that branch as its base.

## Status summary

Step two of the pg roadmap. Step one (`extract-dialect-interface`) extracted the `Dialect` interface and wired core code through it; sqlite is still the default. This branch creates `packages/pg` (`@sqlfu/pg`) which exports `pgDialect` satisfying the same contract. After this lands, users can `import {pgDialect} from '@sqlfu/pg'` and pass it to `defineConfig` to target postgres.

## Decisions (made autonomously while user is afk)

These are best-guess decisions; user can override on review.

- **Depend on `@pgkit/{client,schemainspect,migra}` instead of vendoring.** They're published on npm at v0.6.1 and the user wrote them; lifting algorithms directly is the user's stated goal. This is a smaller diff than copy-pasting and tracks upstream fixes for free. If the API churns, we adapt.
- **Don't depend on `@pgkit/typegen`.** Its dep on `pgsql-ast-parser` is what the user flagged as not-loved-and-maybe-unmaintained. Sqlfu's pg typegen will use a different approach (described below).
- **Use `pg` (the popular Node Postgres client) as the runtime DB driver inside the dialect.** Pure runtime concern for typegen/diff materialization (open a temp connection, apply schema, introspect). Users separately install `pg` and pass a `Pool` into the runtime client adapter.
- **`NodePostgresLike` adapter goes in the main `packages/sqlfu` package**, not in `@sqlfu/pg`. Adapters are transport, not dialect — this matches how the existing sqlite adapters live in main sqlfu.
- **Tests use [`pglite`](https://github.com/electric-sql/pglite)** for the dialect implementation tests. In-process postgres, no Docker required, fast. A separate set of integration tests can run against a real pg server when one's available — but they shouldn't gate CI.
- **Typegen approach for pg**: the `prepare` statement introspection trick. Connect to a temp schema with the user's DDL applied, `PREPARE` each query, then read column types and parameter types from `pg_catalog`. Output shape is `QueryAnalysis[]` (same as sqlite's typesql output). Avoids parser dependencies entirely — the postgres server is the parser. Implementation complexity: moderate; pgkit's `@pgkit/typegen` uses a different approach (pgsql-ast-parser) so this is greenfield.
- **Materialization: temp schema, not temp database.** Faster and parallelizable — multiple typegen runs against the same pg server can each use their own random schema name. Schema is dropped on disposal.

## Plan

### Package shape

- `packages/pg/package.json` — `@sqlfu/pg`, type:module, deps: `@pgkit/client`, `@pgkit/schemainspect`, `@pgkit/migra`, `pg`, `sql-formatter`. Peer dep on `sqlfu`.
- `packages/pg/src/index.ts` — exports `pgDialect`.
- `packages/pg/src/dialect.ts` — the `Dialect` impl, satisfying the contract from `sqlfu`.
- `packages/pg/src/{schemadiff,typegen,format,migrations}.ts` — concern-grouped impls, each contributing methods to `pgDialect`.
- `packages/pg/test/` — vitest, pglite-backed.
- `packages/pg/tsconfig.{json,build,typecheck}.ts` — match existing packages.

### Method-by-method implementation

- [x] `name: 'postgresql'`
- [x] `formatSql` — via `sql-formatter` (postgres dialect). _(Sqlfu-style compaction not yet layered in; can come later.)_
- [x] `quoteIdentifier` — pg double-quote, identical rule to sqlite.
- [x] `defaultMigrationTableDdl(tableName)` — pg flavor with `timestamptz`.
- [x] `withMigrationLock` — `pg_advisory_xact_lock(<deterministic FNV-1a 64-bit key>)` inside `client.transaction`.
- [x] `diffSchema` — `@pgkit/migra` against two ephemeral databases on the configured `adminUrl`. Each scratch db disposed via `Symbol.asyncDispose`.
- [x] `materializeSchemaSql` (NEW) — `CREATE DATABASE`, apply DDL, render canonical schema via hand-rolled `pg_catalog` queries, drop database. _Wart: simplified DDL renderer; Phase C (vendoring) replaces with full schemainspect-derived extractor._
- [x] `extractSchemaFromClient` (NEW) — same renderer as above but against a live AsyncClient. Throws on sync clients (no sync pg drivers exist).
- [x] `materializeTypegenSchema` — `CREATE DATABASE`, apply DDL, return handle. Disposal closes the client and drops the database.
- [x] `loadSchemaForTypegen` — `pg_class` + `pg_attribute` + `pg_namespace` queries scoped to the materialized database's `public` schema. Returns the dialect-neutral `RelationInfo` map.
- [x] `analyzeQueries` — `PREPARE` + `pg_prepared_statements.parameter_types` + `EXECUTE`-with-NULLs (in a savepoint) for `result.fields`. Postgres is the parser. _Known limitation: INSERT/UPDATE/DELETE with RETURNING gets params right but result columns come back empty — EXECUTE-with-NULLs hits NOT NULL constraints. Tracked for a follow-up._

### Main-package additions

- [x] `packages/sqlfu/src/adapters/pg.ts` — `NodePostgresLike` interface + `createNodePostgresClient(pool)` factory. Type-only; users install `pg` separately and pass a `Pool`. Transactions acquire a `PoolClient` via `pool.connect()`.

### Phases

- [x] **Phase A** — factory shape (`pgDialect({adminUrl})`), CREATE DATABASE + DROP DATABASE pattern via `Symbol.asyncDispose`, docker-compose-backed test fixtures (postgres:16 on port 5544). Removed env-var hacks and pglite/pglite-socket entirely.
- [x] **Phase B** — real `analyzeQueries` via `PREPARE` + `pg_prepared_statements` + `EXECUTE`-NULLs (with a `CREATE TEMP VIEW` upgrade for SELECT result-column introspection).
- [x] **Phase C2** — vendored `@pgkit/schemainspect` into `packages/pg/src/vendor/schemainspect/`. Internal `Queryable` shim adapts sqlfu's `AsyncClient`.
- [x] **Phase C3** — vendored `@pgkit/migra` into `packages/pg/src/vendor/migra/`. `pgDialect.diffSchema` wired to the vendored migra. `@pgkit/{client,schemainspect,migra}` deps removed from package.json.
- [x] **Phase C4** — `@pgkit/client` removed from this package's own modules (`scratch-database.ts`, `schemadiff.ts`, `schema.ts`, `typegen.ts`). Single point where `pg.Pool` is instantiated; everything downstream uses sqlfu's `AsyncClient` interface.
- [x] **Phase C5** — vendored `@pgkit/typegen` AST passes (`query/parse.ts`, `query/column-info.ts`, `query/analyze-select-statement.ts`, `query/parameters.ts`, plus minimal `types.ts`/`util.ts`). `pgsql-ast-parser` added as a dep, scoped strictly to the vendored typegen module. `pgDialect.analyzeQueries` rewritten to drive the vendored pipeline: PREPARE → DescribedQuery → vendored getColumnInfo (which uses the in-pg `analyze_select_statement_columns` function for view-column-usage analysis) → AnalysedQuery → sqlfu's QueryAnalysis. nullability + DML+RETURNING result columns now both work. The Phase B SELECT-only `CREATE TEMP VIEW` workaround is gone.
- [x] **Phase C6 (initial)** — lifted 28 migra schema-diff fixtures from pgkit/migra/test/{FIXTURES,NEW_FIXTURES} into `packages/pg/test/fixtures/migra/`. Runner at `test/migra-fixtures.test.ts` walks each `<name>/{a,b,expected}.sql` trio through `pgDialect.diffSchema`.
- [x] **Phase C7** — canonical `.md` fixture format + un-skip pass + typegen lift.
    - Migra fixtures consolidated to one `<name>.md` per case (sqlfu's existing typegen fixture format — `## case` heading + nested `<details>` blocks + `(path)`-tagged code fences). Vestigial `additions.sql`/`expected2.sql` files dropped (never referenced).
    - 9 of 11 drift fixtures un-skipped: regenerated expected SQL against pg16 (pg_get_viewdef no longer qualifies columns), added a one-time `ensureFixtureRoles()` setup that creates `schemainspect_test_role`. 2 remain skipped for fundamental reasons (postgres doesn't record ACL entries for superusers in `privileges`; `generated_added`'s a.sql/b.sql leave the relevant table identical).
    - Typegen fixtures lifted from pgkit's `*.test.ts` inline snapshots into 10 `.md` files under `fixtures/typegen/`: joins, CTEs, scalar subqueries, DML+RETURNING, type mappings, enums, views, table-returning functions, nullability hints, primitives, limitations. Output is a JSON snapshot of the analyzer's per-column `name`/`tsType`/`notNull` per query.
    - Three real bugs surfaced and fixed: `import * as pluralize`/`* as lodash` were namespace-importing CJS modules where named exports get assigned dynamically (cjs-module-lexer can't see them); switched to default-import. The vendored `Queryable` shim was missing `maybeOne`/`one` — added. `formatError` now includes stack traces under `SQLFU_PG_DEBUG=1`.

**Net suite state: 50 passing / 7 skipped / 0 todo**. The 7 skipped: 5 migra-args (deferred), 1 superuser-ACL fundamental, 1 upstream-malformed fixture.

Future Phase C work (not in this PR):

- [ ] **pg17 `result_types` integration** — when the connected pg is 17+, skip EXECUTE-NULLs entirely and read `pg_prepared_statements.result_types`. Falls back on older pg.
- [ ] **Plumb migra args through `Dialect.diffSchema`** — `schema`, `excludeSchema`, `createExtensionsOnly`, `ignoreExtensionVersions`. Unblocks the 5 skipped fixtures.
- [ ] **Literal-only query columns** — currently `select 1 as a` returns `columns: []` because `pg_get_viewdef` doesn't record column origins for FROM-less queries. Pgkit handles this via `\gdesc`; we don't have an equivalent yet. Documented in `fixtures/typegen/primitives.md`.

### Wart watch

- **Schema-source readers in typegen are sqlite-coupled.** `readSchemaForAuthority` in main sqlfu's `typegen/index.ts` handles four authorities (`desired_schema`, `migrations`, `migration_history`, `live_schema`). The pg dialect today only honors `desired_schema` — the materializer reads `config.definitions` directly. The other three need dialect-aware splitting in main sqlfu (the `materializeMigrationsSchemaFor`/`extractSchemaFromClient` work on the `extract-dialect-interface` branch is a step toward this; finishing the `migrations` + `migration_history` authorities for pg requires an `applyMigrations` integration that respects pg's `withMigrationLock`).

### Tests

- [x] Unit tests for the easy methods (formatSql, quoteIdentifier, defaultMigrationTableDdl).
- [x] Integration test: pgDialect.diffSchema across the four cases (matching, create-table, refused-destructive, allowed-destructive). Uses two CREATE DATABASE'd ephemeral databases per test.
- [x] Integration test: pgDialect.materializeTypegenSchema → loadSchemaForTypegen against a table+view fixture.
- [x] Integration test: pgDialect.analyzeQueries — SELECT (with notNull inference), INSERT...RETURNING (with result columns + nullability), LEFT JOIN (smoke), broken-SQL (ok:false).
- [x] Integration test: pgDialect.materializeSchemaSql with and without excludedTables.
- [x] Migra fixture suite: 28 lifted from pgkit, 12 passing, 5 skipped, 11 todo.
- [ ] Integration test: pgDialect.withMigrationLock blocks concurrent calls. Two real pg connections needed for genuine concurrency; deferred until the migration-runner integration with pg lands.

### Out of scope for this PR

- Postgres dev-project at `packages/ui/test/projects/dev-project-pg/` — useful but adds complexity, leave for a follow-up.
- pgDialect-aware variants of the formatter call sites (eslint plugin, `sqlfu format` CLI, public `format(sql)`). These currently default to sqlite; making them config-aware is a separate plumbing task.
- UI server / studio support for postgres. The schema browser uses sqlite-specific PRAGMA queries; making it dialect-aware is its own project.

## Implementation notes

### What landed

7 commits on this branch. All of `@sqlfu/pg`'s methods are wired up except `analyzeQueries` (typed stub). 12 pg-side tests pass; the existing 1428 sqlfu tests + 67 ui tests still pass too.

- **Skeleton** (commit `4b18a79`): packages/pg with proper tsconfig/vitest wiring, deps on `@pgkit/{client,schemainspect,migra}` and `sql-formatter`, peer dep on `sqlfu`.
- **NodePostgresLike adapter** (commit `f0d9a0e`): in main sqlfu (transport, not dialect). `createNodePostgresClient(pool)` returns an `AsyncClient`. Translates sqlfu's prepared-statement params (named-Record or positional) into pg's `$1, $2, …` shape; transactions acquire a `PoolClient` via `pool.connect()` so begin/commit land on the same connection.
- **diffSchema via migra** (commit `6fb9287`): two pgkit clients pointing at separate databases, run `Migration.create + add_all_changes`, return statements as a string array. Env-var-driven for now (`SQLFU_PG_DIFF_BASELINE_URL` / `SQLFU_PG_DIFF_DESIRED_URL`). Tests use a `startPglitePairFixture` that spins up two pglite-socket instances.
- **typegen materialize+loadSchema**: temp schema, `set search_path`, apply DDL; introspect via `pg_class` + `pg_attribute`; produces the dialect-neutral `RelationInfo` map. Reads `SQLFU_PG_TYPEGEN_URL` from env. Currently honors only `generate.authority='desired_schema'` because the schema-source readers in main sqlfu's typegen are sqlite-only.

### Warts identified (still open)

1. **Env-var hack for connection URLs.** `SQLFU_PG_DIFF_BASELINE_URL`, `SQLFU_PG_DIFF_DESIRED_URL`, `SQLFU_PG_TYPEGEN_URL` should all become proper config fields. Likely shape: a new `dialectConfig` block (or letting the dialect read its own keys off `config.db`'s connection string for typegen).
2. **Schema-source readers in typegen are sqlite-coupled.** `readSchemaForAuthority` (in main sqlfu's `typegen/index.ts`) handles four authorities: `desired_schema`, `migrations`, `migration_history`, `live_schema`. Three of them call sqlite-specific helpers (`materializeDefinitionsSchemaFor`, `materializeMigrationsSchemaFor`, sqlite-only `extractSchema`) so they don't work for pg. The pg dialect today only honors `desired_schema` (read `definitions.sql` directly). A follow-up should lift these readers into a dialect-neutral form so all four authorities work for both dialects.
3. **`?` → `$N` translator is layered on top of a sqlite-flavored rewriter.** `rewriteNamedParamsToPositional` was named for the sqlite case. The pg adapter calls it then converts each `?` to `$1, $2, …`. Cleaner would be to parameterize the rewriter on placeholder style. Tracked in `adapters/pg.ts` source.
4. **`analyzeQueries` is a typed stub.** Real PREPARE-statement introspection lands in a follow-up. Postgres becomes the parser (no third-party AST dep needed); the impl reads parameter and result types from `pg_catalog` after `PREPARE`. The trickiest bit will be result-set introspection — needs the wire-protocol Describe message which `@pgkit/client` doesn't expose directly. May need to drop down to raw `pg` for this.
5. **withMigrationLock test deferred.** Pglite-socket has a single global query queue (process-wide), so the "two concurrent calls block on each other" test would always pass trivially. Real concurrency check needs a real pg server (or two separate pglite-socket processes). Deferred.
6. **Postgres dev-project, UI server postgres support, dialect-aware formatter call sites.** All explicitly out of scope per the task spec.
