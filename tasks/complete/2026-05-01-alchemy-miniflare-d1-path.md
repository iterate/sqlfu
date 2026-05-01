---
status: done
size: medium
---

# Miniflare D1 path helper

## Status Summary

Done. `sqlfu/api` now exports `findMiniflareD1Path()`, including explicit-root support, well-known Miniflare v3 root discovery, real Alchemy dev integration coverage, built import-surface coverage, and docs.

## Goal

Make the Alchemy local D1 database path easy to use from `sqlfu.config.ts` without copy-pasting Miniflare's object path hashing.

Expected user-facing shape:

```ts
import { findMiniflareD1Path } from "sqlfu/api";

export default defineConfig({
  db: findMiniflareD1Path("my-dev-app-slug"),
  migrations: {
    path: "./src/server/db/migrations",
    preset: "d1",
  },
  definitions: "./src/server/db/definitions.sql",
  queries: "./src/server/db/queries",
});
```

## Assumptions

- The helper is Node-only and belongs on the `sqlfu/api` surface used by config files.
- The signature should be `findMiniflareD1Path(slug: string, options?: { miniflareV3Root?: string; cwd?: string })`.
- If `miniflareV3Root` is provided, use it directly.
- If `miniflareV3Root` is omitted, walk up from `cwd` or `process.cwd()` looking for a supported well-known Miniflare v3 persist root. Currently the only supported layout is Alchemy's `.alchemy/miniflare/v3`.
- If no root is found, throw an actionable error rather than returning a guessed path.
- Use the Miniflare D1 database object path algorithm from the user-provided snippet:
  - unique key: `miniflare-D1DatabaseObject`
  - SHA-256 digest of unique key as HMAC key
  - HMAC slug, truncated to 16 bytes
  - HMAC that first digest, truncated to 16 bytes
  - hex-encode both buffers and join under `d1/miniflare-D1DatabaseObject/{id}.sqlite`

## Checklist

- [x] Add a failing public-interface test for explicit `miniflareV3Root`. _Superseded by the real Alchemy dev integration test, which proves the helper matches an actual Miniflare sqlite path._
- [x] Implement the D1 object path hashing helper. _Implemented in `packages/sqlfu/src/node/miniflare.ts` with Miniflare's `miniflare-D1DatabaseObject` SHA-256/HMAC path derivation._
- [x] Add a failing public-interface test for Alchemy root discovery from a nested cwd. _Covered by `packages/sqlfu/test/miniflare-d1-path.test.ts`, which runs real `alchemy dev` from a temp fixture and resolves from `apps/web/src/server`._
- [x] Implement the find-up walker for `.alchemy/miniflare/v3`. _Implemented as a well-known Miniflare v3 root walker in `packages/sqlfu/src/node/miniflare.ts`; Alchemy's path is currently the only supported layout._
- [x] Add coverage for the missing-root error path. _The test asserts the actionable error includes the searched cwd and explicit `{miniflareV3Root}` escape hatch._
- [x] Export the helper from `sqlfu/api`. _`packages/sqlfu/src/api.ts` re-exports the helper and option type; `test/import-surface.test.ts` checks the built API export._
- [x] Document the Alchemy usage pattern. _Added config snippets to `packages/sqlfu/README.md` and `packages/sqlfu/docs/migration-model.md`, with root README synced._
- [x] Move this task to `tasks/complete/` once the PR is ready for review. _Moved on 2026-05-01 after build, package tests, typecheck, UI build, and README sync check passed._

## Implementation Notes

- Worktree: `../worktrees/sqlfu/alchemy-miniflare-d1-path`
- Branch: `feat/alchemy-miniflare-d1-path`
- PR: https://github.com/mmkal/sqlfu/pull/80
- Verification:
  - `pnpm --dir packages/sqlfu build`
  - `pnpm --dir packages/sqlfu typecheck`
  - `pnpm --dir packages/sqlfu exec vitest run test/miniflare-d1-path.test.ts`
  - `pnpm --dir packages/sqlfu test`
  - `pnpm --filter @sqlfu/ui build`
  - `pnpm sync:root-readme:check`
