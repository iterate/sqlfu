---
status: step-one-ready-for-review
size: huge
---

pgkit supported postgres. it has basically the same core features. we should be able to support it. This task tracks the multi-stage path to bringing postgres support to sqlfu via a separate `@sqlfu/pg` dev-dependency package, fronted by a pluggable `Dialect` interface on the main package's config.

## Status summary

Follow-up docs cleanup in progress on `bedtime/2026-05-15-pg-docs-followup`: the scope is small and docs-only. The main target is stale README/docs/blog wording that still implies no Postgres runtime adapter exists; the missing piece after this cleanup is the broader `@sqlfu/pg` dialect/toolchain story and its dedicated examples.

Step one (ready-for-review on branch `extract-dialect-interface`, PR #87): extracted the `Dialect` interface from the main package and re-implemented the existing sqlite-only behavior as the default `sqliteDialect`. New `src/dialect.ts` is a thin aggregator over existing implementations (no file moves). All existing tests pass untouched (1428 sqlfu + 67 ui). Public surface is unchanged for users (sqlite is still the default); core code routes through `config.dialect` for schemadiff, identifier quoting, migration table DDL, and migration locking. Formatter and typegen routing deferred to step two (formatter call sites all lack a config in scope today; typegen materialization is tangled with sqlite-specific private helpers in `typegen/index.ts` and is best refactored when the pg side drives the requirement).

Step two (later, separate branch): create `packages/pg` (`@sqlfu/pg`) that exports a `pgDialect` object satisfying the same interface, lifting schemainspect+migra from pgkit and using `sql-formatter` directly for postgres formatting. Typegen via typesql (or pgkit's own typegen if typesql doesn't fit).

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

- [ ] Create `packages/pg` with build/test wiring matching the existing packages
- [ ] Lift `schemainspect` + `migra` from `../pgkit/` (pure TS already; same `(baselineSql, targetSql) => diffSql` interface)
- [ ] Wire `pgDialect.diffSchema` to the lifted impl
- [ ] `pgDialect.formatSql` via `sql-formatter` package directly (no vendoring)
- [ ] `pgDialect.analyzeQueries` via typesql (or pgkit's own typegen if typesql is too constrained — time-boxed spike)
- [ ] `pgDialect.withMigrationLock` via `pg_advisory_xact_lock`
- [ ] `pgDialect.defaultMigrationTableDdl` returning the pg version of the migrations table
- [ ] `pgDialect.quoteIdentifier` (double-quote escaping is already pg-compatible — likely zero changes from sqlite)
- [ ] Postgres runtime adapter(s) in `packages/sqlfu/src/adapters/` (separate concern, not the dialect package)
- [ ] Examples / docs / `dev-project` smoke test against postgres

### Docs follow-up from PR #121 review

- [ ] Clean up stale README/docs/blog claims about Postgres support. _target: distinguish the runtime adapter that exists today from the unfinished broader `@sqlfu/pg` dialect/toolchain story._

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
