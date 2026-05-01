# Runtime client

Most application code should only know about the sqlfu `Client` interface and
the generated query functions you import from `.generated/`.

The client is deliberately small: it adapts the SQLite driver you already use,
then exposes the same SQL-first surface everywhere.

That matters for production risk. sqlfu is still pre-alpha, but the runtime
client is an extremely thin wrapper around mature drivers such as `node:sqlite`,
`better-sqlite3`, `bun:sqlite`, libsql, D1, and Durable Object storage.
Generated wrappers are plain functions that build SQL plus args and call the
client. The rougher surfaces are more likely to be workflow tools such as
drafting migrations, generation, linting, formatting, and the Admin UI. Those
usually run before deployment rather than in your hot application path.

```ts
import type {Client} from 'sqlfu';
import {getPosts} from './sql/.generated/get-posts.sql';

export async function renderFeed(client: Client) {
  const posts = await getPosts(client, {limit: 10});
  return posts.map((post) => `<article>${post.title}</article>`).join('');
}
```

The boundary where you create the client is the only runtime-specific part:

```ts
import {DatabaseSync} from 'node:sqlite';
import {createNodeSqliteClient} from 'sqlfu';
import {renderFeed} from './src/app';

const db = createNodeSqliteClient(new DatabaseSync('app.db'));
const html = await renderFeed(db);
```

Swap the adapter factory and the rest of the app can keep using the same
generated functions.

## The surface

The shared client shape is:

```ts
type Client = SyncClient | AsyncClient;
```

Both variants expose:

- `client.all(query)` for row-returning SQL
- `client.run(query)` for writes and DDL
- `client.iterate(query)` for streaming rows
- `client.prepare(sql)` for reusable ad hoc statements
- `client.transaction(fn)` for driver-backed transactions
- `client.sql` for small inline SQL fragments
- `client.driver` when you need to escape to the underlying database driver

Generated query wrappers accept this same `Client` shape, so your authored SQL
files become the stable data-access layer rather than a second runtime API to
learn.

## Sync stays sync

sqlfu preserves the sync or async nature of the driver you brought.

If you use `better-sqlite3`, `node:sqlite`, `bun:sqlite`, or Durable Object
storage, a generated query can return rows directly. If you use `@libsql/client`,
Cloudflare D1, Expo SQLite, or sqlite-wasm, the same wrapper returns a promise.

That distinction is visible in the TypeScript type. sqlfu does not turn a
synchronous driver into an async one, and it does not pretend an async driver can
run synchronously.

## Where to go next

- [Adapters](https://sqlfu.dev/docs/adapters) lists every built-in client
  factory.
- [Type generation from SQL](https://sqlfu.dev/docs/typegen) explains how `.sql`
  files become generated wrappers.
- [Observability](https://sqlfu.dev/docs/observability) shows how to wrap a
  client with tracing, metrics, and error hooks.
- [Errors](https://sqlfu.dev/docs/errors) lists the normalized `SqlfuError`
  kinds raised by adapters.
