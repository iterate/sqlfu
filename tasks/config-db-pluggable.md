---
status: in-progress
size: large
---

# `config.db` should be pluggable (a callback, not just a path)

## High-level status

Working on it. Scope: **the callback form only** — make `config.db` accept a
factory that returns a `DisposableAsyncClient`. The string form stays as a
sugar for opening a local sqlite file. Every command that touches the DB
today (`migrate`, `check`, `sync`, `goto`, `baseline`, `generate`, the UI)
goes through the new code path. Typegen still opens the real DB for schema
extraction (the "typegen doesn't need a DB" half waits on
`generate-self-contained`).

## The problem

A user integrating sqlfu on Cloudflare D1 noticed: `pnpm dev` and `npx sqlfu`
operate on **different physical databases**. `pnpm dev` talks to miniflare's
D1 (a sqlite file under `.alchemy/miniflare/v3/d1/…`). `npx sqlfu` talks to
`./.sqlfu/dev.sqlite`. Both happen to have the same schema — because the
same migrations ran through two different code paths — but they will drift
the moment anything writes to one without the other, and they never share
data.

`SqlfuConfig.db: string` is doing two jobs today:

1. **Typegen schema source** — `sqlfu generate` reads schema from it.
2. **Dev database** — `sqlfu migrate` writes to it, `sqlfu check` compares
   against it, the UI browses its rows.

For adapter-mediated DBs (D1, Turso, libsql remote, miniflare bindings),
those two jobs are never the same thing. `config.db` ends up being a scratch
file the app never reads.

## Shape of the fix

Make `db` **pluggable** — accept either the existing string path (sugar for
opening a local sqlite file) or a factory that returns a
`DisposableAsyncClient`. Same disposable shape sqlfu already uses inside
`SqlfuHost.openDb`.

```ts
// sqlfu.config.ts
import {defineConfig, createD1Client} from 'sqlfu';
import {Miniflare} from 'miniflare';

export default defineConfig({
  db: async () => {
    const mf = new Miniflare({
      script: '', modules: true,
      defaultPersistRoot: '.alchemy/miniflare/v3',
      d1Persist: true,
      d1Databases: {DB: '<dev-db-id>'},
    });
    await mf.ready;
    const d1 = await mf.getD1Database('DB');
    return {
      client: createD1Client(d1),
      async [Symbol.asyncDispose]() { await mf.dispose(); },
    };
  },
  // ...
});
```

Classic local case stays: `db: './app.sqlite'` is equivalent to a factory
that opens that file via `node:sqlite`.

## Decisions (previously grilling questions)

These are now locked in for this task. Grilling-question framing in the
original task is preserved in git history; the ones relevant to scope are
resolved below.

- **Field name.** Keep `db` — it now means "the DB sqlfu talks to,"
  whatever the user says that is. No new field (`typegenSchemaSource`
  etc.); the typegen-doesn't-need-the-DB half is deferred to
  `generate-self-contained`.
- **Backward compat.** Zero users; this is pre-alpha. String form stays as
  sugar because it's a useful UX, *not* as a compat shim. No legacy
  fallback code.
- **Memoization.** The factory is invoked on every `host.openDb(config)`
  call. Users who need to share an expensive resource (e.g. a miniflare
  instance) memoize inside their factory. sqlfu does not auto-memoize,
  which keeps the `await using` dispose contract honest (each disposable
  is independent).
- **Typegen DB.** Typegen still reads schema from `config.db` (calling the
  factory if present) and then materialises a scratch sqlite file at
  `.sqlfu/typegen.db` for the TypeSQL analyser. Deferring the
  "typegen shouldn't need the DB" story to `generate-self-contained`.
- **Dispose lifecycle.** All commands already use `await using database =
  await context.host.openDb(context.config);` — that continues to work,
  and the factory's returned `[Symbol.asyncDispose]` is what runs on scope
  exit.
- **UI + remote / guardrails / concurrency tests.** Out of scope here.
  Those are follow-ups — this task ships the primitive; the guardrails
  and multi-process-sqlite stress tests come later.
- **Env switching.** Out of scope. Users handle that inside their factory
  (`process.env.SQLFU_ENV`, etc.).
- **Durable Objects.** Out of scope — DO storage is only addressable from
  inside a worker runtime.

## Implementation plan

- [ ] Move `DisposableAsyncClient` from `src/host.ts` to `src/types.ts` so
  `SqlfuConfig.db`'s factory type can live alongside the rest of the
  config shape without an import cycle. Keep a re-export in `src/host.ts`
  so existing `host.ts` consumers keep working.
- [ ] Add `SqlfuDbFactory` to `src/types.ts`:
  `() => DisposableAsyncClient | Promise<DisposableAsyncClient>`.
- [ ] Change `SqlfuConfig.db` and `SqlfuProjectConfig.db` to
  `string | SqlfuDbFactory`.
- [ ] Update `assertConfigShape` in `src/config.ts` to accept a function
  as well as a string for `db`, with a clear error message for anything
  else.
- [ ] Update `resolveProjectConfig`: if string, resolve to absolute path
  (existing behaviour). If function, pass through unchanged.
- [ ] Extract `openLocalSqliteFile(dbPath):
  Promise<DisposableAsyncClient>` from the existing `openNodeDb` inside
  `createNodeHost`. Export it from `src/node/host.ts` so users who want
  the factory form but with a local file have a one-liner.
- [ ] In `createNodeHost.openDb(config)`: if `config.db` is a string,
  call `openLocalSqliteFile`. If a function, invoke the factory and
  return its result.
- [ ] In `src/typegen/index.ts` `materializeTypegenDatabase(config)`:
  when `config.db` is a function, call it to get the source client; when
  a string, keep the existing `openMainDevDatabase(config.db)` code path
  (which is bun/node/better-sqlite3 aware). Either way, extract the
  schema and materialise into `.sqlfu/typegen.db`.
- [ ] Export `SqlfuDbFactory` from the relevant entry points so users
  can see and consume it.
- [ ] Add an integration test under `packages/sqlfu/test/` that:
  - Defines a config with a `db` factory that wraps a fresh in-memory /
    file-backed sqlite.
  - Runs `applyMigrateSql` and `getCheckMismatches` through the sqlfu
    API against that config.
  - Asserts the factory was invoked, migrations applied, check passes.
- [ ] Make sure the existing test suite still passes; `sqlfu` builds;
  the UI still boots against a string-form `db`.
- [ ] Update `packages/sqlfu/README.md` (and any docs page that talks
  about `db`) with one short paragraph + a code sample for the factory
  form.

## Out of scope (explicit non-goals for this PR)

- The `authority` knob proposed in `generate-self-contained.md`. Typegen
  still calls the real DB to read the schema.
- UI readonly / confirm-before-destructive guardrails when `db` points at
  a remote.
- Concurrency / multi-process sqlite stress tests (miniflare + sqlfu
  sharing a persisted file).
- A built-in factory memoization layer.
- Durable Object factories (runtime-only, cannot be driven from config).

## Prior art / links

- `tasks/generate-self-contained.md` — the typegen-schema-source half.
- `tasks/real-db-testing.md` — adapter-level remote testing.
- [`iterate/iterate#1278`](https://github.com/iterate/iterate/pull/1278) —
  the D1 integration that first exposed the two-databases divergence.

---

## Implementation notes

(Populated as the work progresses.)
