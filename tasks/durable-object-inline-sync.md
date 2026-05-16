---
status: in-progress
size: medium
branch: do-inline-sync-tests
---

# Durable Object Inline Sync

## Status

Early spec commit. The goal is to add a Durable Object test and strict-runtime API for inline SQL definitions that can sync an existing Durable Object SQLite database during a redeploy, without generated migrations or typegen.

## Assumptions

- The runtime API should live on the strict `sqlfu` entrypoint, not `sqlfu/api`, so a Durable Object can import it without Node-only dependencies.
- The desired schema is provided as inline SQL definitions, equivalent to `definitions.sql` content.
- No generated migrations, migration history, or typegen participate in this task.
- Destructive sync is allowed for this exploratory pre-alpha path, matching the existing CLI `sync` behavior.
- Durable Object runtime cannot rely on Node scratch databases, so the implementation should derive the desired schema inside the same SQLite connection using temporary or prefixed resources and clean them up.

## Checklist

- [ ] Add a real Durable Object test that initializes schema from inline definitions inside the constructor.
- [ ] Add a redeploy-style Durable Object test path where the same object storage has the old schema, then new inline definitions cause `sync(...)` to migrate it.
- [ ] Keep the test focused on public imports from the strict `sqlfu` runtime where possible.
- [ ] Implement the minimal runtime sync surface needed by the test.
- [ ] Verify the targeted Durable Object tests pass.
- [ ] Update the pull request body with the externally-visible behavior and before/after output once implementation is complete.

## Implementation Notes

- Existing file to extend: `packages/sqlfu/test/adapters/durable-object.test.ts`.
- Existing DO fixture already supports generated migrations and one object name; it likely needs a second worker/module class or a helper option to simulate redeploying the same persisted Durable Object storage with changed constructor code.
- Existing schema diff code uses host scratch DBs. For Durable Objects, a same-connection temporary schema or name-prefix strategy may be needed instead.
