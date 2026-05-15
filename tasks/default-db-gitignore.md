---
status: in-progress
size: small
---

## 2026-05-15 Status Summary

Started. The follow-up assumption is that `sqlfu init` should create or update `.gitignore` with `.sqlfu/` because omitted `db` now writes the local development database to `.sqlfu/app.db`. Implementation and focused tests are still pending.

## Task

PR #122 moved new projects toward omitting `db` from `sqlfu.config.ts`, letting commands that need a local database use `.sqlfu/app.db`. The narrow follow-up is deciding whether `sqlfu init` should also protect users from accidentally committing that local database and scratch artifacts.

## Assumptions

- `sqlfu init` should ensure `.sqlfu/` is ignored in newly initialized projects.
- If a project already has `.gitignore`, `init` should append `.sqlfu/` rather than replacing user content.
- If `.gitignore` already contains `.sqlfu/`, `init` should leave it alone.
- This task should stay scoped to init scaffold behavior, focused tests, and the docs sentence that describes what init creates.

## Checklist

- [ ] Add focused init test coverage for fresh `.gitignore` creation.
- [ ] Add focused init test coverage for updating an existing `.gitignore` without clobbering user entries.
- [ ] Implement `.gitignore` creation/update in the init scaffold.
- [ ] Update the narrow docs mention of `sqlfu init` output.
- [ ] Run focused tests and typecheck.

## Implementation Notes

- 2026-05-15: Created as a stacked follow-up branch from `origin/bedtime/2026-05-15-db-base-directory`.
