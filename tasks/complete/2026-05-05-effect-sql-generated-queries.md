---
status: complete
size: medium
branch: effect-sql-generated-queries
pr: https://github.com/mmkal/sqlfu/pull/90
supersedes: https://github.com/mmkal/sqlfu/pull/83
---

# Generate native Effect SQL query functions

## Status

Implementation is complete in draft PR #90. The PR adds experimental
`generate.runtime: 'effect-v3' | 'effect-v4-unstable'` support, generated Effect
SQL wrappers, runtime and fixture coverage, docs, and package peer/dev
dependencies for Effect SQL. The main remaining work is review/iteration before
merge.

## Goal

Support a generated Effect shape like:

```ts
const posts = yield* listPosts({limit: 10});
```

where `listPosts` is emitted by `sqlfu generate`, returns an `Effect`, and obtains
`SqlClient.SqlClient` from the Effect environment internally.

## Context

The previous draft PR, https://github.com/mmkal/sqlfu/pull/83, wrapped sqlfu's
existing client API in Effect values. That worked as interop, but it created a
second database client concept beside `@effect/sql`. This task takes the other
direction: keep sqlfu focused on SQL-file analysis and generated query wrappers,
and delegate Effect-native execution to `@effect/sql`.

`@effect/sql` already supplies the lower-level database runtime concepts that an
Effect application expects: `SqlClient.SqlClient`, layers, typed `SqlError`,
resource management, and transactions. sqlfu should not implement a competing
Effect SQL client.

## Proposed Shape

- [x] Add an Effect SQL generation mode. _Implemented as explicit runtime targets in `src/types.ts`, `src/config.ts`, and typegen: `sqlfu`, `effect-v3`, and `effect-v4-unstable`; kept `generate.validator` for validation libraries._
- [x] Generate query functions that require `SqlClient.SqlClient` from the Effect environment. _Generated wrappers no longer take a sqlfu `Client`; see `renderEffectSqlQueryWrapper` in `src/typegen/index.ts`._
- [x] Execute through Effect SQL instead of sqlfu `Client`. _Generated code imports `@effect/sql` for `effect-v3` or `effect/unstable/sql` for `effect-v4-unstable`, obtains `SqlClient.SqlClient`, and runs `sqlClient.unsafe(generatedQuery.sql, generatedQuery.args)`._
- [x] Preserve generated parameter/result typing. _Effect runtime wrappers keep the existing namespace-merged `Params`, `Data`, `Result`, `sql`, and `query` surface._
- [x] Add integration-style red/green tests for generated Effect SQL output. _Added `fixtures/effect-sql.md` with v3 and v4-unstable import snapshots plus a v3 runtime test using `@effect/sql-sqlite-node` against a real sqlite file._
- [x] Document the module/config as experimental. _Added `docs/effect-sql.md`, linked it from typegen docs, and added it to website docs sync/sidebar._
- [x] Update PR body with reviewer-facing usage and verification notes. _Updated PR #90 after implementation with usage, scope, and verification details._

## Assumptions

The first implementation can be SQLite-focused for runtime testing because
`@effect/sql-sqlite-node` gives a fast in-memory layer. The generated surface
should be database-neutral at the sqlfu layer where possible, because Effect SQL
owns the concrete adapter.

Validation semantics need care. If `generate.validator: 'effect'` is used, it
could mean "emit Effect-returning functions", not "validate with Effect Schema".
That may be slightly overloaded because existing `generate.validator` values are
validation libraries. If this becomes confusing in implementation, prefer a small,
explicit config shape over forcing the wrong mental model.

## Implementation Notes

- 2026-05-05: Closed PR #83 as superseded so the repo does not carry two competing
  Effect concepts.
- 2026-05-05: Chose `generate.runtime` instead of `generate.validator: 'effect'`
  so the execution target stays separate from validator-library output.
- 2026-05-05: Current Effect runtime does not combine with `generate.validator`;
  generated validation can be added later without changing the runtime option.
- 2026-05-05: Split the runtime names before merge to avoid hiding Effect version
  differences: `sqlfu` is the default client-wrapper runtime, `effect-v3` imports
  `@effect/sql`, and `effect-v4-unstable` imports Effect v4 beta's
  `effect/unstable/sql` path.
