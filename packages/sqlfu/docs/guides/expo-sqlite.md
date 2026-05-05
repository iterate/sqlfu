# Expo SQLite

Use this guide when your app runs in Expo or React Native and stores data in
`expo-sqlite`.

Start from [Getting Started](../getting-started.md), but do not expect the
mobile runtime to read migration files from disk. Commit migrations, run
`sqlfu generate`, and import the generated migration bundle into the app.

## Config

Generation can use `definitions.sql` directly, so `db` can be omitted:

```ts
import {defineConfig} from 'sqlfu';

export default defineConfig({
  definitions: './definitions.sql',
  migrations: './migrations',
  queries: './sql',
});
```

The generated wrappers are async by default, matching `expo-sqlite`.

## Schema and query

```sql
create table todos (
  id integer primary key,
  title text not null,
  completed integer not null default 0
);
```

```sql
/** @name listTodos */
select id, title, completed
from todos
order by id;
```

Run the normal authoring loop:

```sh
npx sqlfu draft
npx sqlfu generate
```

If you also keep a local development database for tools, configure `db` and run
`npx sqlfu migrate` against that database too. The app itself should use the
generated migration bundle.

## Expo runtime

```ts
import * as SQLite from 'expo-sqlite';
import {createExpoSqliteClient} from 'sqlfu';

import {migrate} from './migrations/.generated/migrations';
import {listTodos} from './sql/.generated/list-todos.sql';

export async function openAppDatabase() {
  const db = await SQLite.openDatabaseAsync('app.db');
  const client = createExpoSqliteClient(db);

  await migrate(client);

  return client;
}

export async function loadTodos() {
  const client = await openAppDatabase();
  return listTodos(client);
}
```

The migration bundle is idempotent. It applies missing migrations and skips
migrations already recorded in the on-device SQLite database.

## Read next

- [Getting Started](../getting-started.md) for the base SQL workflow.
- [Adapters](../adapters.md#expo-sqlite) for the Expo adapter snippet.
- [SQL migrations](../migration-model.md) for migration history and drift
  rules.
