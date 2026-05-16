# Cloudflare / Alchemy

`sqlfu/cloudflare` is a config-time module for projects that use Cloudflare D1,
especially through Alchemy.

Use this page when your question is "how should sqlfu find or talk to my D1
database?" For a full Worker project walkthrough, use [Cloudflare D1](../guides/cloudflare-d1.md).
For Durable Object storage, use [Durable Objects](../guides/durable-objects.md).

## What the module exports

`sqlfu/cloudflare` exports helpers for D1 lookup, state discovery, and remote
access:

- `findMiniflareD1Path()` finds a local Miniflare v3 D1 SQLite file for
  Alchemy v1-style local development layouts.
- `readAlchemyD1State()` reads Alchemy v2 state for a `Cloudflare.D1Database`
  resource and returns `accountId`, `databaseId`, and the database name.
- `createD1HttpClient()` talks to deployed Cloudflare D1 through the Cloudflare
  HTTP API.
- `findCloudflareD1ByName()` resolves a deployed D1 database name to a
  `databaseId`.
- `createAlchemyD1Client()` composes Alchemy state lookup with the D1 HTTP
  client for the common Alchemy v2 path.

These helpers are for sqlfu commands and local tooling. Worker runtime code
usually uses the D1 binding directly with `createD1Client(env.DB)`.

## Alchemy v2 deployed D1

Alchemy v2 runs real cloud D1 resources during development. If your
`alchemy.run.ts` declares a `Cloudflare.D1Database("database")`, point sqlfu at
that deployed database with `createAlchemyD1Client()`:

```ts
import {defineConfig} from 'sqlfu';
import {createAlchemyD1Client} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => createAlchemyD1Client({
    stack: 'my-app',
    stage: 'dev',
    fqn: 'database',
  }),
  migrations: {path: './migrations', preset: 'd1'},
  definitions: './definitions.sql',
  queries: './sql',
});
```

`apiToken` defaults to `process.env.CLOUDFLARE_API_TOKEN`. `accountId` and
`databaseId` come from `.alchemy/state/<stack>/<stage>/<fqn>.json`.

Use this when you want `sqlfu migrate`, `sqlfu check`, `sqlfu sync`, `sqlfu
goto`, `sqlfu baseline`, or the UI to operate on the same deployed D1 database
your Worker uses.

## Compose the pieces yourself

If your project needs a different auth source, state location, or resource
lookup, use the lower-level helpers:

```ts
import {defineConfig} from 'sqlfu';
import {createD1HttpClient, readAlchemyD1State} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => {
    const {accountId, databaseId} = readAlchemyD1State({
      stack: 'my-app',
      stage: 'dev',
      fqn: 'database',
    });

    return {
      client: createD1HttpClient({
        accountId,
        databaseId,
        apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      }),
    };
  },
  migrations: {path: './migrations', preset: 'd1'},
});
```

If you do not use Alchemy state, resolve D1 by name:

```ts
import {defineConfig} from 'sqlfu';
import {createD1HttpClient, findCloudflareD1ByName} from 'sqlfu/cloudflare';

export default defineConfig({
  db: async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    const {databaseId} = await findCloudflareD1ByName({
      accountId,
      apiToken,
      name: 'my-app-dev-database',
    });

    return {client: createD1HttpClient({accountId, apiToken, databaseId})};
  },
  migrations: {path: './migrations', preset: 'd1'},
});
```

## Local Miniflare D1

If your local development setup still writes a Miniflare D1 SQLite file, use
`findMiniflareD1Path()`:

```ts
import {defineConfig} from 'sqlfu';
import {findMiniflareD1Path} from 'sqlfu/cloudflare';

export default defineConfig({
  db: findMiniflareD1Path('my-app-dev'),
  migrations: {path: './migrations', preset: 'd1'},
  definitions: './definitions.sql',
  queries: './sql',
});
```

`findMiniflareD1Path()` walks up from the current working directory until it
finds `.alchemy/miniflare/v3`. Pass `{miniflareV3Root}` when the config runs
outside the project tree.

For Alchemy v2, prefer `createAlchemyD1Client()`: there may be no local
Miniflare file to find.

## Read next

- [Cloudflare D1 guide](../guides/cloudflare-d1.md): full D1 project setup,
  Worker runtime code, and query generation.
- [Cloudflare D1 details](../cloudflare-d1.md): deeper notes on Alchemy state,
  deployed D1 HTTP access, and helper tradeoffs.
- [Import surface](../imports.md#sqlfucloudflare): how `sqlfu/cloudflare` fits
  with the rest of sqlfu's public entrypoints.
