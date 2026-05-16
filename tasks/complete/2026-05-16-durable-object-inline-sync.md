---
status: complete
size: medium
branch: do-inline-sync-tests
---

# Durable Object Inline Sync

## Status

Implementation is complete on the branch. The strict runtime now exports `sync(client, {definitions})`; Durable Object tests cover constructor initialization and redeploy-style migration of already-initialized object storage. Remaining review note: the broader import-surface test still has an unrelated `sqlfu/analyze`/`node:sqlite` failure.

## Assumptions

- The runtime API should live on the strict `sqlfu` entrypoint, not `sqlfu/api`, so a Durable Object can import it without Node-only dependencies.
- The desired schema is provided as inline SQL definitions, equivalent to `definitions.sql` content.
- No generated migrations, migration history, or typegen participate in this task.
- Destructive sync is allowed for this exploratory pre-alpha path, matching the existing CLI `sync` behavior.
- Durable Object runtime cannot rely on Node scratch databases, so the implementation should derive the desired schema inside the same SQLite connection using temporary or prefixed resources and clean them up.

## Checklist

- [x] Add a real Durable Object test that initializes schema from inline definitions inside the constructor. _Covered by `runtime sync applies inline definitions in a durable object constructor` in `packages/sqlfu/test/adapters/durable-object.test.ts`._
- [x] Add a redeploy-style Durable Object test path where the same object storage has the old schema, then new inline definitions cause `sync(...)` to migrate it. _Covered by `runtime sync migrates existing durable object storage on redeploy`, using `durableObjectsPersist` to reuse Miniflare DO storage._
- [x] Keep the test focused on public imports from the strict `sqlfu` runtime where possible. _The worker fixture imports `createDurableObjectClient`, `sql`, and `sync` from `./runtime/index.js`._
- [x] Implement the minimal runtime sync surface needed by the test. _Added `packages/sqlfu/src/sync.ts` and exported `sync` plus `RuntimeSyncOptions` from `packages/sqlfu/src/index.ts`._
- [x] Verify the targeted Durable Object tests pass. _Ran `pnpm --filter sqlfu exec vitest run test/adapters/durable-object.test.ts`._
- [x] Update the pull request body with the externally-visible behavior and before/after output once implementation is complete. _PR body updated after implementation with behavior, strategy, and verification._

## Implementation Notes

- Existing file to extend: `packages/sqlfu/test/adapters/durable-object.test.ts`.
- Existing DO fixture already supports generated migrations and one object name; it likely needs a second worker/module class or a helper option to simulate redeploying the same persisted Durable Object storage with changed constructor code.
- Existing schema diff code uses host scratch DBs. For Durable Objects, a same-connection temporary schema or name-prefix strategy may be needed instead.
- Miniflare rejects `temp.sqlite_schema` in Durable Objects with `SQLITE_AUTH`, so the implementation uses prefixed main-schema objects (`__sqlfu_sync_*`) as the desired-schema materialization, inspects them, unprefixes the inspected model, plans the diff, then cleans the prefixed objects.
- While exercising an added column plus a new unique index, the SQLite planner skipped explicit index changes for tables classified as `add-columns`. The implementation fixes that by collecting explicit index changes in that branch too.
