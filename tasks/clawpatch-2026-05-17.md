---
status: in-progress
size: small
---

# Clawpatch Pass 2026-05-17

## Status summary

Just started. This replaces the normal bedtime architecture-improvement pass for
2026-05-17. The branch will install/use Clawpatch, persist its review report,
and either fix a bounded finding or record why findings were left for later.

## Scope

- Install and run `clawpatch` following the current docs.
- Keep Clawpatch state and reports isolated in this worktree.
- Review a bounded batch rather than trying to exhaustively scan the whole repo.
- Prefer fixing one concrete, high-confidence issue if Clawpatch finds one.
- Do not run the normal `improve-codebase-architecture` pass tonight.

## Checklist

- [ ] Read the Clawpatch docs and confirm local prerequisites.
- [ ] Create this branch and commit the task note first.
- [ ] Run `clawpatch doctor`, `clawpatch init`, `clawpatch map`, a bounded `clawpatch review`, and `clawpatch report`.
- [ ] Review findings for true positives.
- [ ] Fix a small high-confidence finding if one is clearly worth taking tonight, or record why no fix was made.
- [ ] Run relevant validation and update this task with breadcrumbs.
- [ ] Update the PR body with the report location, findings summary, and checks.

## Implementation notes

- 2026-05-17: Clawpatch docs at <https://clawpatch.ai/> say the tool needs
  Node.js 22+, Git 2.x, and a local Codex CLI, and recommend `npm install -g
  clawpatch` followed by `init`, `map`, `review`, and `report`.
