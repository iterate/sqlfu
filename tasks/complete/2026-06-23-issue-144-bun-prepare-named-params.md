---
status: complete
size: small
github_issue: https://github.com/iterate/sqlfu/issues/144
---

# Bun prepare named params

## Status summary

Implementation complete, including review follow-up. The Bun adapter now normalizes bare named records before calling `bun:sqlite` prepared statements, including statements that reuse one bare name across `:`, `@`, and `$` SQLite prefixes; the focused real-Bun and shared-binder regressions, typecheck, changed-file lint, and changed-file format checks pass. The full `sqlfu` package test suite was attempted but still has unrelated worktree-environment failures in watch/UI/better-auth tests.

## Assumptions

- The public `PreparedStatementParams` shape is the source of truth: named parameter records use bare keys, not driver-prefixed keys.
- The fix belongs in the Bun adapter's prepared-statement path, because generated inline config queries call `client.prepare(sql).all/run(params)`.
- Existing prefixed keys should continue to work for callers already passing Bun-native `:id`, `@id`, or `$id` records.
- The implementation should reuse the scanner-backed SQL parameter binding helper instead of adding an ad hoc SQL text scan.

## Checklist

- [x] Add a failing real-Bun regression test for `createBunClient().prepare()` with `:name` placeholders and bare record params. _Added `createBunClient.prepare binds bare named params in a bun subprocess` in `packages/sqlfu/test/adapters/bun.test.ts`; it fails before the adapter fix._
- [x] Normalize Bun prepared-statement params to the driver-prefixed record shape before calling `bun:sqlite`. _`packages/sqlfu/src/adapters/bun.ts` now uses `bindSqlParamsToPrefixedRecord` in the prepared-statement path._
- [x] Keep positional array params and already-prefixed record params working. _The real-Bun regression asserts bare, prefixed, and positional prepared-statement reads._
- [x] Address review feedback for statements that reuse one bare name with multiple SQLite prefixes. _`bindSqlParamsToPrefixedRecord` now emits every distinct SQL prefix for a bare key; the Bun regression covers `:id`, `@id`, and `$id` from one `{id}` value._
- [x] Run the targeted Bun adapter test. _`pnpm --filter sqlfu exec vitest test/adapters/bun.test.ts` passes._
- [x] Run the relevant package checks before marking the task complete. _Typecheck, changed-file eslint, and changed-file oxfmt pass; the full package test run was attempted and failed outside this change._

## Implementation notes

- Issue 144 shows both write and read failures. The regression should cover the adapter behavior through `createBunClient()` and a real in-memory `bun:sqlite` database.
- Red run: `pnpm --filter sqlfu exec vitest test/adapters/bun.test.ts` fails with `SqlfuError: NOT NULL constraint failed: items.value`.
- Green run: `pnpm --filter sqlfu exec vitest test/adapters/bun.test.ts` passes with 5 tests.
- `pnpm --filter sqlfu typecheck` passes.
- `pnpm exec oxfmt --check packages/sqlfu/src/adapters/bun.ts packages/sqlfu/test/adapters/bun.test.ts` passes.
- `pnpm exec eslint packages/sqlfu/src/adapters/bun.ts packages/sqlfu/test/adapters/bun.test.ts` passes.
- `pnpm --filter sqlfu test` was attempted after a fresh worktree `pnpm install --offline` and failed in unrelated areas: `test/generate-watch.test.ts` timeouts, `test/resolve-sqlfu-ui.test.ts` missing `#serialized-assets`, one `test/better-auth-adapter.test.ts` timeout, and one `test/ui-server.test.ts` timeout.
- Review follow-up red run: extending the Bun regression to `select :id as colon_id, @id as at_id, $id as dollar_id` failed with `@id` and `$id` returning `null`.
- Review follow-up green run: `pnpm --filter sqlfu exec vitest test/sql-params.test.ts test/adapters/bun.test.ts` passes with 14 tests.
- Final review follow-up checks: `pnpm --filter sqlfu typecheck`, `pnpm exec oxfmt --check packages/sqlfu/src/sql-params.ts packages/sqlfu/test/sql-params.test.ts packages/sqlfu/test/adapters/bun.test.ts`, and `pnpm exec eslint packages/sqlfu/src/sql-params.ts packages/sqlfu/test/sql-params.test.ts packages/sqlfu/test/adapters/bun.test.ts` pass.
