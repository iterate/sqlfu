---
status: ready
size: small
branch: effect-client-interop
old_pr: https://github.com/mmkal/sqlfu/pull/82
new_pr: pending
---

# Thin Effect Client Interop

Status summary: 0% implemented. PR #82 was closed because it made Effect support look more Drizzle-like than it really was. This replacement task keeps the scope deliberately small: provide optional Effect interop for existing sqlfu clients, without adding generated-code support or pretending sqlfu execution is Effect-native.

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

- [ ] Commit this task file before implementation.
- [ ] Open a draft PR after the task-file commit.
- [ ] Add a red integration-style test for wrapping sync clients in Effects.
- [ ] Add the smallest implementation that makes the sync-client Effect wrapper pass.
- [ ] Add a red integration-style test for wrapping async clients in Effects.
- [ ] Extend the wrapper so async clients pass through the same Effect API.
- [ ] Add tests for query failure surfacing in the Effect error channel.
- [ ] Export the optional Effect interop through a subpath that does not import Effect from the main `sqlfu` entrypoint.
- [ ] Document the deliberately limited scope in the PR body.

## Implementation Notes

- 2026-05-01: Closed PR #82. Starting fresh from updated `main` in `../worktrees/sqlfu/effect-client-interop`.
