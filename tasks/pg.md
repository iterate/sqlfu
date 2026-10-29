---
status: in-progress
size: huge
---

pgkit supported postgres. it has basically the same core features. we should be able to support it. This task tracks the multi-stage path to bringing postgres support to sqlfu via a separate `@sqlfu/pg` dev-dependency package, fronted by a pluggable `Dialect` interface on the main package's config.

## Status summary

Roughly 70% there. Steps one and two shipped (PRs #87, #88, #89) and `@sqlfu/pg@0.1.1` is on npm. A plain-tables Postgres project works end to end: `draft`, `migrate`, `check`, `sync`, `generate`, `format`, the UI, and `createNodePostgresClient` at runtime. Docs landed in PR #156 (Postgres guide + Coming from pgkit).

Schema reading is lossless for what migra understands (PR #161): serial/identity, enums, domains, functions, triggers, matviews, extensions, non-`public` schemas and generated columns all round-trip. Main gaps left: migra creates functions and composite types after tables (breaks a default/check calling a function), pg error classification, migra options. See "Step three" below.

Not a goal: drop-in pgkit replacement (no reading pgkit's migrations table, no inline `sql` tag typegen).

## Plan

### Step one — extract the Dialect interface (this branch)

The interface, step-one shape:

```ts
type Dialect = {
  name: string  // 'sqlite' | 'postgresql' | ...
  diffSchema(host: SqlfuHost, input: {baselineSql; desiredSql; allowDestructive}): Promise<string[]>
  formatSql(sql: string, options?: FormatSqlOptions): string
  quoteIdentifier(name: string): string
  defaultMigrationTableDdl(tableName: string): string
  withMigrationLock?<T>(client: AsyncClient, fn: () => Promise<T>): Promise<T>
  materializeTypegenSchema(host: SqlfuHost, config: SqlfuProjectConfig): Promise<MaterializedTypegenSchema>
  loadSchemaForTypegen(materialized: MaterializedTypegenSchema): Promise<ReadonlyMap<string, RelationInfo>>
  analyzeQueries(materialized: MaterializedTypegenSchema, queries: QueryAnalysisInput[]): Promise<QueryAnalysis[]>
}
```

The interface includes three typegen methods — `materializeTypegenSchema`, `loadSchemaForTypegen`, `analyzeQueries` — operating on an opaque `MaterializedTypegenSchema` handle (`AsyncDisposable` so `await using` releases dialect-owned resources). The pg dialect will satisfy these via pgkit-derived schemainspect/migra + a typegen of its own.

Design decisions (sign-off received in chat before this commit):

- **`InspectedDatabase` is dialect-internal, not exposed.** The current public boundary is already SQL-strings-in, SQL-strings-out (`diffBaselineSqlToDesiredSql`); structured schema models stay inside each dialect's diff impl. If we later need to expose them, make `Dialect<TSchema>` generic at that point.
- **`sqlReturnsRows` is NOT on the dialect.** It's a heuristic. Single internal helper handles both dialects' keywords (sqlite has `pragma`, pg has `show`/`fetch`/`table` — union of both is harmless overinclusion either way). If a real divergence shows up, promote then.
- **Migration tracking DDL: dialect renders the default `sqlfu` preset.** Dialect-locked presets (like `d1`) stay sqlite-bound — no attempt to make them portable.
- **`Dialect` is a config-level object, not a string discriminator.** `defineConfig({ dialect: sqliteDialect, ... })`. Default to `sqliteDialect` when omitted, so existing configs keep working. `@sqlfu/pg` exports its own `pgDialect`. Main package never imports pg code.
- **Minimal file moves.** New `src/dialect.ts` is a thin aggregator over existing locations. Existing files (`src/formatter.ts`, `src/schemadiff/sqlite/`, `src/typegen/analyze-vendored-typesql.ts`, etc.) stay where they are.
- **Runtime client adapters are NOT in scope for the dialect.** Adapters in `src/adapters/*` are transport, not dialect. Postgres runtime adapters (`NodePostgresLike`, `BunPostgresLike`) get added there in due course, separately.

### Step one checklist

- [x] Define `Dialect` type and export `sqliteDialect` aggregator from `packages/sqlfu/src/dialect.ts` _(landed: thin aggregator over existing functions; no new helpers)_
- [x] Add `dialect?: Dialect` to `SqlfuConfig`; resolve to `sqliteDialect` when omitted _(landed in `resolveProjectConfig`; `dialect` is required on `SqlfuProjectConfig` so internal callers always have a resolved dialect)_
- [x] Refactor schemadiff entrypoints to take `Dialect` and call `dialect.diffSchema(...)` _(landed: deleted the `diffSchemaSql` passthrough; production callers go through `context.config.dialect.diffSchema`; `compareSchemasForContext` widened to take the full context)_
- [x] Refactor formatter call sites to call `dialect.formatSql(...)` (where a config/dialect is in scope) _(no internal call sites have a dialect in scope today; see "Formatter dialect routing — step one scope" below)_
- [x] Migration runner: source default-preset DDL via `dialect.defaultMigrationTableDdl(tableName)`; wrap migrations in `dialect.withMigrationLock` if defined _(landed: `applyMigrations` / `readMigrationHistory` / etc. accept `dialect?` defaulting to `sqliteDialect`; async path wraps in `withMigrationLock` when set; production callers thread `context.config.dialect`)_
- [x] Replace ad-hoc `escapeIdentifier` / `escapeSqliteIdentifier` call sites with `dialect.quoteIdentifier` _(landed: both helpers deleted; call sites in `ui/router.ts` and `typegen/index.ts` use `sqliteDialect.quoteIdentifier`)_
- [x] Generalize `sqlReturnsRows` internally to cover both sqlite and pg keywords _(landed: regex now matches `select|with|pragma|explain|values|show|table|fetch` plus `RETURNING`)_
- [x] Full test suite + typecheck pass with no test changes (sqlite is still the default) _(landed: 1428 sqlfu tests + 67 ui tests pass; `pnpm --filter sqlfu typecheck` and `pnpm --filter @sqlfu/ui typecheck` clean; dev-project `sqlfu check` and `sqlfu generate` smoke-tested)_
- [x] Refactor typegen entrypoint to call `dialect.{materializeTypegenSchema, loadSchemaForTypegen, analyzeQueries}` _(landed: opaque `MaterializedTypegenSchema` handle threads through three method calls, disposes via `await using`. Sqlite impls are registered onto `sqliteDialect` at typegen/index.ts module-load — see "Side-effect registration of sqlite typegen impls" below.)_

### Step two — `@sqlfu/pg` (separate branch, later)

- [x] Create `packages/pg` with build/test wiring matching the existing packages _PR #88; root `pnpm test` runs it since PR #133_
- [x] Lift `schemainspect` + `migra` from `../pgkit/` (pure TS already; same `(baselineSql, targetSql) => diffSql` interface) _vendored under `packages/pg/src/vendor/`_
- [x] Wire `pgDialect.diffSchema` to the lifted impl _`packages/pg/src/impl/schemadiff.ts`_
- [x] `pgDialect.formatSql` via `sql-formatter` package directly (no vendoring) _`packages/pg/src/impl/format.ts`; `sqlfu format` and the lint plugin pick it up_
- [x] `pgDialect.analyzeQueries` via typesql (or pgkit's own typegen if typesql is too constrained — time-boxed spike) _PREPARE introspection + vendored pgkit typegen AST passes, `packages/pg/src/impl/typegen.ts`_
- [x] `pgDialect.withMigrationLock` via `pg_advisory_xact_lock` _`packages/pg/src/impl/migrations.ts`_
- [x] `pgDialect.defaultMigrationTableDdl` returning the pg version of the migrations table _same file; `applied_at timestamptz`_
- [x] `pgDialect.quoteIdentifier` (double-quote escaping is already pg-compatible — likely zero changes from sqlite) _`packages/pg/src/impl/identifiers.ts`_
- [x] Postgres runtime adapter(s) in `packages/sqlfu/src/adapters/` (separate concern, not the dialect package) _`createNodePostgresClient` only; no Bun/postgres.js adapters_
- [x] Docs and examples _PR #156: `packages/sqlfu/docs/guides/postgres.md`, `guides/pgkit.md`, wording fixes elsewhere. Guide verified end to end against the docker-compose pg_
- [ ] `dev-project` smoke test against postgres _UI tests use `packages/ui/test/template-project-pg/`; there's no hand-tinkering pg dev-project yet_

### Step three — make it work on real schemas

Found while verifying the PR #156 guide against a real Postgres. Each item is also listed in the guide's "Known gaps", which should shrink as these land.

- [x] Replace the hand-rolled renderer in `packages/pg/src/impl/schema.ts` (`renderCanonicalSchema`) with the vendored schemainspect, or skip the render step for pg. Repro: `pgDialect.materializeSchemaSql` then `diffSchema(rendered, original)`. Broken today: `serial` (`relation "t_id_seq" does not exist`), identity (spurious `add generated always as identity` in every later draft), enums and domains (`type does not exist`), stored generated columns, and functions/triggers/matviews/extensions/non-`public` schemas (redrafted every time). Plain tables, FKs, views, checks, indexes, `uuid default gen_random_uuid()` and jsonb/arrays are fine _PR #161: `renderSchema` in `packages/pg/src/impl/schema.ts` is migra diffing an empty inspector against the db; spec in `packages/pg/test/schema-round-trip.test.ts`. Also fixed vendored migra/schemainspect bugs (domain ordering, domain-over-enum, column collations)_
- [ ] migra: create functions and composite types before the tables that use them. A column default, check or generated column calling a user function, or a composite-type column, fails in both drafts and `generate` (`function ... does not exist`). Functions' `dependent_on` only covers views today (`deps.sql` reads `pg_rewrite`), so ordering needs attrdef/constraint → function deps from `pg_depend`, or signature checks for table rowtypes
- [x] pg typegen parity with SQLite: `limit 1` should return `Result | null` (returns an array); `insert/update/delete ... returning` wrappers should return rows (they call `client.run`); `where col = :param` params are typed nullable; FROM-less selects get no columns _PR #159: `packages/pg/src/impl/query-shape.ts`; spec in `packages/pg/test/generate-parity.test.ts`. FROM-less columns already worked; the gap was the row count. Details in `tasks/pg-real-schemas.md`_
- [x] Classify pg errors by SQLSTATE into `SqlfuError` kinds (always `'unknown'` today) _PR #159: `classifyPostgresError` in `packages/sqlfu/src/errors.ts`, picked by `system`; spec in `packages/pg/test/client-errors.test.ts`_
- [ ] Derive draft names for pg (`sqlfu draft` without `--name` writes `_migration.sql`; SQLite derives `_create_table_posts.sql`)
- [ ] Plumb migra options (`schema`, `excludeSchema`, extension flags) through `Dialect.diffSchema`
- [ ] `sqlfu init` option for Postgres (writes a SQLite config today)
- [ ] pg coverage for `goto`, `baseline` and `check` (only draft/migrate/drift have pg UI specs)

### Docs follow-up from PR #121 review

- [x] Clean up stale README/docs/blog claims about Postgres support. _updated `packages/sqlfu/README.md`, `packages/sqlfu/docs/errors.md`, `packages/sqlfu/docs/adapters.md`, and the intro blog to distinguish the runtime adapter from the unfinished broader `@sqlfu/pg` dialect/toolchain docs._

## Implementation notes

### Side-effect registration of sqlite typegen impls

`dialect.ts` is in the strict-tier import graph (`dist/index.js`), which forbids `node:*` imports — including those reached via dynamic `import()`. The strict check follows dynamic imports too, so neither static nor lazy imports of `typegen/index.ts` are viable from `dialect.ts`.

Workaround: `dialect.ts` ships `sqliteDialect` with throwing stubs for the three typegen methods. `typegen/index.ts` mutates them to real impls at module-load time. Heavy entries (CLI, api/exports, ui server) all transitively load `typegen/index.ts`, so the stubs only ever fire if a strict-tier consumer tries to invoke typegen — which is itself a bug.

Alternatives considered and why we didn't pick them:
1. **Move `sqliteDialect` to a heavy entry.** Breaks `defineConfig` defaulting in the strict-tier `config.ts`, which references the *value*.
2. **Make typegen methods optional (`typegen?: {...}`).** Forces every caller to nullish-check, hurts the dialect's "uniform contract" UX.
3. **Loosen the strict check to skip dynamic imports.** Drops an existing guarantee for one feature.

The smallest hammer was side-effect registration. Documented in `dialect.ts` header.

### Formatter dialect routing — step one scope

The `Dialect` type includes `formatSql`, but no internal call site currently has a dialect in scope:

- `src/api/exports.ts` — public `format(sql)` helper takes only `sql`, no config.
- `src/node/format-files.ts` — `formatSqlFiles(patterns, cwd)` powers the `sqlfu format` CLI; takes no config.
- `src/lint-plugin.ts` — eslint plugin runs without sqlfu project context.

For each of these, formatting is sqlite-only today and stays sqlite-only in step one. They're documented limitations (the `Dialect.formatSql` slot is wired into the interface for step two). When a `pgDialect` lands, these surfaces will need to grow optional config-loading paths to opt into pg formatting (e.g. `format` reads `sqlfu.config.ts`, eslint plugin gains a `dialect` option, etc.). None of those plumbing changes belong in step one — they're independent of the Dialect abstraction itself.
