---
status: complete
size: medium
base: main
---

# Default DB For CLI Commands

Summary: Complete. Omitted `db` now resolves to `.sqlfu/app.db` for Node-hosted CLI database commands, `.sqlfu/` is created through the existing local SQLite opener, and explicit string/factory `db` behavior is covered by adjacent tests.

Assumptions:

- The default database path should be `.sqlfu/app.db` under the project root.
- The default only applies when a CLI/runtime path needs to open a database. It should not force `db` into the user-facing config or require adapters for generated Durable Object runtime code.
- Existing explicit `db` strings and factories must keep current behavior.
- Tests should cover at least one command path that currently needs `db`, preferably with a real temp project and no mocks.

Checklist:

- [x] Add a failing spec for an omitted `db` in a CLI workflow. _Added `cli-config.test.ts` coverage for migrate/check/sync in a temp project without `db`; it currently exits 1 before implementation._
- [x] Resolve omitted `db` to a project-local default database when opening the database. _`createNodeHost().openDb(config)` now falls back to `${projectRoot}/.sqlfu/app.db` only when `config.db` is omitted._
- [x] Ensure `.sqlfu/` is created as needed before opening the default database file. _The default path goes through `openLocalSqliteFile`, which creates the parent directory before opening SQLite._
- [x] Preserve existing explicit `db` string/factory behavior. _The string and factory branches remain first in `openConfigDb`; adjacent factory/live-schema specs pass._
- [x] Run focused sqlfu tests/typecheck. _Ran focused Vitest coverage for CLI/default DB plus factory/live-schema behavior, and `pnpm --filter sqlfu typecheck`._

## Implementation Notes

- Created during bedtime work on 2026-05-06.
- 2026-05-06: Started TDD pass in the `optional-default-db` worktree. The first slice will exercise a real temp project whose `sqlfu.config.ts` omits `db`.
- 2026-05-06: Confirmed the red test with `pnpm --filter sqlfu test -- cli-config.test.ts`; the new default-db CLI workflow exits with code 1 before implementation. That command also ran the broader package suite and hit unrelated `resolve-sqlfu-ui` fixture failures, so later focused runs should use a narrower Vitest invocation.
- 2026-05-06: Implemented the Node host fallback and reran focused coverage with `pnpm --filter sqlfu exec vitest run test/cli-config.test.ts test/config-db-factory.test.ts test/generate-authority.test.ts` (14 tests passing).
- 2026-05-06: Verified final state with `pnpm --filter sqlfu typecheck` and the same focused Vitest command after the source comment update.
