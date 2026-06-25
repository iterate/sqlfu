# Bun SQLite

Use this guide when your app runs on Bun and uses `bun:sqlite`.

The sqlfu project loop stays the same as [Getting Started](../getting-started.md):
write inline schema SQL, draft inline migrations, write inline queries, and
generate query types. The runtime adapter changes to `createBunClient()`.

## Inline config

The CLI can use the default `.sqlfu/app.db` local SQLite file:

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

Generate the migration and wrappers:

```sh
npx sqlfu draft
npx sqlfu migrate
npx sqlfu generate
```

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
