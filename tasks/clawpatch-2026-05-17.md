---
status: in-progress
size: small
---

# Clawpatch Pass 2026-05-17

## Status summary

Done for this bounded pass. Clawpatch reviewed three feature records and found
one true test-gap duplicated across two findings: root `pnpm test` skipped the
`@sqlfu/pg` suite even though root build/typecheck include the package. The root
test script now includes `pnpm --filter @sqlfu/pg test`, pg tests skip cleanly
when the local Postgres fixture is absent, and Clawpatch revalidated both
findings as fixed. Full root `pnpm test` still hits pre-existing `sqlfu` package
failures before reaching the pg segment.

## Scope

- Install and run `clawpatch` following the current docs.
- Keep Clawpatch state and reports isolated in this worktree.
- Review a bounded batch rather than trying to exhaustively scan the whole repo.
- Prefer fixing one concrete, high-confidence issue if Clawpatch finds one.
- Do not run the normal `improve-codebase-architecture` pass tonight.

## Checklist

- [x] Read the Clawpatch docs and confirm local prerequisites. _Clawpatch docs require Node.js 22+, Git 2.x, and local Codex CLI; this machine has Node v26, Git, and `codex-cli 0.130.0`._
- [x] Create this branch and commit the task note first. _branch `bedtime/2026-05-17-clawpatch`, worktree `/Users/mmkal/src/worktrees/sqlfu/bedtime-2026-05-17-clawpatch`, first commit `10cda5b`, PR #131._
- [x] Run `clawpatch doctor`, `clawpatch init`, `clawpatch map`, a bounded `clawpatch review`, and `clawpatch report`. _`clawpatch review --limit 3` produced run `20260516T231103-8805e6`; the sanitized report is committed at `tasks/clawpatch-2026-05-17-report.md`._
- [x] Review findings for true positives. _both findings described the same root test coverage gap for `@sqlfu/pg`; confirmed `pnpm --filter @sqlfu/pg test -- --run` passes locally after installing workspace dependencies._
- [x] Fix a small high-confidence finding if one is clearly worth taking tonight, or record why no fix was made. _root `package.json` now runs `pnpm --filter @sqlfu/pg test` between `sqlfu` and `@sqlfu/ui`, and pg service-backed tests use explicit Vitest skips when Postgres is not reachable._
- [x] Run relevant validation and update this task with breadcrumbs. _`pnpm --filter @sqlfu/pg test -- --run` passed with Postgres reachable and skipped cleanly with Postgres stopped; `pnpm --dir packages/sqlfu exec vitest run test/workspace-scripts.test.ts` passed. Full `pnpm test` still failed before reaching pg because existing `sqlfu` tests fail in `resolve-sqlfu-ui` and `strict-tier entries import no node:*`._
- [x] Update the PR body with the report location, findings summary, and checks. _PR #131 body updated after pushing the fix._

## Implementation notes

- 2026-05-17: Clawpatch docs at <https://clawpatch.ai/> say the tool needs
  Node.js 22+, Git 2.x, and a local Codex CLI, and recommend `npm install -g
  clawpatch` followed by `init`, `map`, `review`, and `report`.
- 2026-05-17: Clawpatch version installed globally via npm is `0.1.0`.
- 2026-05-17: `clawpatch map` detected six feature records. This pass reviewed
  three (`package.json` config, root lint script, root build script) to keep the
  bedtime replacement bounded.
- 2026-05-17: `clawpatch revalidate` marked both duplicate findings fixed after
  the root `test` script started invoking `@sqlfu/pg`.
- 2026-05-17: The raw `.clawpatch/` directory was deliberately not kept in the
  branch because it includes absolute local paths and mutable run metadata. The
  reviewable report summary is in `tasks/clawpatch-2026-05-17-report.md`.
- 2026-05-17: The full root test command still fails in the first package:
  `test/resolve-sqlfu-ui.test.ts` cannot find `#serialized-assets`, and
  `test/import-surface.test.ts` rejects a `node:sqlite` import path through
  `sqlfu/analyze`. Those failures pre-date this script fix and prevent the
  updated root command from reaching `@sqlfu/pg` in this worktree.
