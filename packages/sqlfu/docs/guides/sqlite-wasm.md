# sqlite-wasm

Use this guide when your app runs in the browser with `@sqlite.org/sqlite-wasm`.

The authoring loop is the same as [Getting Started](../getting-started.md):
schema in `definitions.sql`, reviewed migrations in `migrations/`, queries in
`sql/queries.sql`, generated wrappers in `sql/.generated/`. The browser runtime uses
the sqlite-wasm adapter and the generated migration bundle.

## Config

The browser cannot read migration files from your project directory at runtime,
so keep `migrations` configured and run `sqlfu generate`:

```ts
import {defineConfig} from 'sqlfu';

export default defineConfig({
  definitions: './definitions.sql',
  migrations: './migrations',
  queries: './sql',
});
```

The generated wrappers are async by default, matching the sqlite-wasm adapter.

## Schema and query

```sql
create table notes (
  id integer primary key,
  title text not null,
  body text not null
);
```

Put the query in `sql/queries.sql`:

```sql
/** @name listNotes */
select id, title, body
from notes
order by id desc;
```

Generate the files the browser will import:

```sh
npx sqlfu draft
npx sqlfu generate
```

## Browser runtime

```ts
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import {createSqliteWasmClient} from 'sqlfu';

import {migrate} from './migrations/.generated/migrations.ts';
import {listNotes} from './sql/.generated/queries.sql.ts';

export async function openBrowserDatabase() {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB('file:app.db?vfs=opfs');
  const client = createSqliteWasmClient(db);

  await migrate(client);

  return client;
}

export async function loadNotes() {
  const client = await openBrowserDatabase();
  return listNotes(client);
}
```

Use OPFS when you want browser persistence. Use `':memory:'` for demos or
short-lived fixtures.

## Read next

- [Getting Started](../getting-started.md) for the base SQL workflow.
- [Adapters](../adapters.md#sqliteorgsqlite-wasm-browsers) for the sqlite-wasm
  adapter snippet.
- [Generate examples](/docs/examples) for exact generated TypeScript shapes.
