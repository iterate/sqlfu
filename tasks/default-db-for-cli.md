---
status: ready
size: medium
base: main
---

# Default DB For CLI Commands

Summary: Spec-only so far. This branch will make `db` optional for CLI workflows such as `sqlfu check`, `sqlfu sync`, and `sqlfu migrate` by resolving an implicit local SQLite database when the user config omits `db`.

Assumptions:

- The default database path should be `.sqlfu/app.db` under the project root.
- The default only applies when a CLI/runtime path needs to open a database. It should not force `db` into the user-facing config or require adapters for generated Durable Object runtime code.
- Existing explicit `db` strings and factories must keep current behavior.
- Tests should cover at least one command path that currently needs `db`, preferably with a real temp project and no mocks.

Checklist:

- [ ] Add a failing spec for an omitted `db` in a CLI workflow.
- [ ] Resolve omitted `db` to a project-local default database when opening the database.
- [ ] Ensure `.sqlfu/` is created as needed before opening the default database file.
- [ ] Preserve existing explicit `db` string/factory behavior.
- [ ] Run focused sqlfu tests/typecheck.

## Implementation Notes

- Created during bedtime work on 2026-05-06.
