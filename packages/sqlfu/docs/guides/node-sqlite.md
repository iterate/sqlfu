# Node SQLite

Use this guide when your app runs in Node and talks to a local SQLite database
with `node:sqlite`, `better-sqlite3`, or native `libsql`.

Start from [Getting Started](../getting-started.md). The project loop is the
same: `definitions.sql`, reviewed migrations, `.sql` query files, generated
TypeScript wrappers. The Node-specific part is choosing the runtime adapter.

## Config

For a local database file, let the CLI open that file directly:

```ts
import {defineConfig} from 'sqlfu';

export default defineConfig({
  db: './db/app.sqlite',
  definitions: './definitions.sql',
  migrations: './migrations',
  queries: './sql',
  generate: {
    sync: true,
  },
});
```

`node:sqlite`, `better-sqlite3`, and native `libsql` are synchronous, so set
`generate.sync: true`. Generated wrappers accept a `SyncClient` and return rows
directly.

## Schema and query

```sql
create table posts (
  id integer primary key,
  slug text not null unique,
  title text not null,
  published integer not null default 0
);
```

Put the query in `sql/queries.sql`:

```sql
/** @name findPostBySlug */
select id, slug, title
from posts
where slug = :slug
limit 1;
```

Run the normal commands:

```sh
npx sqlfu draft
npx sqlfu migrate
npx sqlfu generate
```

## `node:sqlite`

`node:sqlite` is built into Node 22+:

```ts
import {DatabaseSync} from 'node:sqlite';
import {createNodeSqliteClient} from 'sqlfu';

import {findPostBySlug} from './sql/.generated/queries.sql.ts';

const db = new DatabaseSync('./db/app.sqlite');
const client = createNodeSqliteClient(db);

const post = findPostBySlug(client, {slug: 'hello-world'});
```

## `better-sqlite3`

Use `better-sqlite3` when you want its mature native driver surface:

```ts
import Database from 'better-sqlite3';
import {createBetterSqlite3Client} from 'sqlfu';

import {findPostBySlug} from './sql/.generated/queries.sql.ts';

const db = new Database('./db/app.sqlite');
const client = createBetterSqlite3Client(db);

const post = findPostBySlug(client, {slug: 'hello-world'});
```

## Native `libsql`

Use native `libsql` when you want a local embedded libSQL database:

```ts
import Database from 'libsql';
import {createLibsqlSyncClient} from 'sqlfu';

import {findPostBySlug} from './sql/.generated/queries.sql.ts';

const db = new Database('./db/app.sqlite');
const client = createLibsqlSyncClient(db);

const post = findPostBySlug(client, {slug: 'hello-world'});
```

## Read next

- [Getting Started](../getting-started.md) for the end-to-end local project.
- [Adapters](../adapters.md#local-and-embedded) for every local/embedded
  adapter snippet.
- [Runtime client](../client.md#sync-stays-sync) for the sync client contract.
