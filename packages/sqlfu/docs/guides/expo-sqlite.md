# Expo SQLite

Use this guide when your app runs in Expo or React Native and stores data in
`expo-sqlite`.

Start from [Getting Started](../getting-started.md), but do not expect the
mobile runtime to read migration files from disk. Keep migrations inline in the
config module, run `sqlfu generate`, and import that module into the app.

## Inline config

Generation can use inline `definitions` directly, so `db` can be omitted:

```ts
import {defineConfig, sql} from 'sqlfu';

export default defineConfig({
  definitions: sql`
    create table todos (
      id integer primary key,
      title text not null,
      completed integer not null default 0
    );
  `,
  queries: {
    listTodos: sql`
      select id, title, completed
      from todos
      order by id
    `,
  },
});
```

The bound inline queries are async, matching `expo-sqlite`.

Run the normal authoring loop:

```sh
npx sqlfu draft
npx sqlfu generate
```

If you split migrations into files later, import the generated migration bundle
instead of calling `appDb.migrate()`.

## Expo runtime

```ts
import * as SQLite from 'expo-sqlite';
import {createExpoSqliteClient} from 'sqlfu';

import dbConfig from './sqlfu.config.ts';

export async function openAppDatabase() {
  const db = await SQLite.openDatabaseAsync('app.db');
  const client = createExpoSqliteClient(db);
  const appDb = dbConfig(client);

  await appDb.migrate();

  return appDb;
}

export async function loadTodos() {
  const db = await openAppDatabase();
  return db.listTodos();
}
```

Inline migrations are idempotent. sqlfu applies missing migrations and skips
migrations already recorded in the on-device SQLite database.

## Read next

- [Getting Started](../getting-started.md) for the base SQL workflow.
- [Adapters](../adapters.md#expo-sqlite) for the Expo adapter snippet.
- [SQL migrations](../migration-model.md) for migration history and drift
  rules.
