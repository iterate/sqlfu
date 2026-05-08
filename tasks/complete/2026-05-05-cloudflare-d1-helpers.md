---
status: ready
size: medium
---

# Cloudflare D1 helpers (`sqlfu/cloudflare`)

## Status Summary

In progress. Plan committed as the first commit on this branch so the
spec is reviewable before any code lands.

## Goal

A new `sqlfu/cloudflare` entry exporting helpers for pointing sqlfu's
`db` factory at a deployed Cloudflare D1 over HTTP. Two motivating
audiences:

- **Alchemy v2 users.** Alchemy v2 dropped local Miniflare D1 entirely
  ([alchemy v2 local-development docs](https://github.com/alchemy-run/alchemy-effect/blob/main/website/src/content/docs/concepts/local-development.mdx)
  — "Your D1 Database is a real D1 Database"). `findMiniflareD1Path()`
  has nothing to find for them; sqlfu must talk to the cloud DB.
- **Anyone managing D1 outside sqlfu** (wrangler, terraform, drizzle
  push, alchemy v1 deployed envs) who wants `sqlfu migrate`/`check`/
  `goto`/`sync` to operate on the real cloud DB instead of a scratch
  sqlite file.

## User-facing shape

Low-level: bring your own credentials and `databaseId`:

```ts
import {defineConfig} from 'sqlfu';
import {createD1HttpClient} from 'sqlfu/cloudflare';

export default defineConfig({
  db: () => ({
    client: createD1HttpClient({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      databaseId: '<uuid>',
    }),
  }),
  migrations: {path: './migrations', preset: 'd1'},
});
```

Look up by name via Cloudflare API (no alchemy needed):

```ts
import {createD1HttpClient, findCloudflareD1ByName} from 'sqlfu/cloudflare';

db: async () => {
  const {databaseId} = await findCloudflareD1ByName({
    accountId, apiToken, name: 'my-app-prod-database',
  });
  return {client: createD1HttpClient({accountId, apiToken, databaseId})};
},
```

Discover from alchemy's local state (v2 layout, `.alchemy/state/...`):

```ts
import {readAlchemyD1State, createD1HttpClient} from 'sqlfu/cloudflare';

db: () => {
  const {databaseId, accountId} = readAlchemyD1State({
    stack: 'my-app', stage: 'dev', fqn: 'database',
  });
  return {client: createD1HttpClient({
    accountId, apiToken: process.env.CLOUDFLARE_API_TOKEN!, databaseId,
  })};
},
```

One-liner combinator (`createAlchemyD1Client`):

```ts
import {createAlchemyD1Client} from 'sqlfu/cloudflare';

db: () => createAlchemyD1Client({stack: 'my-app', stage: 'dev', fqn: 'database'}),
```

## Helpers

### 1. `createD1HttpClient(options) -> AsyncClient<D1DatabaseLike>`

Returns a sqlfu `AsyncClient` that talks to Cloudflare's HTTP D1 query
API (`POST /accounts/{accountId}/d1/database/{databaseId}/query`).
Drops directly into a `db` factory — no separate `createD1Client`
wrapping step.

Inputs:
- `accountId: string` (required)
- `apiToken: string` (required — caller pulls from env, secret store,
  whatever; we don't reach into `process.env` here)
- `databaseId: string` (required)
- `fetch?: typeof fetch` — DI hook for tests + custom transports
- `apiBase?: string` — default `https://api.cloudflare.com/client/v4`

### 2. `readAlchemyD1State(options) -> {databaseId, databaseName, accountId, ...}`

Reads `.alchemy/state/<stack>/<stage>/<encoded-fqn>.json` and returns
the deployed resource's `attr` (the alchemy term for "outputs"). The
JSON shape is documented in alchemy-effect's
`packages/alchemy/src/State/StateEncoding.ts`:

```json
{
  "id": "...",
  "type": "Cloudflare.D1Database",
  "props": {...},
  "attr": {"databaseId": "...", "accountId": "...", ...}
}
```

FQN encoding (per alchemy's `FQN.ts`): `/` → `__`. Top-level resource
`D1Database("foo")` is just `foo.json`; nested `Ns/foo` is `Ns__foo.json`.

Inputs:
- `stack: string`
- `stage: string`
- `fqn: string`
- `alchemyDir?: string` — explicit `.alchemy/` path. If omitted, walk
  up from `cwd ?? process.cwd()` looking for `.alchemy/`. Mirrors
  `findMiniflareD1Path`'s search shape.
- `cwd?: string`

Throws actionable errors on:
- No `.alchemy/` found
- File missing (with the resolved path printed)
- Wrong `type` (e.g. someone passed a Worker fqn)
- Missing `databaseId` in `attr` (corrupt state)

### 3. `findCloudflareD1ByName(options) -> {databaseId, databaseName, accountId}`

`GET /accounts/{accountId}/d1/database?name=<name>` — Cloudflare's
public list endpoint. Use when you want to skip alchemy's state file
format (e.g. you're on alchemy v1, or not using alchemy at all). Returns
the single match; throws if zero or multiple matches.

Inputs:
- `accountId, apiToken, name` (required)
- `fetch?, apiBase?` (DI/override)

### 4. `createAlchemyD1Client(options) -> {client, [Symbol.asyncDispose]?}`

One-liner combinator: `readAlchemyD1State` + `createD1HttpClient` +
`createD1Client`. Returns the full sqlfu `db` factory return shape
(`{client}`), ready to drop into a config.

Inputs: union of `readAlchemyD1State` and `createD1HttpClient`'s
options minus `accountId` (resolved from state file) and `databaseId`
(also from state file). `apiToken` defaults to
`process.env.CLOUDFLARE_API_TOKEN` if omitted, with an actionable
error if neither is supplied.

## Constraints / decisions

- **No new runtime dep.** Use raw `fetch`. Don't pull in the
  `cloudflare` SDK — it's heavy, and the two endpoints we need are
  trivial.
- **Universal where possible.** `createD1HttpClient` and
  `findCloudflareD1ByName` only use `fetch` (global in Node and
  workers). `readAlchemyD1State` uses `node:fs` via
  `process.getBuiltinModule` (same pattern as `miniflare.ts`). The
  whole entry stays lazy-evaluated so a worker bundle that only
  imports the HTTP helpers doesn't pull in `node:fs`.
- **DI'd fetch.** Tests run a real `node:http` server (per CLAUDE.md:
  "Prefer the shared test server with inline request handling") and
  pass `{fetch: <fn that points at it>}`.
- **No `vi.mock`.** Real fixtures, real HTTP, real fs.
- **Symbol.asyncDispose.** Test fixtures use it. (D1 HTTP client has
  no resource to dispose; the `db` factory return doesn't need one.)
- **Errors are actionable.** Every error includes the resolved path,
  request URL, or status code that would let an operator take the
  next step without `console.log`-debugging.

## Out of scope (not this PR)

- A real-account end-to-end test (would need live CF credentials and
  cleanup logic).
- A v2-CLI integration test. Blocked on alchemy v2 fixing the
  extensionless-imports bug in `lib/Cli/*.js` (publishing
  `2.0.0-beta.29` and earlier are non-functional from Node).
- A `D1Database`-shape `exec`/`batch` implementation. sqlfu's adapter
  only uses `prepare/bind/all/run`; adding more surface means more
  test load for no current callers. Add when something needs it.

## Checklist

- [ ] Commit this spec alone as the first commit, push, open PR
- [ ] `packages/sqlfu/src/cloudflare/exports.ts` (entry barrel) +
      `d1-http.ts` + `alchemy-state.ts` + `cf-api.ts`
- [ ] Wire `./cloudflare` into `package.json` `publishConfig.exports`
      (mirror `./node` shape)
- [ ] Implement `createD1HttpClient`
- [ ] Integration test: `node:http` server stands in for
      `api.cloudflare.com`, asserts request body shape + decoding
      across `prepare/bind/all/first/run`
- [ ] Implement `readAlchemyD1State`
- [ ] Test against fixture state files (top-level + nested FQN)
- [ ] Implement `findCloudflareD1ByName`
- [ ] Test (same node:http server) — empty list, multiple matches,
      success path
- [ ] Implement `createAlchemyD1Client` combinator
- [ ] Test composing all three end-to-end against the local server
- [ ] Add `dist/cloudflare/exports.js` to `test/import-surface.test.ts`
- [ ] `docs/cloudflare-d1.md` — argument-first deep-dive, copy-paste
      ready snippets per `CLAUDE.md`'s "reference code in docs" rule
- [ ] Short pointer in `packages/sqlfu/README.md`; run
      `pnpm sync:root-readme`
- [ ] Verification: package build, typecheck, vitest, ui build,
      sync:root-readme:check
- [ ] Move this task to `tasks/complete/<date>-cloudflare-d1-helpers.md`
      once merged

## Implementation Notes

- Worktree: `../worktrees/sqlfu/cloudflare-d1-helpers`
- Branch: `feat/cloudflare-d1-helpers`
- PR: https://github.com/mmkal/sqlfu/pull/86
