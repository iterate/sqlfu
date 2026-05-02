# Cloudflare D1

Sqlfu can talk to a deployed Cloudflare D1 database directly, so `migrate`,
`check`, `sync`, `goto`, `baseline`, and the UI all operate on the **real**
cloud database your worker uses — not a separate local sqlite file.

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

## The pieces

`sqlfu/cloudflare` is just four small helpers. The combinator above is
`createD1HttpClient(createD1Client(readAlchemyD1State(...)))` with the
plumbing wired up. If your project doesn't fit the one-line recipe —
different state directory, dynamic database resolution, custom auth —
compose your own factory from the parts.

### `createD1HttpClient`

The HTTP transport. Wraps Cloudflare's
[D1 query API](https://developers.cloudflare.com/api/operations/cloudflare-d1-query-database)
in a `prepare(sql).bind(...).all()/.first()/.run()` shape that matches
`@cloudflare/workers-types` `D1Database`. Drop into sqlfu's
`createD1Client` exactly the same way as a Miniflare binding:

```ts
import {defineConfig, createD1Client} from 'sqlfu';
import {createD1HttpClient} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => ({
    client: createD1Client(createD1HttpClient({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      databaseId: '00000000-0000-0000-0000-000000000000',
    })),
  }),
  migrations: {path: './migrations', preset: 'd1'},
});
```

Options:

- `accountId`, `apiToken`, `databaseId` — required.
- `fetch?: typeof fetch` — DI hook. Defaults to `globalThis.fetch`.
  Useful for tests (point at a local server) or for piping through a
  proxy/auth layer.
- `apiBase?: string` — defaults to `https://api.cloudflare.com/client/v4`.

### `readAlchemyD1State`

Reads alchemy v2's local state file and returns the deployed resource's
identity:

```ts
import {readAlchemyD1State, createD1HttpClient} from 'sqlfu/cloudflare';

const {databaseId, accountId} = readAlchemyD1State({
  stack: 'my-app',
  stage: 'dev',
  fqn: 'database',
});
```

State lives at `.alchemy/state/<stack>/<stage>/<encoded-fqn>.json`. The
helper walks up from the cwd until it finds an `.alchemy/state/`
directory, so it works from any subdirectory of your project. Pass
`{alchemyDir: '/abs/path/to/.alchemy'}` to override.

`fqn` is the resource's
[fully-qualified name](https://github.com/alchemy-run/alchemy-effect/blob/main/packages/alchemy/src/FQN.ts)
inside the alchemy app. For a top-level `Cloudflare.D1Database("database")`
the fqn is just `"database"`. For a nested `Namespace("Auth").run(...)`
that contains a `D1Database("database")`, it's `"Auth/database"`.

This helper is **alchemy v2 specific** — alchemy v1 stored state at a
different path and in a different shape. If you're on v1, prefer
`findCloudflareD1ByName` (below).

### `findCloudflareD1ByName`

Look up a D1 by name via Cloudflare's REST API:

```ts
import {findCloudflareD1ByName, createD1HttpClient} from 'sqlfu/cloudflare';

const {databaseId, accountId} = await findCloudflareD1ByName({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  name: 'my-app-prod-database',
});
```

Throws if zero or multiple databases match the name. Use this when:

- You're not using alchemy at all.
- You're on alchemy v1 and don't want to depend on its (different)
  on-disk state format.
- Your config dynamically resolves the database name (e.g. one config
  serves multiple environments by reading `process.env.STAGE`).

### `createAlchemyD1Client`

The combinator above. Inputs are the union of `readAlchemyD1State` and
`createD1HttpClient`'s options, minus `accountId` and `databaseId`
(read from state). Returns a sqlfu `db` factory return value
(`{client}`) ready to drop into a config.

## Reference code as a starting point, not a forever API

These helpers are simple wrappers. If you outgrow them — you want
caching, retries, custom auth flows, a reverse proxy — copy
`createD1HttpClient` from the source and edit it. The stable contract
is sqlfu's `D1DatabaseLike` interface (anything with a `prepare(sql)`
returning `{bind, all, first, run}`); the helper is one valid way to
satisfy it.

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
