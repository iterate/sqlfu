---
status: in-progress
size: medium
---

# Speak reylo's Standard Query interface

## Status

Spec fleshed out; implementation not started.

## Background

[reylo](https://github.com/colinhacks/reylo) (Colin McDonnell, MIT) imports `.sql` files as typed queries. Every reylo query is a
**Standard Query** (`StandardQueryV1`, [`src/standard-query.ts`](https://github.com/colinhacks/reylo/blob/e77a02124e123ac56f3c498a22305564b24720d8/src/standard-query.ts)),
a spec in the Standard Schema family:

```ts
query['~standard'] = {
  version: 1,
  vendor: 'reylo',
  query: {
    dialect: 'sqlite',            // 'postgres' | 'mysql' | 'sqlite' | string
    text: 'select ... where id = ?', // positional placeholders
    encode(input) { return [1] },    // input -> raw values to bind
    decode(rows) { return ... },     // every row as an array of raw values, in select order -> output
  },
}
```

A driver that supports it binds `encode(input)`, reads every row as an **array** of raw values, and returns `decode(rows)`.
`decode` owns cardinality (array / row-or-null / undefined).

The spec only lives in reylo's repo for now (added after the v0.6.0 tag, in reylo commit `4cff3ac`), so it may churn.

Goal: sqlfu speaks it both ways.

1. A sqlfu client runs any Standard Query, e.g. a reylo-imported `.sql` file.
2. sqlfu's generated wrappers are Standard Queries, so other Standard Query-aware drivers can run them.

## Decisions (made by the agent on the user's behalf; review these first)

- **Vendor the types, don't depend on reylo.** `src/vendor/standard-query.ts`: `StandardTypedV1` (from `@standard-schema/spec`
  1.1.0, which reylo vendors) and `StandardQueryV1`, verbatim, types only. Attribution banner pins reylo commit `e77a021`.
- **New client method `client.execute(query, input)`, not overloads of `all`/`run`/`iterate`.** The spec defines one operation
  (bind, read arrays, return `decode(rows)`), and `decode` decides cardinality. `client.all(findOne, ...)` returning a single row
  would make `all` lie. `run` already means "return metadata", and `iterate` can't stream when `decode` needs every row.
  Sync clients return the output; async clients return a promise of it.
- **New client primitive `client.values(query)`: rows as arrays of raw values in select order.** `decode` needs arrays.
  Turning sqlfu's object rows back into arrays (`Object.values`) is wrong in two ways that fail silently: duplicate column
  names collapse (`select a.id, b.id`), and integer-like column names are reordered by JS (`select name, 1` gives `[1, name]`).
  Every supported driver has a native array mode (better-sqlite3/libsql/turso `.raw()`, bun `.values()`, node:sqlite
  `setReturnArrays`, D1 `.raw()`, DO cursor `.raw()`, sqlite-wasm `rowMode: 'array'`, expo `executeForRawResultAsync`,
  @libsql/client and turso-serverless rows are already array-like, pg `rowMode: 'array'`), so each adapter implements it
  natively. `instrument` hooks see it as
  operation `'values'`, and adapter error mapping covers it, so `execute` gets both for free.
- **On Postgres, `values` returns each value's text** (pg type parsers off), because that's the Standard Query raw form for
  Postgres. That makes `values` "raw values", not "`all` but arrays". Documented on the method.
- **`execute` refuses a query for another database** (`dialect` vs `client.system`; sqlfu's `postgresql` = the spec's
  `postgres`), as the spec asks.
- **Generated wrappers get a `'~standard'` property built by a small runtime helper exported from `sqlfu`**
  (`standardQuery({sql, query, columns, output})`), so the generated code stays short. The helper turns raw arrays into rows
  keyed by the raw column names, then calls the wrapper-specific `output` (the same mapping + cardinality the wrapper
  function applies). `encode` is `query(params).args`, with booleans bound as `1`/`0` (SQLite's raw form).
- **Scope of generated `~standard`:** `runtime: 'sqlfu'` wrappers (sync and async, no validator), DDL wrappers, SQLite dialect.
  Left out, each for a reason:
  - queries with runtime-expanded params (`in (:ids)`, `values :posts`): their text depends on the input, which the spec
    doesn't allow. Leaving `~standard` off makes `client.execute(thatQuery)` a type error rather than a runtime one.
  - queries with separate `data` + `params` arguments (`update ... set x = :x where id = :id`): Standard Query input is one
    value, and inventing a `{data, params}` shape just for this deserves its own decision. Follow-up.
  - validator wrappers: decode should validate rows like the wrapper does, which needs per-validator parse code. Follow-up.
  - native-driver and Effect runtimes: those wrappers deliberately don't import `sqlfu` at runtime. Follow-up if wanted.
  - Postgres-dialect wrappers: decode would need per-column text decoders (reylo's `textDecoder`). Follow-up.
- **Inline `sql` tags don't get `~standard`.** `sql\`...\`` has no column list at runtime, so `decode` can't turn arrays into
  rows. reylo makes the same call ("A query defined by hand without its columns cannot map rows to its output"), but by
  throwing at decode time. sqlfu prefers the compile-time error: no `~standard`, so `client.execute(sql\`...\`)` doesn't
  type-check. Possible follow-up: inline-config typegen already rewrites `sql.many<...>` type args, and could also write the
  column list.
- **`decode` mirrors the generated wrapper exactly** (including `one` mode returning `rows[0]` without an empty check; that's
  `tasks/one-mode-throw-on-empty.md`).

## Checklist

- [ ] vendor `StandardTypedV1` + `StandardQueryV1` types with attribution; export the types from `sqlfu`
- [ ] `values` on `SyncClient`/`AsyncClient`, implemented in every adapter + error wrappers + `instrument` + node host
- [ ] `execute` on `SyncClient`/`AsyncClient`, built once on `values` + `encode`/`decode`, dialect check
- [ ] spec test, direction 1: a hand-written Standard Query runs through a sqlfu client
- [ ] `standardQuery` runtime helper + typegen emits `'~standard'` for in-scope wrappers
- [ ] spec test, direction 2: a generated wrapper runs through bare `node:sqlite` as a Standard Query driver
- [ ] regenerate typegen fixtures
- [ ] docs: a short section where users would look (client docs), with a link to the spec
- [ ] draft PR

## Implementation log
