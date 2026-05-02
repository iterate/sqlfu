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

- [ ] `name: 'postgresql'`
- [ ] `formatSql` — via `sql-formatter` (postgres dialect). No vendoring. Stretch: thin wrapper for sqlfu-style compaction matching the sqlite formatter's `style: 'sqlfu'` clauses.
- [ ] `quoteIdentifier` — pg uses double-quote escaping, identical to sqlite's; reuse the same logic.
- [ ] `defaultMigrationTableDdl(tableName)` — pg flavor: `text` columns, `timestamptz` for `applied_at`. Byte-for-byte parity with the sqlite preset isn't required; the migration runner reads the `name`/`checksum`/`applied_at` columns abstractly.
- [ ] `withMigrationLock` — `SELECT pg_advisory_xact_lock(<sqlfu-namespaced-key>)` inside a transaction wrapping the inner fn.
- [ ] `diffSchema` — defer to `@pgkit/migra`. Adapter input → `migra` call → string array out. Will need to materialize baseline + desired into temp schemas, run migra, return statements.
- [ ] `materializeTypegenSchema` — open a pg connection from `config.db` factory or env var, create a uniquely-named temp schema, apply the schema SQL (via `readSchemaForAuthority`-equivalent — likely pulls config.generate.authority into a dialect-neutral helper), return a handle whose `[Symbol.asyncDispose]` drops the schema and closes the connection.
- [ ] `loadSchemaForTypegen` — query `information_schema.tables/columns/views` (or `pg_catalog`) inside the materialized schema, build the dialect-neutral `RelationInfo` map.
- [ ] `analyzeQueries` — `PREPARE` each query, introspect via `pg_catalog`. Output is `QueryAnalysis[]` matching the existing typesql shape.

### Main-package additions

- [ ] `packages/sqlfu/src/adapters/pg.ts` — `NodePostgresLike` interface (type-only) + `createNodePostgresClient(pool)` factory matching the existing adapter pattern (returns `AsyncClient` with `system: 'postgresql'`). Uses `Pool.query` / `Pool.connect` for transactions.

### Wart watch

- **Materialization needs a real pg server.** Sqlite's typegen materializes to an on-disk file with zero infrastructure; pg's needs a connection. The `host.openScratchDb` interface as currently shaped doesn't help (it returns a sqlite scratch DB). Two choices:
  1. Read `config.db` (the user-configured connection) and create a temp schema there. Requires `config.db` to be a pg server.
  2. Add a `scratchDbUrl` config field for pg-only typegen scenarios.
  Going with option 1 for now; documented in pgDialect.materializeTypegenSchema.
- **Schema-source readers in typegen are sqlite-specific.** `readSchemaForAuthority` in `typegen/index.ts` reads `definitions.sql`, replays migrations, etc. — but the materialization helpers it calls (`materializeDefinitionsSchemaFor` etc.) all use `host.openScratchDb` (sqlite scratch). The pg version of `materializeTypegenSchema` will need its own readers OR the readers need a dialect-aware split. Going to start with a parallel readers stack in `@sqlfu/pg`; if there's a clean shared seam later, refactor in a follow-up.

### Tests

- [ ] Unit tests for the easy methods (formatSql, quoteIdentifier, defaultMigrationTableDdl).
- [ ] Integration test: pgDialect.diffSchema on a baseline → desired schema using pglite.
- [ ] Integration test: pgDialect.materializeTypegenSchema → loadSchemaForTypegen → analyzeQueries on a small fixture.
- [ ] Integration test: pgDialect.withMigrationLock blocks concurrent calls (verify advisory lock).

### Out of scope for this PR

- Postgres dev-project at `packages/ui/test/projects/dev-project-pg/` — useful but adds complexity, leave for a follow-up.
- pgDialect-aware variants of the formatter call sites (eslint plugin, `sqlfu format` CLI, public `format(sql)`). These currently default to sqlite; making them config-aware is a separate plumbing task.
- UI server / studio support for postgres. The schema browser uses sqlite-specific PRAGMA queries; making it dialect-aware is its own project.

## Implementation notes

(Updated as work progresses.)
