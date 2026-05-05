# Effect SQL runtime

`generate.runtime: 'effect'` is experimental. It makes generated query functions
return Effect values and read `SqlClient.SqlClient` from the Effect environment.

This is native `@effect/sql` interop, not a sqlfu client wrapper. sqlfu still
owns SQL-file analysis, parameter typing, result typing, and generated wrapper
shape. `@effect/sql` owns the database runtime, layers, transactions, resource
management, and `SqlError` failure channel.

```ts
export default {
  db: './app.db',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: 'effect',
  },
};
```

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

## Generated Surface

Effect runtime generation removes the sqlfu `Client` argument:

```ts
// default runtime
const posts = await listPosts(client, {limit: 10});

// Effect runtime
const posts = yield* listPosts({limit: 10});
```

The generated function imports `effect/Effect` and `@effect/sql`, obtains
`SqlClient.SqlClient` inside the returned Effect, and executes the analyzed SQL
with `sqlClient.unsafe(sql, args)`. The SQL string and driver args still come
from sqlfu's generated `query` helper.

The generated export keeps the same attached metadata:

```ts
listPosts.sql;
listPosts.query({limit: 10});
```

## Current Limits

- `generate.runtime: 'effect'` cannot be combined with `generate.validator` yet.
  Use plain generated TypeScript types for now.
- Non-returning DML and DDL run through Effect SQL's `.raw` statement result.
  sqlfu does not synthesize its normal `RunResult` metadata in this mode.
- This mode depends on Effect SQL's runtime semantics. Transaction handling,
  pooling, and adapter behavior should be configured through `@effect/sql`, not
  through sqlfu clients.
