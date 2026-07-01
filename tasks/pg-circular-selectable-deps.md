---
status: in-progress
size: small
---

# Fix circular PostgreSQL selectable dependency traversal

Status summary: Red regression test is added and confirmed to fail with `RangeError: Maximum call stack size exceeded` in `PostgreSQL.load_deps_all()`. The fix is still missing.

## Checklist

- [x] Add a regression test showing `PostgreSQL.load_deps_all()` handles circular selectable dependencies without a stack overflow. _Added `packages/pg/test/circular-selectable-deps.test.ts`; it constructs mutually-dependent views and currently fails with the recursion bug._
- [ ] Commit and push the repro test before the fix so CI can show the red behavior.
- [ ] Add a visited-set guard to dependency traversal.
- [ ] Ensure circular traversal filters the root signature anywhere it reappears.
- [ ] Run the relevant `@sqlfu/pg` tests.
- [ ] Move this task to `tasks/complete/` once the branch is done.

## Implementation Notes

- Prompted by `mmkal/pgkit#469`, which fixes an infinite recursion in pgkit's `get_related_for_item`.
- This repo vendors the same PostgreSQL schemainspect traversal in `packages/pg/src/vendor/schemainspect/pg/obj.ts`.
- Assumption: the SQLite schemadiff planner is out of scope because its view dependency traversal is already iterative or graph-sequenced.
- Red test run: `pnpm --filter @sqlfu/pg test -- circular-selectable-deps.test.ts` failed with the intended `RangeError`; it also loaded DB-backed pg suites that fail without local Postgres.
