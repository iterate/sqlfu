# Effect interop

`sqlfu/effect` is experimental. It is a small adapter for applications that already
use [Effect](https://effect.website/) and want normal sqlfu client calls to compose
inside an Effect program.

It is not native Effect support. sqlfu still executes through the existing
`Client` interface, still preserves the underlying driver's sync or async nature,
and still uses sqlfu's normal `SqlfuError` classification. The adapter only moves
those calls into Effect values.

```ts
import * as Effect from 'effect/Effect';
import {createNodeSqliteClient} from 'sqlfu';
import {toEffectClient} from 'sqlfu/effect';

const db = toEffectClient(createNodeSqliteClient(database));

const program = Effect.gen(function*() {
  yield* db.run({
    sql: 'insert into posts(slug) values (?)',
    args: ['hello'],
  });

  return yield* db.all<{id: number; slug: string}>({
    sql: 'select id, slug from posts',
    args: [],
  });
});

const rows = Effect.runSync(program);
```

## What it wraps

`toEffectClient(client)` returns an `EffectClient` with these methods:

- `all(query)` returns `Effect.Effect<Row[], SqlfuError>`
- `run(query)` returns `Effect.Effect<RunResult, SqlfuError>`
- `raw(sql)` returns `Effect.Effect<RunResult, SqlfuError>`
- `prepare(sql)` returns `Effect.Effect<EffectPreparedStatement, SqlfuError>`

Prepared statements expose Effect-returning `all(params)` and `run(params)`.

The wrapper does not expose `transaction()` yet. A correct transaction wrapper
needs a clearer design because the underlying sqlfu transaction API expects a
sync or promise-returning callback, while Effect code wants failures to remain in
the typed failure channel.

## Sync and async

The wrapper does not make async drivers synchronous or sync drivers asynchronous.

```ts
const db = toEffectClient(createNodeSqliteClient(database));
const rows = Effect.runSync(db.all({sql: 'select 1 as value', args: []}));
```

```ts
const db = toEffectClient(createD1Client(database));
const rows = await Effect.runPromise(db.all({sql: 'select 1 as value', args: []}));
```

## Error handling

Failures are normalized with sqlfu's existing `SqlfuError` mapper before they
enter the Effect failure channel:

```ts
const result = Effect.runSync(
  db
    .all({
      sql: 'select id from missing_posts',
      args: [],
      name: 'findMissingPosts',
    })
    .pipe(
      Effect.match({
        onFailure: (error) => ({ok: false, kind: error.kind}),
        onSuccess: (rows) => ({ok: true, rows}),
      }),
    ),
);
```

Built-in sqlfu adapters already throw `SqlfuError`; the Effect wrapper applies the
same mapper again so custom or lower-level clients still get the same failure
shape.

## Context and Layer

Effect applications can provide a wrapped client through `SqlfuClient.layer()`:

```ts
import * as Effect from 'effect/Effect';
import {SqlfuClient} from 'sqlfu/effect';

const DB = SqlfuClient.make().pipe(Effect.provide(SqlfuClient.layer(client)));

const program = Effect.gen(function*() {
  const db = yield* DB;
  return yield* db.all({sql: 'select 1 as value', args: []});
});
```

## Scope

This module is intentionally narrower than Drizzle's `effect-postgres` package.
Drizzle has an Effect-native session and query-builder layer; sqlfu/effect is
only a wrapper around existing sqlfu clients. It does not add `generate.effect`,
generated query overloads, or an internal Effect dependency for the root `sqlfu`
entrypoint.
