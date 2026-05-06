---
status: ready
size: medium
branch: ui-desired-schema-polish
---

# UI desired schema polish

## Status summary

Spec drafted. Implementation still pending: Desired Schema action stability,
dirty-state gating for recommended actions, compact radius styling, formatted
demo definitions, and a Desired Schema format action.

## Checklist

- [ ] Keep Desired Schema save/reset icon buttons mounted. _They should be
  visible but disabled/greyed out when there are no unsaved changes, avoiding
  layout shift when the editor becomes dirty._
- [ ] Disable Schema-page recommended actions while Desired Schema is dirty.
  _Actions should not invite schema operations against stale unsaved text._
- [ ] Tighten UI container and button border radii. _Move from the current
  blocky rounded corners to a more compact, sleeker visual treatment without
  changing layout density._
- [ ] Format the demo project's Desired Schema. _The dev/demo definitions file
  should ship in sqlfu's normal formatted style._
- [ ] Add a Desired Schema format button. _Place it with reset/save, use a
  compact icon label, and disable it when the editor contents already match
  the formatter output._
- [ ] Verify with focused UI tests and the package build. _Prefer Playwright
  coverage for the observable panel/action behavior._

## Implementation Notes

- 2026-05-06: Assumption: "recommended actions" refers to the action buttons
  shown on the Schema page from current schema status/diff analysis.
- 2026-05-06: Assumption: the format button should format the editor buffer
  locally first; saving remains an explicit separate action.
