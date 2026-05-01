---
status: ready
size: small
branch: effect-client-interop
old_pr: https://github.com/mmkal/sqlfu/pull/82
new_pr: https://github.com/mmkal/sqlfu/pull/83
---

# Thin Effect Client Interop

Status summary: implementation complete and PR left in draft for review. PR #82 was closed because it made Effect support look more Drizzle-like than it really was. Draft PR #83 now tracks the smaller replacement: optional `sqlfu/effect` interop for existing sqlfu clients, covering `all`, `run`, `raw`, `prepare`, `SqlfuError` failures-as-values, and Context/Layer wiring; transaction support is deliberately left out of this thin adapter until it has a safer design.

## Context

PR #82 generated an Effect-flavoured query service and then a generated `EffectClient` variant. That was the wrong center of gravity. Drizzle's Effect support is deeper: `drizzle-orm/effect-postgres` builds on `@effect/sql-pg`, pulls `PgClient` from Effect context, makes query/session methods return Effects, and makes query builders yieldable via Effect's `Effectable` protocol.

Findings:

- Drizzle docs describe the package as an Effect-native API for Postgres: https://orm.drizzle.team/docs/connect-effect-postgres
- Drizzle's `PgDrizzle.make` reads `PgClient`, logger, and cache from Effect context, then constructs an Effect-specific session: https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-beta.22/drizzle-orm/src/effect-postgres/driver.ts
- Drizzle's Effect session executes queries through Effect-returning `@effect/sql-pg` calls and maps query failures into tagged Effect errors: https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-beta.22/drizzle-orm/src/effect-postgres/session.ts
- Drizzle's query builders are explicitly made Effectable, so `yield* db.select().from(table)` works directly: https://github.com/drizzle-team/drizzle-orm/blob/v1.0.0-beta.22/drizzle-orm/src/effect-core/query-effect.ts

## Decision

Do option (c): thinly wrap a normal sqlfu client in Effect.

This is not "proper" native Effect support. It is just an interop layer for users already writing Effect programs who want sqlfu calls in the Effect failure channel. Internally, sqlfu will still throw from the normal client surface and still distinguish sync/async with the existing `client.sync` model.

Do not implement:

- `generate.effect`
- generated `.generated/effect.ts`
- generated query wrapper overloads for Effect clients
- a full internal result/task layer
- an Effect dependency from the main `sqlfu` entrypoint

## Desired Public Shape

Sketch:

```ts
import * as Effect from 'effect/Effect';
import {SqlfuClient, toEffectClient} from 'sqlfu/effect';
import {createNodeSqliteClient} from 'sqlfu';

const client = createNodeSqliteClient(database);
const effectClient = toEffectClient(client);

const program = Effect.gen(function*() {
  const rows = yield* effectClient.all<{id: number}>({
    sql: 'select id from posts',
    args: [],
  });

  return rows;
});

await Effect.runPromise(program);
```

Optionally also expose a Context/Layer helper for Effect applications:

```ts
const DB = SqlfuClient.make().pipe(Effect.provide(SqlfuClient.layer(client)));
```

## Checklist

- [x] Commit this task file before implementation. _Initial task committed in `c5bc520` before product-code edits._
- [x] Open a draft PR after the task-file commit. _Opened draft PR #83: https://github.com/mmkal/sqlfu/pull/83._
- [x] Add a red integration-style test for wrapping sync clients in Effects. _Added `packages/sqlfu/test/effect-client.test.ts`; first run failed because `effect` and `../src/effect.js` did not exist._
- [x] Add the smallest implementation that makes the sync-client Effect wrapper pass. _Added `packages/sqlfu/src/effect.ts` with `toEffectClient` over `all`, `run`, and `raw`._
- [x] Add a red integration-style test for wrapping async clients in Effects. _Added async node-sqlite coverage in `packages/sqlfu/test/effect-client.test.ts`; the generic operation helper already covered this branch._
- [x] Extend the wrapper so async clients pass through the same Effect API. _`runOperation` uses sync `Effect.try` for sync clients and `Effect.tryPromise` for async clients._
- [x] Add tests for query failure surfacing in the Effect error channel. _The missing-table query tests match `SqlfuError` fields through `Effect.match`, including an unwrapped async client path._
- [x] Export the optional Effect interop through a subpath that does not import Effect from the main `sqlfu` entrypoint. _Added `sqlfu/effect` package exports and a packed-package import test._
- [x] Document the deliberately limited scope in the PR body. _PR #83 explains that this is interop, not native Effect support, and shows abbreviated `toEffectClient` usage._
- [x] Decide whether to mark the PR ready or leave it draft after review of the transaction omission. _Left PR #83 as draft per the user request._

## Implementation Notes

- 2026-05-01: Closed PR #82. Started fresh from updated `main` in `../worktrees/sqlfu/effect-client-interop`.
- 2026-05-01: Opened draft PR #83 after the task-only commit.
- 2026-05-01: Implemented `sqlfu/effect` as an optional interop subpath. It intentionally exposes no `transaction` wrapper yet: a naive transaction callback would have to run nested Effects inside the underlying transaction callback, which risks turning typed Effect failures back into Effect runtime exceptions. That belongs in a follow-up design if the thin adapter is accepted.
- 2026-05-01: Updated PR #83 body with reviewer-facing summary, sample code, scope notes, and verification commands.
- 2026-05-01: Tightened the Effect failure channel to `SqlfuError` by applying the existing idempotent `mapSqliteDriverError` transform inside `Effect.try` / `Effect.tryPromise` catch handlers.
