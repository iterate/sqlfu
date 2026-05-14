---
status: in-progress
size: medium
---

# Deepen query parameter expansion locality

## Executive summary

Roughly 15% done. The architecture pass has selected the typegen query parameter expansion machinery as the highest-value focused improvement: it currently sits inside the broad generated query boundary module, alongside wrapper rendering, catalog writing, schema loading, and query document discovery. The missing pieces are the extraction, focused tests, verification, PR update, and alternate compare branches for the existing open PRs.

## Assumptions

- This run intentionally skips the normal bedtime implementation tasks and starts at the improve-codebase-architecture step.
- The normal skill pause after presenting candidate deepening opportunities is skipped because the user explicitly asked to test autonomous candidate selection.
- The branch should be based on `origin/main`; the main checkout has unrelated website changes that this task must not touch.
- Open PRs to account for after this branch lands: #111, #108, and #101.

## Candidate selection

The selected deepening opportunity is the query parameter expansion module inside `packages/sqlfu/src/typegen/index.ts`.

**Problem:** `typegen/index.ts` owns too many concepts at once: generated query boundary rendering, validator emission, schema authority materialization, query document discovery, query annotation parsing, named-parameter scanning, and runtime SQL expansion. Parameter expansion is a real module with non-trivial invariants, but its interface is currently implicit in a 3k-line file.

**Solution:** Extract query parameter expansion into a dedicated internal module with a small interface. The generated query boundary should ask that module for named parameter references, analysis SQL, runtime expansion metadata, and static/dynamic SQL rewrites without knowing how comments, strings, object parameters, and row-list inference are scanned.

**Benefits:** This creates locality for SQL parameter parsing bugs and gives tests a direct interface instead of exercising everything through full fixture generation. It should also make future generated query boundary work easier because wrapper renderers can depend on a smaller expansion interface.

## Checklist

- [ ] Commit this task file by itself before implementation.
- [ ] Extract named parameter scanning and parameter expansion inference from `packages/sqlfu/src/typegen/index.ts`.
- [ ] Keep the generated query boundary interface unchanged for users.
- [ ] Add focused tests for comment/string-safe named parameter scanning and expansion inference.
- [ ] Run the relevant `sqlfu` tests and typecheck.
- [ ] Push the architecture branch and open/update the PR.
- [ ] Create replacement compare branches for open PRs #111, #108, and #101 based on this architecture branch.
- [ ] Add a table to the architecture PR body mapping each old PR to the new compare branch.

## Implementation log

- 2026-05-14: Created the task from `origin/main` in `../worktrees/sqlfu/improve-codebase-architecture-2026-05-14` after confirming the main checkout has unrelated website work.
