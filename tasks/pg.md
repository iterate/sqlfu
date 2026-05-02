---
status: in-progress
size: huge
---

pgkit supported postgres. it has basically the same core features. we should be able to support it. This task tracks the multi-stage path to bringing postgres support to sqlfu via a separate `@sqlfu/pg` dev-dependency package, fronted by a pluggable `Dialect` interface on the main package's config.

## Status summary

Step one (in progress on branch `extract-dialect-interface`): extract a `Dialect` interface from the main package and reimplement the existing sqlite-only behavior as the default `sqliteDialect`. No file moves; the new `src/dialect.ts` is a thin aggregator over the existing implementations. Existing test suite must keep passing untouched. After this step, the public surface is unchanged for users (sqlite is still the default), but core code routes through `config.dialect` everywhere a dialect-specific decision is made.

Step two (later, separate branch): create `packages/pg` (`@sqlfu/pg`) that exports a `pgDialect` object satisfying the same interface, lifting schemainspect+migra from pgkit and using `sql-formatter` directly for postgres formatting. Typegen via typesql (or pgkit's own typegen if typesql doesn't fit).

## Plan

### Step one — extract the Dialect interface (this branch)

The interface, agreed shape:

```ts
type Dialect = {
  name: string  // 'sqlite' | 'postgresql' | ...
  diffSchema(baselineSql: string, targetSql: string): Promise<string>
  formatSql(sql: string): string
  analyzeQueries(input: {
    schemaSql: string
    queries: Array<{name: string; sql: string}>
  }): Promise<QueryTypeInfo[]>
  quoteIdentifier(name: string): string
  withMigrationLock?<T>(client: Client, fn: () => Promise<T>): Promise<T>
  defaultMigrationTableDdl(tableName: string): string
}
```

Design decisions (sign-off received in chat before this commit):

- **`InspectedDatabase` is dialect-internal, not exposed.** The current public boundary is already SQL-strings-in, SQL-strings-out (`diffBaselineSqlToDesiredSql`); structured schema models stay inside each dialect's diff impl. If we later need to expose them, make `Dialect<TSchema>` generic at that point.
- **`sqlReturnsRows` is NOT on the dialect.** It's a heuristic. Single internal helper handles both dialects' keywords (sqlite has `pragma`, pg has `show`/`fetch`/`table` — union of both is harmless overinclusion either way). If a real divergence shows up, promote then.
- **Migration tracking DDL: dialect renders the default `sqlfu` preset.** Dialect-locked presets (like `d1`) stay sqlite-bound — no attempt to make them portable.
- **`Dialect` is a config-level object, not a string discriminator.** `defineConfig({ dialect: sqliteDialect, ... })`. Default to `sqliteDialect` when omitted, so existing configs keep working. `@sqlfu/pg` exports its own `pgDialect`. Main package never imports pg code.
- **Minimal file moves.** New `src/dialect.ts` is a thin aggregator over existing locations. Existing files (`src/formatter.ts`, `src/schemadiff/sqlite/`, `src/typegen/analyze-vendored-typesql.ts`, etc.) stay where they are.
- **Runtime client adapters are NOT in scope for the dialect.** Adapters in `src/adapters/*` are transport, not dialect. Postgres runtime adapters (`NodePostgresLike`, `BunPostgresLike`) get added there in due course, separately.

### Step one checklist

- [ ] Define `Dialect` type and export `sqliteDialect` aggregator from `packages/sqlfu/src/dialect.ts`
- [ ] Add `dialect?: Dialect` to `SqlfuConfig`; resolve to `sqliteDialect` when omitted (`resolveDialect(config)` helper)
- [ ] Refactor schemadiff entrypoints to take `Dialect` and call `dialect.diffSchema(...)`
- [ ] Refactor formatter call sites to call `dialect.formatSql(...)` (where a config/dialect is in scope)
- [ ] Refactor typegen entrypoint to call `dialect.analyzeQueries({schemaSql, queries})`
- [ ] Migration runner: source default-preset DDL via `dialect.defaultMigrationTableDdl(tableName)`; wrap migrations in `dialect.withMigrationLock` if defined
- [ ] Replace ad-hoc `escapeIdentifier` / `escapeSqliteIdentifier` call sites with `dialect.quoteIdentifier`
- [ ] Generalize `sqlReturnsRows` internally to cover both sqlite and pg keywords
- [ ] Full test suite + typecheck pass with no test changes (sqlite is still the default)

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

## Implementation notes

(Updated as work progresses.)
