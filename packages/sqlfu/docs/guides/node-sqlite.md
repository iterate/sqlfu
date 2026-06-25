# Node SQLite

Use this guide when your app runs in Node and talks to a local SQLite database
with `node:sqlite`, `better-sqlite3`, or native `libsql`.

Start from [Getting Started](../getting-started.md). The project loop is the
same: inline `definitions`, reviewed inline migrations, inline queries, and
generated query types. The Node-specific part is choosing the runtime adapter.

## Inline config

For a local database file, the CLI and runtime can use `.sqlfu/app.db` while you
are authoring:

```ts
import {defineConfig, sql} from 'sqlfu';

export default defineConfig({
  definitions: sql`
    create table posts (
      id integer primary key,
      slug text not null unique,
      title text not null,
      published integer not null default 0
    );
  `,
  queries: {
    findPostBySlug: sql`
      select id, slug, title
      from posts
      where slug = :slug
      limit 1
    `,
  },
});
```

Run the normal commands:

```sh
npx sqlfu draft
npx sqlfu migrate
npx sqlfu generate
```

`generate` updates `findPostBySlug` to a typed `sql.nullableOne<{...}>` tag.

## `node:sqlite`

`node:sqlite` is built into Node 22+:

```ts
import {DatabaseSync} from 'node:sqlite';
import {createNodeSqliteClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const db = new DatabaseSync('./.sqlfu/app.db');
const client = createNodeSqliteClient(db);
const postsDb = dbConfig(client);

postsDb.migrate();
const post = postsDb.findPostBySlug({slug: 'hello-world'});
```

## `better-sqlite3`

Use `better-sqlite3` when you want its mature native driver surface:

```ts
import Database from 'better-sqlite3';
import {createBetterSqlite3Client} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const db = new Database('./.sqlfu/app.db');
const client = createBetterSqlite3Client(db);
const postsDb = dbConfig(client);

postsDb.migrate();
const post = postsDb.findPostBySlug({slug: 'hello-world'});
```

## Native `libsql`

Use native `libsql` when you want a local embedded libSQL database:

```ts
import Database from 'libsql';
import {createLibsqlSyncClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const db = new Database('./.sqlfu/app.db');
const client = createLibsqlSyncClient(db);
const postsDb = dbConfig(client);

postsDb.migrate();
const post = postsDb.findPostBySlug({slug: 'hello-world'});
```

## Read next

- [Getting Started](../getting-started.md) for the end-to-end local project.
- [Adapters](../adapters.md#local-and-embedded) for every local/embedded
  adapter snippet.
- [Runtime client](../client.md#sync-stays-sync) for the sync client contract.
