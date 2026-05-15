---
status: complete
size: small
---

## 2026-05-15 Status Summary

Done. `sqlfu init` now creates or updates `.gitignore` with `.sqlfu/`, preserving existing entries and avoiding duplicates. Focused init tests and `sqlfu` typecheck passed.

## Task

PR #122 moved new projects toward omitting `db` from `sqlfu.config.ts`, letting commands that need a local database use `.sqlfu/app.db`. The narrow follow-up is deciding whether `sqlfu init` should also protect users from accidentally committing that local database and scratch artifacts.

## Assumptions

- `sqlfu init` should ensure `.sqlfu/` is ignored in newly initialized projects.
- If a project already has `.gitignore`, `init` should append `.sqlfu/` rather than replacing user content.
- If `.gitignore` already contains `.sqlfu/`, `init` should leave it alone.
- This task should stay scoped to init scaffold behavior, focused tests, and the docs sentence that describes what init creates.

## Checklist

- [x] Add focused init test coverage for fresh `.gitignore` creation. _`packages/sqlfu/test/init.test.ts` now asserts the default scaffold includes `.gitignore` and `.sqlfu/`._
- [x] Add focused init test coverage for updating an existing `.gitignore` without clobbering user entries. _Added tests for appending after `node_modules/`, preserving CRLF line endings, handling an empty existing file, and leaving an existing `.sqlfu/` entry unchanged._
- [x] Implement `.gitignore` creation/update in the init scaffold. _`initializeProject` now calls `ensureGitignoreEntry` for `.sqlfu/` after writing the default config and definitions._
- [x] Update the narrow docs mention of `sqlfu init` output. _Updated the README configuration note plus Getting Started and CLI docs._
- [x] Run focused tests and typecheck. _Passed `pnpm --filter sqlfu exec vitest run test/init.test.ts` and `pnpm --filter sqlfu typecheck`._

## Implementation Notes

- 2026-05-15: Created as a stacked follow-up branch from `origin/bedtime/2026-05-15-db-base-directory`.
- 2026-05-15: Red test confirmed current behavior did not create `.gitignore` and did not append `.sqlfu/` to an existing file.
- 2026-05-15: `pnpm install --frozen-lockfile` was needed in the new worktree before focused tests could run.
- 2026-05-16: Review found two formatting edges in the append helper: CRLF files got mixed line endings, and empty existing files got a leading blank line. Covered both with tests and fixed the writer to preserve CRLF when present.
