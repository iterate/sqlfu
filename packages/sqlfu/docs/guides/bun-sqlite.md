# Bun SQLite

Use this guide when your app runs on Bun and uses `bun:sqlite`.

The sqlfu project loop stays the same as [Getting Started](../getting-started.md):
write schema SQL, draft migrations, write query SQL, generate wrappers. The
runtime adapter changes to `createBunClient()`.

## Config

The CLI can still use a local SQLite file path:

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

`bun:sqlite` is synchronous, so `generate.sync: true` keeps generated wrappers
synchronous too.

## Schema and query

```sql
create table jobs (
  id integer primary key,
  name text not null,
  status text not null
);
```

```sql
/** @name listJobsByStatus */
select id, name, status
from jobs
where status = :status
order by id;
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

import {listJobsByStatus} from './sql/.generated/list-jobs-by-status.sql';

const db = new Database('./db/app.sqlite');
const client = createBunClient(db);

const pendingJobs = listJobsByStatus(client, {status: 'pending'});
```

The wrapper is the same wrapper you would call with `node:sqlite` or
`better-sqlite3` when `generate.sync: true` is enabled.

## Read next

- [Getting Started](../getting-started.md) for the base SQL workflow.
- [Adapters](../adapters.md#bunsqlite) for the `bun:sqlite` adapter snippet.
- [Type generation from SQL](../typegen.md) for params, list params, and
  generated row types.
