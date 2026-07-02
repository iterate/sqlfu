# Node SQLite

Use this guide when your app runs in Node and talks to a local SQLite database
with `node:sqlite`, `better-sqlite3`, or native `libsql`.

Start from [Getting Started](../getting-started.md). The project loop is the
same: inline `definitions`, reviewed inline migrations, inline queries, and
generated query types. The Node-specific part is choosing the runtime adapter.

## Inline config

For a local database file, the runtime snippets below use `.sqlfu/app.db`:

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

Draft the migration entry and generate query types:

```sh
npx sqlfu draft
npx sqlfu generate
```

`draft` writes the pending migration entry back into the inline config, and
`generate` updates `findPostBySlug` to a typed `sql.nullableOne<{...}>` tag.
There is no `sqlfu migrate` step for inline configs: the database is bound at
runtime, so the `postsDb.migrate()` call in the snippets below applies pending
migrations.

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
