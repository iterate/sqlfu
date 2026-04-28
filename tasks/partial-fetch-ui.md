---
status: in-progress
size: medium
---

# Partial fetch for sqlfu/ui

Export a runtime-agnostic partial `fetch` implementation for sqlfu/ui so a host
that already owns a `fetch` method can delegate sqlfu UI requests without
starting the Node server.

Use the Durable Object adapter as the proof: a Durable Object should be able to
serve the UI assets and handle the UI's `/api/rpc` oRPC backend from the same
object, backed by that object's SQLite storage, so the UI can browse and edit
the Durable Object database.

## Status (2026-04-28)

Task clarified and branch/worktree created. No implementation has landed yet.
Main missing pieces are the exported partial fetch helper, the Durable
Object-backed host glue, and a Miniflare proof test.

## Assumptions

- The helper should return `undefined` for requests it does not own, so callers
  can compose it inside a larger Worker or Durable Object `fetch` method.
- The first implementation can accept UI assets as an explicit map of paths to
  bodies/responses. Cloudflare-specific asset bindings can be layered on later.
- The Durable Object proof should prioritize browsing and ad-hoc SQL against
  the live object database. Full project filesystem semantics can be minimal:
  definitions/migrations/query files may be supplied in memory, and unsupported
  generated-catalog analysis can return an empty catalog.
- The UI currently expects `/api/rpc` at the serving origin, so this pass will
  not add a path-prefix mount mode.

## Checklist

- [ ] Add an exported partial UI fetch helper that serves `/api/rpc`, `OPTIONS`
  preflight, `/`, static assets, and returns `undefined` for unrelated paths.
- [ ] Add durable-object-oriented host glue that opens the object's
  `ctx.storage.sql` through `createDurableObjectClient` and adapts it to the
  async host shape expected by `uiRouter`.
- [ ] Prove the use case in Miniflare: a Durable Object serves an index asset,
  a JS asset, and the UI oRPC contract from the same `fetch` method.
- [ ] Prove the Durable Object DB can be browsed through the UI contract by
  asserting `schema.get`, `table.list`, and `sql.run` work against object
  storage.
- [ ] Export the new surface from the appropriate UI entry and keep Node-only
  code out of the browser/edge entry.
- [ ] Run focused tests and typecheck for the affected package.

## Implementation Notes

- Existing Node server logic in `packages/sqlfu/src/ui/server.ts` already owns
  the HTTP-to-oRPC flow, but it is coupled to `node:http`, filesystem assets,
  and Node project resolution.
- `packages/sqlfu/src/ui/router.ts` is reusable if a caller provides
  `{project, host}` context to `RPCHandler`.
- The Durable Object adapter is sync; the UI router currently expects
  `SqlfuHost.openDb` to return a `DisposableAsyncClient`, so the implementation
  will need a small sync-to-async adapter rather than changing the existing
  router contract.
