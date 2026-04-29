---
status: done
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

## Status (2026-04-29)

Done. The branch exports the generic `createSqlfuUiPartialFetch` from
`sqlfu/ui/browser`; adapter-specific Durable Object and D1 setup now lives in
the Miniflare fixtures. The proofs cover serving UI assets, falling through for
unrelated requests, and browsing/editing live SQLite-backed Worker databases
through the UI oRPC contract.

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

- [x] Add an exported partial UI fetch helper that serves `/api/rpc`, `OPTIONS`
  preflight, `/`, static assets, and returns `undefined` for unrelated paths.
  _Implemented as `createSqlfuUiPartialFetch` in `packages/sqlfu/src/ui/partial-fetch.ts`._
- [x] Add durable-object-oriented host glue that opens the object's
  `ctx.storage.sql` through `createDurableObjectClient` and adapts it to the
  async host shape expected by `uiRouter`. _Implemented in the Miniflare fixture
  by building a `CreateSqlfuUiPartialFetchInput` with an explicit
  `projectName`, in-memory files, static catalog, and `openClient` callback._
- [x] Prove the use case in Miniflare: a Durable Object serves an index asset,
  a JS asset, and the UI oRPC contract from the same `fetch` method. _Covered
  by `durable object can serve sqlfu ui partial fetch against its sqlite storage`
  in `packages/sqlfu/test/adapters/durable-object.test.ts`._
- [x] Prove the same partial fetch shape can run in a plain Worker backed by
  D1. _Covered by `createSqlfuUiPartialFetch serves assets and RPC from a plain
  D1 worker` in `packages/sqlfu/test/adapters/d1.test.ts`._
- [x] Prove the Durable Object DB can be browsed through the UI contract by
  asserting `schema.get`, `table.list`, and `sql.run` work against object
  storage. _The same Miniflare spec asserts relation discovery, table rows,
  ad-hoc insert metadata, and ad-hoc select rows._
- [x] Export the new surface from the appropriate UI entry and keep Node-only
  code out of the browser/edge entry. _Exported from
  `packages/sqlfu/src/ui/browser.ts`; the helper itself is fetch/Worker API
  based._
- [x] Run focused tests and typecheck for the affected package. _Verified with
  `pnpm --filter sqlfu typecheck`, `pnpm --filter sqlfu exec vitest run
  test/adapters/durable-object.test.ts`, `pnpm --filter sqlfu exec vitest run
  test/import-surface.test.ts`, and targeted `oxfmt --check`._

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
- The final implementation deliberately preserves the sync client at runtime
  and casts only at the host boundary. That keeps dual-dispatch migration/schema
  helpers on their sync path while allowing router handlers that simply `await`
  `.all()` / `.run()` to work.
- Adapter-specific convenience wrappers were removed from the production API.
  The generic helper accepts `assets`, `host`, and `project`; callers can build
  the `host.openDb` callback from `createDurableObjectClient`, `createD1Client`,
  or any other sqlfu async client factory.
