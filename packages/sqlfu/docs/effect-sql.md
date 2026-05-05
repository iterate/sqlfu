# Effect SQL runtime

`generate.runtime: 'effect-v3' | 'effect-v4-unstable'` is experimental. It makes generated query functions
return Effect values and read `SqlClient.SqlClient` from the Effect environment.

This is native Effect SQL interop, not a sqlfu client wrapper. sqlfu still
owns SQL-file analysis, parameter typing, result typing, and generated wrapper
shape. Effect SQL owns the database runtime, layers, transactions, resource
management, and SQL failure channel.

```ts
export default {
  db: './app.db',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: 'effect-v3',
  },
};
```

Use `runtime: 'effect-v3'` for stable Effect v3 / `@effect/sql`. Use
`runtime: 'effect-v4-unstable'` for Effect v4 beta's current
`effect/unstable/sql` module path. The v4 target is intentionally named
`unstable` so sqlfu can later add `runtime: 'effect-v4'` for the eventual stable
`effect/sql` import.

Given:

```sql
-- sql/list-posts.sql
select id, slug, title
from posts
order by id
limit :limit;
```

sqlfu emits a function shaped like:

```ts
import {listPosts} from './sql/.generated/list-posts.sql';

const program = Effect.gen(function*() {
  const posts = yield* listPosts({limit: 10});
  return posts;
});
```

Provide the database with the normal Effect SQL adapter layer:

```ts
import * as Effect from 'effect/Effect';
import {SqliteClient} from '@effect/sql-sqlite-node';

const rows = await Effect.runPromise(
  program.pipe(Effect.provide(SqliteClient.layer({filename: 'app.db'}))),
);
```

Install `effect`, `@effect/sql`, and the adapter package your app uses. For
SQLite on Node, that adapter is `@effect/sql-sqlite-node`.

For Effect v4 beta, install `effect@beta` and a matching beta adapter package,
then use `runtime: 'effect-v4-unstable'`. The generated query imports
`effect/unstable/sql`; it does not import `@effect/sql`.

## Generated Surface

Effect SQL runtime generation removes the sqlfu `Client` argument:

```ts
// default runtime
const posts = await listPosts(client, {limit: 10});

// Effect runtime
const posts = yield* listPosts({limit: 10});
```

The generated function imports `effect/Effect` and an Effect SQL client module, obtains
`SqlClient.SqlClient` inside the returned Effect, and executes the analyzed SQL
with `sqlClient.unsafe(sql, args)`. The SQL string and driver args still come
from sqlfu's generated `query` helper.

The Effect SQL import depends on the runtime target:

```ts
// runtime: 'effect-v3'
import {SqlClient} from '@effect/sql';

// runtime: 'effect-v4-unstable'
import {SqlClient} from 'effect/unstable/sql';
```

The generated export keeps the same attached metadata:

```ts
listPosts.sql;
listPosts.query({limit: 10});
```

## Current Limits

- `generate.runtime: 'effect-v3' | 'effect-v4-unstable'` cannot be combined with
  `generate.validator` yet. Use plain generated TypeScript types for now.
- Non-returning DML and DDL run through Effect SQL's `.raw` statement result.
  sqlfu does not synthesize its normal `RunResult` metadata in this mode.
- This mode depends on Effect SQL's runtime semantics. Transaction handling,
  pooling, and adapter behavior should be configured through Effect SQL, not
  through sqlfu clients.
