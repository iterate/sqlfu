# celld

[celld](https://celld.dev) is Deno's open-source runtime for Cloudflare Workers
apps on your own machines. It runs Workers, Durable Objects, and D1 from the
`wrangler.jsonc` you already have.

sqlfu needs no changes for celld. `createDurableObjectClient()` and
`createD1Client()` work the same way they do on Cloudflare, so the
[Durable Objects](./durable-objects.md) and [Cloudflare D1](./cloudflare-d1.md)
guides apply as written. This page shows a full Durable Object example on celld.

## Durable Object

`wrangler.jsonc`:

```jsonc
{
  "name": "counters",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-01",
  "durable_objects": {
    "bindings": [{"name": "COUNTERS", "class_name": "Counters"}]
  },
  "migrations": [{"tag": "v1", "new_sqlite_classes": ["Counters"]}]
}
```

`src/index.ts` keeps the schema, migrations, and queries next to the object that
owns the storage:

```ts
import {DurableObject} from 'cloudflare:workers';
import {createDurableObjectClient, defineConfig, sql} from 'sqlfu';

type Env = {COUNTERS: DurableObjectNamespace<Counters>};

export class Counters extends DurableObject<Env> {
  static db = defineConfig({
    definitions: sql`
      create table counters (
        name text primary key not null,
        value integer not null default 0
      );
    `,
    migrations: [
      {
        name: '20260506000000_create_counters',
        content: sql`
          create table counters (
            name text primary key not null,
            value integer not null default 0
          );
        `,
      },
    ],
    queries: {
      incrementCounter: sql.one<{ parameters: { name: string }; result: { name: string; value: number } }>`
        insert into counters (name, value)
        values (:name, 1)
        on conflict (name) do update set value = value + 1
        returning name, value
      `,
    },
  });

  db: typeof Counters.db.$type;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = Counters.db(createDurableObjectClient(ctx.storage));
    this.db.migrate();
  }

  increment(name: string) {
    return this.db.incrementCounter({name});
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const name = new URL(request.url).searchParams.get('name') || 'visits';
    return Response.json(await env.COUNTERS.getByName('main').increment(name));
  },
};
```

Author with the sqlfu CLI as usual, then run it with celld:

```sh
npx sqlfu --config src/index.ts draft
npx sqlfu --config src/index.ts generate
celld dev
curl 'http://127.0.0.1:9876/?name=visits'
```

Each object runs `migrate()` when it starts, so a deploy upgrades each object's
database the first time that object is used. See
[Durable Objects](./durable-objects.md#runtime-migrations).

## D1

Add a `d1_databases` binding to `wrangler.jsonc` and pass it to
`createD1Client(env.DB)`, as in the [Cloudflare D1](./cloudflare-d1.md) guide.
celld creates the database the first time it is used.

## What is tested

sqlfu's test suite runs against a real `celld dev` node (celld v0.6.3):

- an `extends DurableObject` class with an inline config: `migrate()`, inserts,
  typed queries, and a separate database for each object
- `createD1Client()`: `migrate()`, inserts, and typed queries

Not tested on celld yet: the [admin UI](/docs/ui) embedded in a Worker or Durable
Object with `@sqlfu/ui`. The CLI doesn't need celld: `draft` and `generate` read
your SQL files, not the live database.
