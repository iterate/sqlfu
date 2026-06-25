# Turso and libSQL

Use this guide when your app talks to Turso Cloud, a local `file:` libSQL
database, `@tursodatabase/serverless`, or the newer Turso database drivers.

The sqlfu workflow is still the same: author inline schema, draft reviewed
inline migrations, write inline queries, and generate query types. Most
Turso/libSQL client packages are asynchronous, so bound inline queries use
`await`.

## Config for `@libsql/client`

For a local `file:` database or Turso Cloud URL:

```ts
import {mkdirSync} from 'node:fs';
import {createClient} from '@libsql/client';
import {defineConfig, createLibsqlClient, sql} from 'sqlfu';

export default defineConfig({
  db: () => {
    mkdirSync('.sqlfu', {recursive: true});

    const raw = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:./.sqlfu/app.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    return {
      client: createLibsqlClient(raw),
      async [Symbol.asyncDispose]() {
        await raw.close();
      },
    };
  },
  definitions: sql`
    create table organizations (
      id integer primary key,
      slug text not null unique,
      name text not null
    );
  `,
  queries: {
    findOrganization: sql`
      select id, slug, name
      from organizations
      where slug = :slug
      limit 1
    `,
  },
});
```

Use the same `db` factory for `sqlfu migrate`, `sqlfu check`, and the UI. The
factory keeps sqlfu pointed at the same database your app uses instead of a
scratch file.

Run:

```sh
npx sqlfu draft
npx sqlfu migrate
npx sqlfu generate
```

## Runtime with `@libsql/client`

```ts
import {createClient} from '@libsql/client';
import {createLibsqlClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const raw = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const client = createLibsqlClient(raw);
const orgDb = dbConfig(client);

await orgDb.migrate();
const organization = await orgDb.findOrganization({slug: 'acme'});
```

## Runtime with `@tursodatabase/serverless`

```ts
import {connect} from '@tursodatabase/serverless';
import {createTursoServerlessClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const connection = connect({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const client = createTursoServerlessClient(connection);
const orgDb = dbConfig(client);

await orgDb.migrate();
const organization = await orgDb.findOrganization({slug: 'acme'});
```

## Runtime with `@tursodatabase/database` or `@tursodatabase/sync`

Both packages use `createTursoDatabaseClient()` at the sqlfu boundary:

```ts
import {connect} from '@tursodatabase/database';
import {createTursoDatabaseClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const db = await connect('app.db');
const client = createTursoDatabaseClient(db);
const orgDb = dbConfig(client);

await orgDb.migrate();
const organization = await orgDb.findOrganization({slug: 'acme'});
```

If you use `@tursodatabase/sync`, call `db.push()` and `db.pull()` at the
cadence your app wants. sqlfu does not own cloud replication.

## Read next

- [Getting Started](../getting-started.md) for the base SQL project loop.
- [Adapters](../adapters.md#remote--cloud) for every Turso/libSQL adapter
  snippet.
- [Runtime client](../client.md) for the shared async client contract.
