# Bun SQLite

Use this guide when your app runs on Bun and uses `bun:sqlite`.

The sqlfu project loop stays the same as [Getting Started](../getting-started.md):
write inline schema SQL, draft inline migrations, write inline queries, and
generate query types. The runtime adapter changes to `createBunClient()`.

## Inline config

```ts
import {defineConfig, sql} from 'sqlfu';

export default defineConfig({
  definitions: sql`
    create table jobs (
      id integer primary key,
      name text not null,
      status text not null
    );
  `,
  queries: {
    listJobsByStatus: sql`
      select id, name, status
      from jobs
      where status = :status
      order by id
    `,
  },
});
```

Draft the migration entry and generate query types:

```sh
npx sqlfu draft
npx sqlfu generate
```

Migrations for inline configs apply at runtime: the `jobsDb.migrate()` call
below runs anything pending against the database the app is bound to.

## Bun runtime

```ts
import {Database} from 'bun:sqlite';
import {createBunClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

const db = new Database('./.sqlfu/app.db');
const client = createBunClient(db);
const jobsDb = dbConfig(client);

jobsDb.migrate();
const pendingJobs = jobsDb.listJobsByStatus({status: 'pending'});
```

The bound inline query is synchronous because the `bun:sqlite` client is synchronous.

## Read next

- [Getting Started](../getting-started.md) for the base SQL workflow.
- [Adapters](../adapters.md#bunsqlite) for the `bun:sqlite` adapter snippet.
- [Type generation from SQL](../typegen.md) for params, list params, and
  generated row types.
