---
status: done
size: small
branch: better-auth-format-append
pr: https://github.com/mmkal/sqlfu/pull/97
---

# Fix UI resize CI failure

## Status summary

Done. The failing Playwright resize spec now uses the same visible-header-edge
drag pattern as the existing demo resize tests. The focused failing test and the
full UI Playwright suite pass locally.

## Checklist

- [x] Pull the failing CI log and identify the failing spec. _The failed check was the `ui` job, specifically `test/studio.spec.ts:422`._
- [x] Reproduce the failure locally. _`pnpm --filter @sqlfu/ui test -- test/studio.spec.ts:422` reproduced the unchanged `116px` column width._
- [x] Fix the resize interaction. _The studio spec now drags from the visible header edge instead of the center of the internal resize-handle element._
- [x] Verify the fix. _Passed the focused spec, `pnpm exec oxfmt --check packages/ui/test/studio.spec.ts`, and `pnpm --filter @sqlfu/ui test`._

## Implementation Notes

- Root cause: the test targeted the center of `.rg-touch-column-resize-handle`,
  which is no longer a reliable resize-start coordinate. The app's demo resize
  specs already use the visible header edge, which matches the user-facing
  interaction and remains stable.
