# Cloudflare D1

Sqlfu can talk to a deployed Cloudflare D1 database directly, so `migrate`,
`check`, `sync`, `goto`, `baseline`, and the UI all operate on the **real**
cloud database your worker uses, not a separate local sqlite file.

This is the recommended path if you're using:

- **Alchemy v2.** v2 [dropped Miniflare D1 emulation](https://alchemy.run/concepts/local-development)
  on purpose ("Your D1 Database is a real D1 Database"). `alchemy dev`
  provisions cloud resources; only your worker code runs locally.
  [`findMiniflareD1Path`](../README.md#pluggable-db) has nothing to find
  for you.
- **Wrangler/Terraform/manual provisioning.** You have a `databaseId` and
  an API token; sqlfu just needs to talk to it.
- **Alchemy v1 deployed envs.** When you point sqlfu at a non-local stage
  (preview, staging), you don't want a Miniflare sqlite at all.

If you're using Alchemy v1 locally and want sqlfu to operate on the
local Miniflare sqlite database, keep using
[`findMiniflareD1Path`](../README.md#pluggable-db). The two helpers are
deliberate alternatives, not a deprecation.

If you only want sqlfu to author migrations and generate typed wrappers, you
can omit `db` entirely. Commands that need a database use the local
`.sqlfu/app.db` file; add a D1 `db` factory only when you want `migrate`,
`check`, `sync`, or the UI to operate on the real D1 database.

## The one-line recipe

If you're on Alchemy v2 and have an `alchemy.run.ts` declaring a
`Cloudflare.D1Database("database")` resource, `createAlchemyD1Client`
reads alchemy's local state and produces a sqlfu `db` factory in one
call:

```ts
import {defineConfig} from 'sqlfu';
import {createAlchemyD1Client} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => createAlchemyD1Client({stack: 'my-app', stage: 'dev', fqn: 'database'}),
  migrations: {path: './migrations', preset: 'd1'},
  definitions: './definitions.sql',
  queries: './sql',
});
```

`apiToken` falls back to `process.env.CLOUDFLARE_API_TOKEN`. `accountId`
and `databaseId` come from the alchemy state file at
`.alchemy/state/<stack>/<stage>/<fqn>.json`, so you don't have to
copy-paste UUIDs into your config.

## Compose your own factory

`sqlfu/cloudflare` is just four small helpers, and `createAlchemyD1Client`
is one valid composition. If your project doesn't fit it because it uses a
different state location, dynamic database resolution, a custom auth source,
or no alchemy at all, wire your own factory from the parts. The two patterns
below cover almost everything.

### Compose with alchemy state

`readAlchemyD1State` reads alchemy v2's local state file and returns the
deployed resource's identity. Hand it to `createD1HttpClient` and you've
got a sqlfu `db` factory:

```ts
import {defineConfig} from 'sqlfu';
import {createD1HttpClient, readAlchemyD1State} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => {
    const {databaseId, accountId} = readAlchemyD1State({
      stack: 'my-app', stage: 'dev', fqn: 'database',
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

State lives at `.alchemy/state/<stack>/<stage>/<encoded-fqn>.json`.
`readAlchemyD1State` walks up from the cwd until it finds an
`.alchemy/state/` directory, so it works from any subdirectory of your
project. Pass `{alchemyDir: '/abs/path/to/.alchemy'}` to override when your
config runs outside the project tree.

`fqn` is the resource's
[fully-qualified name](https://github.com/alchemy-run/alchemy-effect/blob/main/packages/alchemy/src/FQN.ts)
inside the alchemy app. For a top-level
`Cloudflare.D1Database("database")` the fqn is just `"database"`. For a
nested `Namespace("Auth").run(...)` containing a
`D1Database("database")`, it's `"Auth/database"`.

This helper is **alchemy v2 specific**. Alchemy v1 stored state at a
different path and in a different shape. If you're on v1, prefer
`findCloudflareD1ByName` (below).

### Compose without alchemy

If you're not on alchemy, or you just don't want sqlfu reading alchemy's
state files, point at the deployed D1 with credentials and either an
explicit `databaseId` or a name lookup:

```ts
import {defineConfig} from 'sqlfu';
import {createD1HttpClient, findCloudflareD1ByName} from 'sqlfu/cloudflare';

export default defineConfig({
  db: async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    const {databaseId} = await findCloudflareD1ByName({
      accountId, apiToken, name: 'my-app-prod-database',
    });
    return {client: createD1HttpClient({accountId, apiToken, databaseId})};
  },
  migrations: {path: './migrations', preset: 'd1'},
});
```

If you've already got a `databaseId` from an env var, a hardcoded UUID,
or another source, skip the lookup and pass it straight to `createD1HttpClient`.
The lookup uses `GET /accounts/{id}/d1/database?name=...` and throws on
zero or multiple matches; use it when:

- You're on alchemy v1 and don't want to depend on its (different)
  on-disk state format.
- Your config dynamically resolves the database name (one config serves
  multiple environments by reading `process.env.STAGE`).
- You're not using alchemy at all.

`createD1HttpClient` returns a sqlfu `AsyncClient` directly. There is no separate
`createD1Client` wrap. Both helpers accept `fetch` and `apiBase` as DI
hooks for tests, proxies, or custom transports.

## Reference code as a starting point, not a forever API

These helpers are simple wrappers. If you outgrow them because you want
caching, retries, custom auth flows, or a reverse proxy, copy
`createD1HttpClient` from the source and edit it. The stable contract
is sqlfu's `AsyncClient` (the type returned by every `db` factory);
the helper is one valid way to produce one.

## What's *not* here

- **Local D1 emulation.** Alchemy v2 explicitly avoids this; if you
  want it, run `wrangler dev` instead of `alchemy dev`, and point
  sqlfu at the wrangler-managed Miniflare sqlite via
  [`findMiniflareD1Path`](../README.md#pluggable-db) (works for both
  alchemy v1's and wrangler's persist layout).
- **A bundled Cloudflare SDK.** `createD1HttpClient` uses raw `fetch`.
  No new dep on `cloudflare` or `wrangler`.
- **Credential discovery.** The helpers don't try to read
  `~/.wrangler/config/default.toml` or hit the OAuth flow. Pass an
  API token explicitly or via `CLOUDFLARE_API_TOKEN`. If you need
  more than that, wrap the helper.
