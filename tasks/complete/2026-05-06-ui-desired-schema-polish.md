---
status: done
size: medium
branch: ui-desired-schema-polish
pr: https://github.com/mmkal/sqlfu/pull/98
---

# UI desired schema polish

## Status summary

Done. Desired Schema actions are stable and disabled when inactive, schema
recommendation commands are blocked while Desired Schema is dirty, the panel has
a local format action, the demo definitions are formatted, and the main UI
radius treatment is tighter. Focused and full UI verification passed.

## Checklist

- [x] Keep Desired Schema save/reset icon buttons mounted. _The toolbar now
  always renders format/reset/save; reset/save are disabled unless the editor is
  dirty._
- [x] Disable Schema-page recommended actions while Desired Schema is dirty.
  _Recommendation command buttons receive `disabled` while the draft differs
  from the saved desired schema._
- [x] Tighten UI container and button border radii. _Reduced the large card,
  dialog, toast, tab, and button radii in `packages/ui/src/styles.css`._
- [x] Format the demo project's Desired Schema. _Ran sqlfu format over
  `packages/ui/src/demo/northwind/definitions.sql`._
- [x] Add a Desired Schema format button. _Added the `💅` icon button beside
  reset/save; it formats through the browser-safe sqlfu formatter and disables
  when the current editor text is already formatted._
- [x] Verify with focused UI tests and the package build. _Added Playwright
  assertions for stable disabled actions, dirty-state command gating, and the
  formatter button; full UI suite passed._

## Implementation Notes

- 2026-05-06: Exposed `formatSqlFileContents` from `sqlfu/analyze` so the UI can
  format SQL in browser/demo mode without importing the Node-oriented
  `sqlfu/api` entrypoint.
- 2026-05-06: Verification run:
  `pnpm --filter @sqlfu/ui test --grep "desired schema can be edited"`,
  `pnpm exec oxfmt --check packages/sqlfu/src/analyze.ts packages/ui/src/client.tsx packages/ui/src/styles.css packages/ui/test/studio.spec.ts`,
  `pnpm --filter sqlfu typecheck`, `pnpm --filter @sqlfu/ui typecheck`,
  `pnpm --filter sqlfu test --run test/import-surface.test.ts`,
  `pnpm --filter @sqlfu/ui build`, and `pnpm --filter @sqlfu/ui test`.
