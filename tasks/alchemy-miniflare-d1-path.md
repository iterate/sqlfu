---
status: in-progress
size: medium
---

# Alchemy Miniflare D1 path helper

## Status Summary

Spec drafted; implementation has not started yet. Main work is to expose a public helper that turns an Alchemy app slug into the matching local Miniflare D1 sqlite path, with automatic discovery of Alchemy's `.alchemy/miniflare/v3` directory.

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
- If `miniflareV3Root` is omitted, walk up from `cwd` or `process.cwd()` looking for `.alchemy/miniflare/v3`.
- If no root is found, throw an actionable error rather than returning a guessed path.
- Use the Miniflare D1 database object path algorithm from the user-provided snippet:
  - unique key: `miniflare-D1DatabaseObject`
  - SHA-256 digest of unique key as HMAC key
  - HMAC slug, truncated to 16 bytes
  - HMAC that first digest, truncated to 16 bytes
  - hex-encode both buffers and join under `d1/miniflare-D1DatabaseObject/{id}.sqlite`

## Checklist

- [ ] Add a failing public-interface test for explicit `miniflareV3Root`.
- [ ] Implement the D1 object path hashing helper.
- [ ] Add a failing public-interface test for Alchemy root discovery from a nested cwd.
- [ ] Implement the find-up walker for `.alchemy/miniflare/v3`.
- [ ] Add coverage for the missing-root error path.
- [ ] Export the helper from `sqlfu/api`.
- [ ] Document the Alchemy usage pattern.
- [ ] Move this task to `tasks/complete/` once the PR is ready for review.

## Implementation Notes

- Worktree: `../worktrees/sqlfu/alchemy-miniflare-d1-path`
- Branch: `feat/alchemy-miniflare-d1-path`
