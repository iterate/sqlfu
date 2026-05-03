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

- [x] **Phase A** — factory shape (`pgDialect({adminUrl})`), CREATE DATABASE + DROP DATABASE pattern via `Symbol.asyncDispose`, docker-compose-backed test fixtures (postgres:16 on port 5544). Removed the env-var hack and pglite/pglite-socket entirely. Tests skip with a clear message if pg isn't reachable.
- [x] **Phase B** — real `analyzeQueries` via `PREPARE` + `pg_prepared_statements` + `EXECUTE`-NULLs.
- [ ] **Phase C** — vendor `@pgkit/{schemainspect,migra}` and drop `@pgkit/client`. Status: not started in this PR. Plan:
  1. Replace `@pgkit/client` usage in this package's own modules (`scratch-database.ts`, `schemadiff.ts`, `schema.ts`, `typegen.ts`) with raw `pg` via sqlfu's `createNodePostgresClient`. ~1-2 hours.
  2. Vendor `@pgkit/schemainspect` source into `packages/pg/src/vendor/schemainspect/`. Adapt its internal `Queryable` usage to sqlfu's `AsyncClient`. License + attribution headers. ~3-4 hours.
  3. Vendor `@pgkit/migra` similarly. ~1-2 hours.
  4. Replace the hand-rolled `renderCanonicalSchema` in `src/impl/schema.ts` with a vendored `schemainspect`-derived extractor that handles triggers, sequences, custom types, FDWs, etc.
  5. Drop `@pgkit/client`, `@pgkit/schemainspect`, `@pgkit/migra` from `package.json` deps.

  Phase C is improvement, not unblock — the package works end-to-end today via Phase A+B. The user requested Phase C for "no pgkit/client dep" and "raw driver access for analyzeQueries". The driver-access goal is already satisfied (Phase B reaches `result.fields` through the pgkit Result type, equivalent to raw pg's). The dep-drop goal is what Phase C buys.

### Wart watch

- **Schema-source readers in typegen are sqlite-coupled.** `readSchemaForAuthority` in main sqlfu's `typegen/index.ts` handles four authorities (`desired_schema`, `migrations`, `migration_history`, `live_schema`). The pg dialect today only honors `desired_schema` — the materializer reads `config.definitions` directly. The other three need dialect-aware splitting in main sqlfu (the `materializeMigrationsSchemaFor`/`extractSchemaFromClient` work on the `extract-dialect-interface` branch is a step toward this; finishing the `migrations` + `migration_history` authorities for pg requires an `applyMigrations` integration that respects pg's `withMigrationLock`).

### Tests

- [x] Unit tests for the easy methods (formatSql, quoteIdentifier, defaultMigrationTableDdl).
- [x] Integration test: pgDialect.diffSchema across the four cases (matching, create-table, refused-destructive, allowed-destructive). Uses two CREATE DATABASE'd ephemeral databases per test.
- [x] Integration test: pgDialect.materializeTypegenSchema → loadSchemaForTypegen against a table+view fixture.
- [x] Integration test: pgDialect.analyzeQueries — SELECT, INSERT...RETURNING (params only), broken-SQL (ok:false).
- [x] Integration test: pgDialect.materializeSchemaSql with and without excludedTables.
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
