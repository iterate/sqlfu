---
status: in-progress
size: small
github_issue: https://github.com/iterate/sqlfu/issues/144
---

# Bun prepare named params

## Status summary

Roughly 25% complete. The real-Bun regression test now reproduces issue 144 with the expected `NOT NULL constraint failed` failure; the adapter fix and green verification are still missing.

## Assumptions

- The public `PreparedStatementParams` shape is the source of truth: named parameter records use bare keys, not driver-prefixed keys.
- The fix belongs in the Bun adapter's prepared-statement path, because generated inline config queries call `client.prepare(sql).all/run(params)`.
- Existing prefixed keys should continue to work for callers already passing Bun-native `:id`, `@id`, or `$id` records.
- The implementation should reuse the scanner-backed SQL parameter binding helper instead of adding an ad hoc SQL text scan.

## Checklist

- [x] Add a failing real-Bun regression test for `createBunClient().prepare()` with `:name` placeholders and bare record params. _Added `createBunClient.prepare binds bare named params in a bun subprocess` in `packages/sqlfu/test/adapters/bun.test.ts`; it fails before the adapter fix._
- [ ] Normalize Bun prepared-statement params to the driver-prefixed record shape before calling `bun:sqlite`.
- [ ] Keep positional array params and already-prefixed record params working.
- [ ] Run the targeted Bun adapter test.
- [ ] Run the relevant package checks before marking the task complete.

## Implementation notes

- Issue 144 shows both write and read failures. The regression should cover the adapter behavior through `createBunClient()` and a real in-memory `bun:sqlite` database.
- Red run: `pnpm --filter sqlfu exec vitest test/adapters/bun.test.ts` fails with `SqlfuError: NOT NULL constraint failed: items.value`.
