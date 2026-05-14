---
status: done
size: medium
---

# Deepen query parameter expansion locality

## Executive summary

Done. The architecture pass extracted the typegen query parameter expansion machinery into a dedicated internal module, added focused tests for the new module interface, pushed PR #113, and created replacement compare branches for the three open PRs that existed at the start of the run.

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

- [x] Commit this task file by itself before implementation. _Committed as `5d940b7`._
- [x] Extract named parameter scanning and parameter expansion inference from `packages/sqlfu/src/typegen/index.ts`. _Moved the module to `packages/sqlfu/src/typegen/query-parameters.ts`; `index.ts` now imports its interface._
- [x] Keep the generated query boundary interface unchanged for users. _The extraction only moved internal helpers; generated fixture outputs still pass._
- [x] Add focused tests for comment/string-safe named parameter scanning and expansion inference. _Added `packages/sqlfu/test/generate/query-parameters.test.ts`._
- [x] Run the relevant `sqlfu` tests and typecheck. _Ran focused generator tests, fixture tests, package typecheck, package build, and changed-file formatting._
- [x] Push the architecture branch and open/update the PR. _PR #113 is pushed with the implementation commits._
- [x] Create replacement compare branches for open PRs #111, #108, and #101 based on this architecture branch. _Pushed `improve-codebase-architecture-2026-05-14-pr-111`, `improve-codebase-architecture-2026-05-14-pr-108`, and `improve-codebase-architecture-2026-05-14-pr-101`._
- [x] Add a table to the architecture PR body mapping each old PR to the new compare branch. _Recorded in PR #113._

## Implementation log

- 2026-05-14: Created the task from `origin/main` in `../worktrees/sqlfu/improve-codebase-architecture-2026-05-14` after confirming the main checkout has unrelated website work.
- 2026-05-14: Opened draft PR #113 with the spec-only commit, then implemented the extraction in `packages/sqlfu/src/typegen/query-parameters.ts`.
- 2026-05-14: The explorer subagent suggested check/migrate analysis as the highest-impact candidate. This task kept the already-recorded parameter-expansion choice because it is a valid deepening change, was already committed as the chosen spec, and intentionally exercises the open-PR adjustment path for typegen-heavy PR #108.
- 2026-05-14: Replacement branches for #111 and #101 merged cleanly. #108 also merged cleanly; targeted generator/typecheck/fixture verification passed after the merge.
