---
status: ready
size: medium
base: pg-ui
---

# pg-ui Architecture Pass

Summary: Spec-only so far. This branch will run the installed `improve-codebase-architecture` skill against the updated `pg-ui` stack branch and record architecture deepening candidates for review rather than implementing a refactor immediately.

Assumptions:

- The user asked to run the skill on `pg-ui`, so this branch is based on `origin/pg-ui`, not `main`.
- Because this is bedtime work and the skill normally ends by asking which candidate to explore, the useful output is a reviewable candidate report and task status, not a code refactor.
- Use the upstream-installed skill at `~/.codex/skills/improve-codebase-architecture`.
- Prefer pg UI/server seams: places where sqlite assumptions, pg adapter behavior, or UI data loading make modules shallow or hard to test.

Checklist:

- [ ] Read project domain docs and ADRs if present.
- [ ] Explore pg-ui code paths using the skill vocabulary: Module, Interface, Depth, Seam, Adapter, Leverage, Locality.
- [ ] Record numbered deepening opportunities with files, problem, solution, and benefits.
- [ ] Mark the task as needing user selection/grilling rather than complete if no implementation is chosen.
- [ ] Open/update the PR with the architecture report.

## Implementation Notes

- Created during bedtime work on 2026-05-06.
