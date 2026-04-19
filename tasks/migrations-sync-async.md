---
status: ready
size: medium
---

# applyMigrations: portability + sync/async unification

Pick this up **after PR #4 (migration-failure) merges.** PR #4 already drops the `host` parameter and inlines `createHash` from `node:crypto` + `path.basename`. That's clean API but Node-only — a durable object or Cloudflare Worker calling `applyMigrations` would crash on the `node:crypto` import. This task closes both gaps.

## Two problems to solve together

### 1. Portability (blocks DO / Worker / browser use)

After PR #4 lands, `applyMigrations(client, {migrations})` is the API. But the implementation uses `createHash('sha256')` and `path.basename` — neither exists in Workers/DOs/browsers.

**Fix:** swap `node:crypto` for WebCrypto (`crypto.subtle.digest('SHA-256', …)`, available in Node 19+, Workers, DOs, browsers), and swap `path.basename` for the existing `basename` helper in `core/paths.ts`.

### 2. Sync clients still pay the async tax

Even on a portable implementation, `crypto.subtle.digest` is async — so `applyMigrations` stays async, even when the client is a `SyncClient`. In a DO that means every `await` inside is a yield point where the runtime can flush buffered writes. We already dropped SQL `BEGIN`/`COMMIT` from the DO adapter because DOs reject them, and we're relying on the DO's request-level output gate for atomicity. Thrown errors roll back; a process crash mid-migration can leave `sqlfu_migrations` out of sync with the live schema.

The real fix is to let the DO caller wrap the whole thing in `state.storage.transactionSync(() => applyMigrations(syncClient, …))`. `transactionSync` requires a **synchronous** callback. `applyMigrations` being async-only doesn't fit.

**But we do not want `applyMigrationsSync` vs `applyMigrationsAsync` as two separate functions.** One name, one call site.

## Approach

Two pieces:

1. **Types: function overloads.** The exported signature should branch on the client type so callers get correct return types without casts.
   ```ts
   export function applyMigrations(client: SyncClient, params): void;
   export function applyMigrations(client: AsyncClient, params): Promise<void>;
   ```

2. **Runtime: one body, dual-dispatched.** Investigate [`quansync`](https://github.com/quansync-dev/quansync) — it lets you write a single generator-based function once and call it as either sync or async based on the runtime arguments. That's *exactly* the shape we need. If quansync fits, the implementation stays DRY and we avoid a hand-maintained branching body. If it doesn't (bundle-size cost, `try/finally` gaps, etc.), the fallback is a small internal utility that runs the same operation steps against either a sync or async client.

`baselineMigrationHistory` and `replaceMigrationHistory` should get the same treatment.

### Digest sync/async

- For `AsyncClient` path: `crypto.subtle.digest` (async, cross-runtime).
- For `SyncClient` path: needs a sync SHA-256. `node:crypto.createHash` is sync but Node-only. DO/Worker sync-client users need either a bundled sync SHA-256 (~2KB from a vetted implementation) or a user-supplied sync digest. Decide during implementation — probably ship a vendored sync SHA-256 so sync clients just work everywhere.

## Acceptance

- `applyMigrations(syncClient, …)` returns `void`.
- `applyMigrations(asyncClient, …)` returns `Promise<void>`.
- DO test wraps the call in `state.storage.transactionSync(() => applyMigrations(client, …))` and gets genuine per-migration atomicity — no crash-mid-migration window.
- `bundle.test.ts` (Node `AsyncClient` path via `createNodeSqliteClient`) keeps working unchanged.
- Migration-failure tests (from PR #4) keep passing.
- No `applyMigrationsSync` / `applyMigrationsAsync` surface. One function.
- Portable: calls succeed in Node 19+, Cloudflare Workers, durable objects, and browsers without any special shim.

## Open questions

- Bundled sync SHA-256 or a user-supplied sync digest hook? Leaning toward bundled for zero-ceremony sync usage, but the current API has no user hook for digest at all — see if there's a clean way to let advanced callers override without bloating the common path.
- Confirm the DO `client.transaction` adapter change (from PR #8) can be reverted or repurposed once `storage.transactionSync` can wrap the whole applyMigrations call — do we want the adapter's `transaction` to route to `transactionSync` automatically for sync callbacks, or leave it as a pass-through?

## References

- PR #8 (pre-rebase) introduced `MigrationsHost` + `defaultMigrationsHost`; reverted because PR #4 removes the `host` parameter entirely and that's the better end-state.
- PR #4 inlines `node:crypto` and `node:path` — the portability gap this task closes.
- `packages/sqlfu/src/adapters/durable-object.ts` — `transaction()` is a pass-through that invokes the callback without `BEGIN`/`COMMIT`; comment documents the trade-off.
- `packages/sqlfu/src/migrations/index.ts` — `applyMigrations`, `baselineMigrationHistory`, `replaceMigrationHistory` all share the same shape.
- quansync: https://github.com/quansync-dev/quansync
