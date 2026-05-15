---
status: in-progress
size: medium
---

# Nightly Architecture Improvement 2026-05-15

## Status Summary

Started. This branch is the required final bedtime architecture pass. No product code has changed yet; the first commit records the scope so the PR is reviewable before implementation.

## Goal

Find and land one high-impact architecture improvement after the 2026-05-15 bedtime task PRs are open, checked, and reviewed. Optimize for locality and leverage: the change should make a real concept easier to understand, test, or extend without broad product churn.

## Assumptions

- Base branch is `main`; there is no shared nightly base branch for this bedtime run.
- Existing task PRs stay as they are. After the architecture PR lands on its branch, replacement compare branches will be created for the open PR queue instead of rebasing or rewriting those branches.
- The project context in `CONTEXT.md` and ADR `docs/adr/0001-generated-query-casing-boundary.md` are authoritative for generated query boundary and query identity language.
- If candidate selection would normally need the user, make the best bedtime choice and record the guess here and in the PR body.

## Checklist

- [x] Create an isolated worktree and branch from `origin/main`. _worktree is `/Users/mmkal/src/worktrees/sqlfu/bedtime-2026-05-15-architecture` on branch `bedtime/2026-05-15-architecture`._
- [ ] Commit this task note and open the early architecture PR.
- [ ] Run the `improve-codebase-architecture` exploration using the project context and ADR.
- [ ] Choose one candidate, recording the autonomous bedtime assumption.
- [ ] Implement the chosen architecture improvement with focused tests.
- [ ] Update this task file and PR body with the net effect, checks, and replacement compare branches for open PRs.

## Implementation Notes

- 2026-05-16: Main checkout was clean. Bedtime PRs #119, #120, #121, #122, #123, and #124 had passing workflow checks before starting this pass.
