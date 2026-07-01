---
status: in-progress
size: small
---

# Fix circular PostgreSQL selectable dependency traversal

Status summary: Worktree branch is being prepared. The first implementation step is a repro test that should fail before the fix; the fix should then make `PostgreSQL.load_deps_all()` terminate and keep each root selectable out of its own transitive dependency lists.

## Checklist

- [ ] Add a regression test showing `PostgreSQL.load_deps_all()` handles circular selectable dependencies without a stack overflow.
- [ ] Commit and push the repro test before the fix so CI can show the red behavior.
- [ ] Add a visited-set guard to dependency traversal.
- [ ] Ensure circular traversal filters the root signature anywhere it reappears.
- [ ] Run the relevant `@sqlfu/pg` tests.
- [ ] Move this task to `tasks/complete/` once the branch is done.

## Implementation Notes

- Prompted by `mmkal/pgkit#469`, which fixes an infinite recursion in pgkit's `get_related_for_item`.
- This repo vendors the same PostgreSQL schemainspect traversal in `packages/pg/src/vendor/schemainspect/pg/obj.ts`.
- Assumption: the SQLite schemadiff planner is out of scope because its view dependency traversal is already iterative or graph-sequenced.
