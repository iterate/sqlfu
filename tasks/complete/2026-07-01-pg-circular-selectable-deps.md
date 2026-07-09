---
status: done
size: small
---

# Fix circular PostgreSQL selectable dependency traversal

Status summary: Done. The red repro test was pushed in its own commit, and the follow-up fix makes circular selectable dependency traversal terminate while keeping root signatures out of transitive dependency lists.

## Checklist

- [x] Add a regression test showing `PostgreSQL.load_deps_all()` handles circular selectable dependencies without a stack overflow. _Added `packages/pg/test/circular-selectable-deps.test.ts`; it constructs mutually-dependent views and currently fails with the recursion bug._
- [x] Commit and push the repro test before the fix so CI can show the red behavior. _Pushed red commit `9d21f30` before editing production code._
- [x] Add a visited-set guard to dependency traversal. _`load_deps_all()` now passes a `Set<string>` through recursive dependency expansion._
- [x] Ensure circular traversal filters the root signature anywhere it reappears. _The final `dependent_on_all` and `dependents_all` assignments filter `x.signature` after the initial root slice._
- [x] Run the relevant `@sqlfu/pg` tests. _Focused regression passes with `pnpm --dir packages/pg exec vitest run test/circular-selectable-deps.test.ts`; package typecheck passes._
- [x] Move this task to `tasks/complete/` once the branch is done. _Moved to `tasks/complete/2026-07-01-pg-circular-selectable-deps.md`._

## Implementation Notes

- Prompted by `mmkal/pgkit#469`, which fixes an infinite recursion in pgkit's `get_related_for_item`.
- This repo vendors the same PostgreSQL schemainspect traversal in `packages/pg/src/vendor/schemainspect/pg/obj.ts`.
- Assumption: the SQLite schemadiff planner is out of scope because its view dependency traversal is already iterative or graph-sequenced.
- Red test run: `pnpm --filter @sqlfu/pg test -- circular-selectable-deps.test.ts` failed with the intended `RangeError`; it also loaded DB-backed pg suites that fail without local Postgres.
- Green test run: `pnpm --dir packages/pg exec vitest run test/circular-selectable-deps.test.ts` passed.
- Typecheck run: `pnpm --filter @sqlfu/pg typecheck` passed.
