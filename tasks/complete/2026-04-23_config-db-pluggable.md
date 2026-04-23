---
status: in-progress
size: large
---

# `config.db` should be pluggable (a callback, not just a path)

## High-level status

Done, pending review. Scope: **the callback form only** — `config.db`
accepts a factory returning a `DisposableAsyncClient`; string form kept
as sugar for opening a local sqlite file. Every command that touches the
DB (`migrate`, `check`, `sync`, `goto`, `baseline`, `generate`, the UI)
goes through the new `openConfigDb` dispatcher. Typegen still opens the
real DB for schema extraction (the "typegen doesn't need a DB" half
waits on `generate-self-contained`). Integration test added; full
vitest suite passes.

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

- [x] Move `DisposableAsyncClient` from `src/host.ts` to `src/types.ts`
  _so the factory type can live alongside the rest of the config shape.
  `src/host.ts` re-exports it so the existing `import ... from './host.js'`
  callers keep working._
- [x] Add `SqlfuDbFactory` to `src/types.ts`:
  `() => DisposableAsyncClient | Promise<DisposableAsyncClient>`.
- [x] Change `SqlfuConfig.db` and `SqlfuProjectConfig.db` to
  `string | SqlfuDbFactory`.
- [x] Update `assertConfigShape` in `src/config.ts` to accept a function
  as well as a string for `db`. _Dedicated error message: "db must be a
  filesystem path or a factory function returning a DisposableAsyncClient"._
- [x] Update `resolveProjectConfig`: string → resolved absolute path;
  function → passthrough.
- [x] Extract `openLocalSqliteFile(dbPath)` from `openNodeDb` inside
  `createNodeHost`. _Exported from `src/node/host.ts` as a reusable
  helper. Also added `openConfigDb(db)` — the dispatcher for
  `string | factory` — so `SqlfuHost.openDb` is a thin wrapper._
- [x] `createNodeHost.openDb(config)` now dispatches through
  `openConfigDb(config.db)`.
- [x] `src/typegen/index.ts` `materializeTypegenDatabase(config)`: reads
  schema from the real DB via a new `readSchemaFromConfigDb(db)` that
  handles both shapes, then materialises into `.sqlfu/typegen.db` as
  before.
- [x] Export `SqlfuDbFactory` from `src/index.ts`. _Re-exported
  transitively via `export * from './types.js'`._
- [x] Integration test at `packages/sqlfu/test/config-db-factory.test.ts`:
  defines a config whose `db` is a factory wrapping a file-backed
  better-sqlite3, runs `applyMigrateSql` + `getCheckMismatches`,
  asserts factory invocations/disposals and post-migrate DB state.
- [x] Existing test suite still passes (`pnpm test:node` — 1305 passed,
  9 skipped). UI Playwright suite had one known-flaky grid test
  (`appended rows focus the clicked cell`) that passed on retry;
  unrelated to this change.
- [x] Update `packages/sqlfu/README.md` with a "Pluggable `db`" section
  and a miniflare/D1 example.

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
