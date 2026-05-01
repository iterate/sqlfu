---
status: complete
size: medium
---

# Relations view: sort / filter / column select / pagination as SQL contributions

## Status Summary (2026-04-30)

Complete on this branch. Core behavior was already shipped; this pass adds local SVG icons for the relation query controls, guards dirty row edits before query actions switch the grid into SQL/read-only mode, and covers the guard with Playwright. URL pagination remains a documented deferred non-goal.

## Polish Assumptions (2026-04-30)

- Existing local SVG components are preferred over adding an icon dependency; `packages/ui` has no icon library today.
- The guard for dirty row edits should protect every toolbar action that can leave the default editable table view: sort/filter/columns, query SQL apply, pagination limit/next/previous, and reset where relevant.
- The guard can use the existing row-editing callbacks instead of introducing a second dirty-row store.
- URL pagination (`#table/posts/2`) is a documented non-goal for this pass unless the implementation naturally exposes a tiny, low-risk recovery path.

## Narrowed Checklist (2026-04-30)

- [x] Replace unicode/text glyph controls in the relation query toolbar/popovers with accessible local SVG icon components. _Local SVG components now live in `RelationQueryPanel`; `styles.css` gives them stable toolbar sizing._
- [x] Add a dirty-row transition guard before query actions switch from default editable table mode to SQL/read-only mode. _`confirmBeforeReadOnlyMode` gates relation-query mutations; `TablePanel` supplies the confirmation dialog._
- [x] Cover the guard with a focused Playwright spec that proves dirty edits are not silently lost. _`relation query actions confirm before leaving dirty editable rows` cancels and confirms the transition._
- [x] Run targeted unit/Playwright verification and update this task with the implemented breadcrumbs. _Ran UI typecheck, relation-query-builder vitest, relation Playwright slice, and demo sort smoke._
- [x] Leave URL pagination deferred unless trivially recoverable during this pass. _No hash pagination changes in this PR; relation query state still comes from localStorage._

Add icon-based UI on the Relations page that **builds up a SQL query** rendered in a CodeMirror editor. The SQL, not the icons, is the source of truth — it drives what the DataTable shows.

## Why this shape

Teaches the SQL by example. Every tweak a user makes in the UI has a visible SQL form they can learn from, copy, or continue editing by hand. "Just go to the SQL Runner" is always one step away — but casual browsing doesn't force them there.

## Behaviors

- [x] Query popover opens from the toolbar and mounts a CodeMirror SQL editor on demand. _`QueryPopoverBody` lives inside `RelationToolbar`; Playwright asserts the editor is absent until opened._
- [x] First query contribution switches from the editable `table.list` view into SQL-backed read-only results. _`RelationQueryPanel` derives `isDefault`; `orpc.sql.run` executes when state is not default and has a limit._
- [x] **Sort** — per-column icon cycles none → asc → desc → none. _`toggleSort` supports multi-column sort in click order._
- [x] **Filter** — popover with operator dropdown + value input. All 11 operators supported. _`FilterPopover` component, `FILTER_OPERATORS` list._
- [x] **Column hide/show** — eye icon, hidden columns commented in the select list via `buildRelationQuery` → `/* "col" */`.
- [x] **Pagination** — toolbar `limit` input + Previous/Next buttons. Hash-based pagination removed (`Route.page` gone).
- [x] **Hard limit requirement** — `hasLimitClause(sql)` regex check; error callout + `enabled: false` on the useQuery when missing.
- [x] **Custom SQL banner** — `isSimpleSelectFromTable` heuristic; info callout with a link to `#sql`.

## Non-goals

- Editing rows through a filtered/sorted view — the DataTable becomes read-only once any contribution is made. Row edits still work in the default unmodified view.
- Saving arbitrary state beyond localStorage.
- Bi-directional parsing of the SQL back to UI state. Icons drive the SQL; when user edits SQL manually, icons become disabled until "Reset" is clicked.

## Files

- `packages/ui/src/relation-query-builder.ts` (new) — pure `buildRelationQuery(state)` + small helpers. Unit-tested.
- `packages/ui/src/relation-query-builder.test.ts` (new) — vitest, covers every clause shape.
- `packages/ui/src/relation-query-panel.tsx` (new) — the toolbar + per-header icons + popover + SqlCodeMirror accordion. React component.
- `packages/ui/src/client.tsx` — `TablePanel` wired to the new component. In "default mode" keeps existing `orpc.table.list` edit flow. In "custom query mode" switches to `orpc.sql.run`, grid becomes read-only.
- `packages/ui/test/studio.spec.ts` — add end-to-end specs.

## TDD order

1. Red: unit tests for `buildRelationQuery` covering each clause shape.
2. Green: implement `buildRelationQuery`.
3. Red: playwright spec — click sort icon, query accordion opens, CodeMirror shows `order by`, DataTable reorders.
4. Green: build the React component, wire to `TablePanel`.
5. Repeat red/green for filter, hide column, pagination, limit-required error, custom-SQL banner.

## Implementation log

- 2026-04-30 polish branch start: narrowed the remaining scope to relation toolbar icon polish plus a dirty-row mode-transition guard. URL pagination is explicitly left deferred unless a tiny recovery path appears while implementing the guard.
- 2026-04-30 polish complete: added accessible local SVG icons for relation query controls, introduced a confirmation guard before dirty editable rows enter SQL/read-only mode, tightened ambiguous CodeMirror Playwright label locators, and verified with targeted UI checks.
- Pure SQL-builder (`relation-query-builder.ts`) stays framework-agnostic and is covered by 21 vitest cases. Every clause shape (including `in (...)`, `is null`, escape rules, non-zero offset) is pinned to an exact string — easy to evolve.
- React side intentionally does **not** parse the SQL back into structured state. Once the user edits the CodeMirror directly, we just store `customSql` and disable the icons. A "Reset" button returns to structured mode. Bi-directional parsing would be a lot of code for marginal benefit.
- `orpc.sql.run` is defined as a mutation in the router but oRPC procedures can be called as queries too. The panel uses `useQuery` with a `queryFn` that wraps `orpcClient.sql.run(...)` directly — simpler types than passing `queryOptions()` through as a prop.
- Data grid stays read-only in custom-query mode since `table.save`/`table.delete` are tied to `table.list`'s primary-key mapping. Editing still works in default mode.
