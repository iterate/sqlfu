# sqlite-wasm

Use this guide when your app runs in the browser with `@sqlite.org/sqlite-wasm`.

The authoring loop is the same as [Getting Started](../getting-started.md):
inline schema, reviewed inline migrations, inline queries, and generated query
types. The browser runtime uses the sqlite-wasm adapter.

## Inline config

The browser can import a TypeScript config module, so keep the starter shape
inline:

```ts
import {defineConfig, sql} from 'sqlfu';

export default defineConfig({
  definitions: sql`
    create table notes (
      id integer primary key,
      title text not null,
      body text not null
    );
  `,
  queries: {
    listNotes: sql`
      select id, title, body
      from notes
      order by id desc
    `,
  },
});
```

The bound inline queries are async, matching the sqlite-wasm adapter.

Generate the query types the browser will import:

```sh
npx sqlfu draft
npx sqlfu generate
```

## Browser runtime

```ts
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import {createSqliteWasmClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

export async function openBrowserDatabase() {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB('file:app.db?vfs=opfs');
  const client = createSqliteWasmClient(db);
  const notesDb = dbConfig(client);

  await notesDb.migrate();

  return notesDb;
}

export async function loadNotes() {
  const db = await openBrowserDatabase();
  return db.listNotes();
}
```

Use OPFS when you want browser persistence. Use `':memory:'` for demos or
short-lived fixtures.

## Read next

- [Getting Started](../getting-started.md) for the base SQL workflow.
- [Adapters](../adapters.md#sqliteorgsqlite-wasm-browsers) for the sqlite-wasm
  adapter snippet.
- [Generate examples](/docs/examples) for exact generated TypeScript shapes.
