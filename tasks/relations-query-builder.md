---
status: in-progress
size: medium
---

# Relations view: sort / filter / column select / pagination as SQL contributions

## Status Summary (2026-04-30)

Core behavior is already shipped: the relation toolbar builds SQL, the query popover drives read-only SQL results, and the builder is covered by unit and Playwright tests. This polish pass is almost entirely UX hardening: replace remaining text/unicode toolbar controls with accessible SVG icon buttons, and prevent row edits from being silently discarded when a query action switches the grid from editable default mode into SQL/read-only mode. URL pagination remains deferred unless it falls out trivially from the edit-mode work.

## Polish Assumptions (2026-04-30)

- Existing local SVG components are preferred over adding an icon dependency; `packages/ui` has no icon library today.
- The guard for dirty row edits should protect every toolbar action that can leave the default editable table view: sort/filter/columns, query SQL apply, pagination limit/next/previous, and reset where relevant.
- The guard can use the existing row-editing callbacks instead of introducing a second dirty-row store.
- URL pagination (`#table/posts/2`) is a documented non-goal for this pass unless the implementation naturally exposes a tiny, low-risk recovery path.

## Narrowed Checklist (2026-04-30)

- [ ] Replace unicode/text glyph controls in the relation query toolbar/popovers with accessible local SVG icon components.
- [ ] Add a dirty-row transition guard before query actions switch from default editable table mode to SQL/read-only mode.
- [ ] Cover the guard with a focused Playwright spec that proves dirty edits are not silently lost.
- [ ] Run targeted unit/Playwright verification and update this task with the implemented breadcrumbs.
- [ ] Leave URL pagination deferred unless trivially recoverable during this pass.

Add icon-based UI on the Relations page that **builds up a SQL query** rendered in a CodeMirror editor. The SQL, not the icons, is the source of truth — it drives what the DataTable shows.

## Why this shape

Teaches the SQL by example. Every tweak a user makes in the UI has a visible SQL form they can learn from, copy, or continue editing by hand. "Just go to the SQL Runner" is always one step away — but casual browsing doesn't force them there.

## Behaviors

- [x] Query accordion appears below "Definition" on a Relation page. Collapsed by default. _`<details>` inside `RelationQueryPanel`; `accordion-open` persisted per relation in localStorage._
- [x] Auto-expands the first time the user contributes any clause. _`mutate()` helper flips `accordionOpen` on first invocation._
- [x] **Sort** — per-column icon cycles none → asc → desc → none. _`handleSortClick` in panel; single-column._
- [x] **Filter** — popover with operator dropdown + value input. All 11 operators supported. _`FilterPopover` component, `FILTER_OPERATORS` list._
- [x] **Column hide/show** — eye icon, hidden columns commented in the select list via `buildRelationQuery` → `/* "col" */`.
- [x] **Pagination** — toolbar `limit` input + Previous/Next buttons. Hash-based pagination removed (`Route.page` gone).
- [x] **Hard limit requirement** — `hasLimitClause(sql)` regex check; error callout + `enabled: false` on the useQuery when missing.
- [x] **Custom SQL banner** — `isSimpleSelectFromTable` heuristic; info callout with a link to `#sql`.

## Non-goals

- Multi-column sort (users can edit SQL directly).
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
- Pure SQL-builder (`relation-query-builder.ts`) stays framework-agnostic and is covered by 21 vitest cases. Every clause shape (including `in (...)`, `is null`, escape rules, non-zero offset) is pinned to an exact string — easy to evolve.
- React side intentionally does **not** parse the SQL back into structured state. Once the user edits the CodeMirror directly, we just store `customSql` and disable the icons. A "Reset" button returns to structured mode. Bi-directional parsing would be a lot of code for marginal benefit.
- `orpc.sql.run` is defined as a mutation in the router but oRPC procedures can be called as queries too. The panel uses `useQuery` with a `queryFn` that wraps `orpcClient.sql.run(...)` directly — simpler types than passing `queryOptions()` through as a prop.
- Data grid stays read-only in custom-query mode since `table.save`/`table.delete` are tied to `table.list`'s primary-key mapping. Editing still works in default mode.
