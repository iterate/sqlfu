---
status: in-progress
size: medium
branch: effect-sql-generated-queries
pr: https://github.com/mmkal/sqlfu/pull/90
supersedes: https://github.com/mmkal/sqlfu/pull/83
---

# Generate native Effect SQL query functions

## Status

Fresh worktree/PR setup is complete in draft PR #90. The goal is to replace the
thin `sqlfu/effect` client-wrapper direction with generated query functions that
run on `@effect/sql` and require `SqlClient.SqlClient` from the Effect environment.
Main implementation, tests, docs, and final PR body are still pending.

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

- [ ] Add an Effect SQL generation mode. _Pending; likely config spelling is `generate.validator: 'effect'` if it fits the existing generator model, otherwise a narrower generation-mode option should be documented in this task before implementation._
- [ ] Generate query functions that require `SqlClient.SqlClient` from the Effect environment. _Pending; target callsite is `yield* listPosts({limit: 10})`, not `yield* listPosts(db, params)`._
- [ ] Execute through `@effect/sql` instead of sqlfu `Client`. _Pending; generated code should adapt sqlfu's analyzed SQL/args into Effect SQL execution without adding a new sqlfu Effect client._
- [ ] Preserve generated parameter/result typing. _Pending; query params and row result types should remain the public contract._
- [ ] Add integration-style red/green tests for generated Effect SQL output. _Pending; tests should exercise generated code against a real Effect SQL sqlite layer, not mocks._
- [ ] Document the module/config as experimental. _Pending; docs should say this is native `@effect/sql` generation and supersedes the earlier client-wrapper approach._
- [ ] Update PR body with reviewer-facing usage and verification notes. _Pending._

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
