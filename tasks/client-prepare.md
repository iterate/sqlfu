---
status: ready
size: medium
---

# Add `client.prepare(sql)` and retire `client.driver` reach-through

## Motivation

sqlfu currently prepares every query at the point of execution — each
`client.all(query)` call internally does `database.prepare(query.sql).bind(...).all()`
and throws the prepared statement away. That's a perf cliff for hot paths
(migrations, generated wrappers, the query runner) and — more importantly — it
means any caller that wants to do two things with one prepared statement has
to reach into `client.driver` directly and talk to the raw driver API. That's
exactly what `execAdHocSql` in `packages/sqlfu/src/node/host.ts` used to do,
and it's how the ERR_DISPOSED crash in #58 happened: the sync driver-reach
path silently returned un-awaited Promises on async drivers.

The fix in #59 routed `execAdHocSql` through the Client API instead, but had
to paper over two gaps:

1. **Named params.** The Client API is positional-only (`args: QueryArg[]`).
   `execAdHocSql` now rewrites `:name` / `$name` / `@name` to `?` with a tiny
   SQLite tokenizer in-file. Correct enough for the UI SQL runner, but it
   isn't the real shape — and the tokenizer doesn't belong in node-host.ts.
2. **Double prepare.** For a read/write classification, it now calls
   `prepare(sql).all()` or `prepare(sql).run()` (one of them). That's fine for
   a one-shot interactive runner, but `applyMigrations` for example calls
   `client.run(insertQuery)` once per migration and prepares fresh each time.

A `client.prepare(sql)` handle solves both:

```ts
interface PreparedStatement<TRow> {
  all(params?: Record<string, unknown> | QueryArg[]): Promise<TRow[]>;
  run(params?: Record<string, unknown> | QueryArg[]): Promise<RunResult>;
  iterate(params?: Record<string, unknown> | QueryArg[]): AsyncIterable<TRow>;
  [Symbol.dispose](): void;
}
```

Adapters wrap their driver's native prepared-statement object, so named params
flow through the driver directly (node:sqlite, better-sqlite3, libsql all
support them). Callers that want prepare-once-execute-many get it. `execAdHocSql`
goes back to `prepare → try .all / fall back to .run` on a single statement.

## Scope

- Add `prepare(sql: string)` to the `Client` / `AsyncClient` / `SyncClient`
  interfaces and to every adapter:
  `node-sqlite`, `better-sqlite3`, `bun`, `d1`, `libsql-client`,
  `libsql`, `turso-database`, `turso-serverless`, `expo-sqlite`,
  `sqlite-wasm`, `durable-object`.
- Rewrite `execAdHocSql` in `packages/sqlfu/src/node/host.ts` to use
  `client.prepare(sql)` — delete the in-file `rewriteNamedParamsToPositional`
  tokenizer and the `sqlReturnsRows` keyword classifier.
- Rewrite `packages/ui/src/demo/browser-host.ts`'s `execAdHocSql` the same way
  against a prepared statement on sqlite-wasm.
- Leave `client.all` / `client.run` / `client.raw` / `client.iterate` as they
  are. They're convenience wrappers over `prepare + dispose`. (Optionally add
  prepare-caching behind them — separate follow-up.)

## Non-goals

- **Prepare-statement caching.** A per-client LRU of SQL string → prepared
  statement would be a big win for migrations and generated-wrapper hot paths,
  but it's a separate design question (cache size, invalidation on schema
  change) and doesn't need to block the API shape.
- **Type-level bind helpers.** Keeping `params` as a loose
  `Record<string, unknown> | QueryArg[]` is fine for `execAdHocSql`. Generated
  wrappers already typecheck their args at the call site before constructing
  the query shape.
- **Migration of every call site in sqlfu to use `prepare`.** The one that
  motivates this is `execAdHocSql`; migrations and other places can stay on
  the convenience wrappers. Refactor those opportunistically.

## Driver notes

Most drivers already expose native prepared statements; this is mostly
plumbing:

- **node:sqlite / better-sqlite3**: `StatementSync` with `.all() / .run() / .iterate()`.
- **libsql / libsql-client / turso-***: `client.prepare(sql)` returns a
  `Statement` with `.execute(...)` — need to wrap `all` vs `run` on top.
- **D1**: `db.prepare(sql)` returns a `D1PreparedStatement` with
  `.bind(...values).all<T>() / .run() / .first<T>()`. Named-param support is
  limited on D1 — accept the documented gap or rewrite at the adapter level
  (same tokenizer, moved out of node-host).
- **DO storage.sql**: No prepare concept — `storage.sql.exec(sql, ...bindings)`
  always. The adapter's `prepare` is a thin shim that captures the sql string
  and re-issues `exec` on every call. Fine because DO writes aren't expensive.
- **sqlite-wasm**: `db.exec({sql, bind, returnValue: 'resultRows'})` already
  accepts bindings in either shape.

## Tests

- A new test file `test/adapters/prepare.test.ts` that runs the same suite
  across every adapter via an adapter matrix, exercising: positional params,
  named params, reusing one prepared statement for `.all` then `.run`, and
  iterating rows.
- Keep the existing `test/node/exec-ad-hoc-sql.test.ts`; it's a thin check
  that execAdHocSql routes through whatever implementation replaces the
  in-file tokenizer.

## Related

- #58 (closed) — the bug that exposed the shape mismatch.
- #59 — this PR's stopgap: tokenizer + keyword classifier in node-host.ts.
