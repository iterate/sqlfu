# Cloudflare D1

For Cloudflare D1, start with the normal [Getting Started](../getting-started.md)
workflow: author `definitions.sql`, draft migrations, write `.sql` query files,
and generate wrappers. Then make the CLI and Worker use the D1 adapter.

D1 is asynchronous, so the default generated wrappers are already the right
shape: call them with `await`.

## Project shape

```txt
src/db/
|-- definitions.sql
|-- migrations/
|-- queries/
|   `-- queries.sql
`-- sqlfu.config.ts
```

## Config for D1 migrations

If sqlfu owns the D1 migration table, use the default migration preset. If your
project is taking over from wrangler or alchemy D1 migrations, use the D1 preset
so sqlfu reads and writes `d1_migrations`:

You do not need to connect sqlfu to your alchemy dev database just to author
migrations and generate types. If you omit `db`, sqlfu uses a local SQLite file
at `.sqlfu/app.db` for commands that need a database, while `draft` and
`generate` still read from your SQL files. Add a `db` factory when you want
`migrate`, `check`, `sync`, or the UI to operate on the real D1 database.

For authoring only, omit `db`:

```ts
import {defineConfig} from 'sqlfu';

export default defineConfig({
  definitions: './definitions.sql',
  migrations: {path: './migrations', preset: 'd1'},
  queries: './queries',
});
```

When you want sqlfu commands to talk to the real deployed D1 database, add a
factory:

```ts
import {defineConfig} from 'sqlfu';
import {createAlchemyD1Client} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => createAlchemyD1Client({stack: 'my-app', stage: 'dev', fqn: 'database'}),
  definitions: './definitions.sql',
  migrations: {path: './migrations', preset: 'd1'},
  queries: './queries',
});
```

That factory makes `sqlfu migrate`, `sqlfu check`, `sqlfu goto`, `sqlfu baseline`,
and the UI talk to the real deployed D1 database. For local Miniflare-backed D1,
use the same idea with a Miniflare binding or `findMiniflareD1Path()`.

## Schema and query

```sql
create table posts (
  id integer primary key,
  slug text not null unique,
  title text not null,
  published integer not null default 0
);
```

Put the query in `queries/queries.sql`:

```sql
/** @name listPublishedPosts */
select id, slug, title
from posts
where published = 1
order by id desc
limit :limit;
```

Then run the same loop as the getting-started guide:

```sh
npx sqlfu --config src/db/sqlfu.config.ts draft
npx sqlfu --config src/db/sqlfu.config.ts migrate
npx sqlfu --config src/db/sqlfu.config.ts generate
```

## Worker runtime

Use `createD1Client(env.DB)` in the Worker. Generated wrappers do not care that
the runtime is D1; they only need a sqlfu `AsyncClient`.

```ts
import {createD1Client} from 'sqlfu';

import {listPublishedPosts} from './db/queries/.generated/queries.sql.ts';

type Env = {
  DB: D1Database;
};

export default {
  async fetch(_request: Request, env: Env) {
    const client = createD1Client(env.DB);
    const posts = await listPublishedPosts(client, {limit: 20});

    return Response.json(posts);
  },
};
```

## Read next

- [Getting Started](../getting-started.md) for the base SQL -> draft -> generate
  loop.
- [Adapters](../adapters.md#cloudflare-d1) for the D1 adapter snippet.
- [Cloudflare D1](../cloudflare-d1.md) for deployed-D1 HTTP access, alchemy
  state lookup, and custom database-id resolution.
- [SQL migrations](../migration-model.md#migration-presets) for the D1 migration
  preset.
