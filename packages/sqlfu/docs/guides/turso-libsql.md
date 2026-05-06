# Turso and libSQL

Use this guide when your app talks to Turso Cloud, a local `file:` libSQL
database, `@tursodatabase/serverless`, or the newer Turso database drivers.

The sqlfu workflow is still the same: author `definitions.sql`, draft
migrations, write `.sql` query files, and generate wrappers. Most Turso/libSQL
client packages are asynchronous, so the default generated wrappers already use
`await`.

## Config for `@libsql/client`

For a local `file:` database or Turso Cloud URL:

```ts
import {createClient} from '@libsql/client';
import {defineConfig, createLibsqlClient} from 'sqlfu';

export default defineConfig({
  db: () => {
    const raw = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:./db/app.sqlite',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    return {
      client: createLibsqlClient(raw),
      async [Symbol.asyncDispose]() {
        await raw.close();
      },
    };
  },
  definitions: './definitions.sql',
  migrations: './migrations',
  queries: './sql',
});
```

Use the same `db` factory for `sqlfu migrate`, `sqlfu check`, and the UI. The
factory keeps sqlfu pointed at the same database your app uses instead of a
scratch file.

## Schema and query

```sql
create table organizations (
  id integer primary key,
  slug text not null unique,
  name text not null
);
```

Put the query in `sql/queries.sql`:

```sql
/** @name findOrganization */
select id, slug, name
from organizations
where slug = :slug
limit 1;
```

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

import {findOrganization} from './sql/.generated/queries.sql.ts';

const raw = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const client = createLibsqlClient(raw);

const organization = await findOrganization(client, {slug: 'acme'});
```

## Runtime with `@tursodatabase/serverless`

```ts
import {connect} from '@tursodatabase/serverless';
import {createTursoServerlessClient} from 'sqlfu';

import {findOrganization} from './sql/.generated/queries.sql.ts';

const connection = connect({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const client = createTursoServerlessClient(connection);

const organization = await findOrganization(client, {slug: 'acme'});
```

## Runtime with `@tursodatabase/database` or `@tursodatabase/sync`

Both packages use `createTursoDatabaseClient()` at the sqlfu boundary:

```ts
import {connect} from '@tursodatabase/database';
import {createTursoDatabaseClient} from 'sqlfu';

import {findOrganization} from './sql/.generated/queries.sql.ts';

const db = await connect('app.db');
const client = createTursoDatabaseClient(db);

const organization = await findOrganization(client, {slug: 'acme'});
```

If you use `@tursodatabase/sync`, call `db.push()` and `db.pull()` at the
cadence your app wants. sqlfu does not own cloud replication.

## Read next

- [Getting Started](../getting-started.md) for the base SQL project loop.
- [Adapters](../adapters.md#remote--cloud) for every Turso/libSQL adapter
  snippet.
- [Runtime client](../client.md) for the shared async client contract.
