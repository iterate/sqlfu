---
status: done
size: medium
issue: 110
---

# SQLite Parser Backed Schemadiff Analysis

## Status Summary

- Close to done: done.
- Main completed pieces: added `sqlite3-parser` as a plain dependency, moved schemadiff view/trigger/check reference extraction behind a parser-backed sqlfu-owned collector, and added two red-to-green schemadiff examples that prove fewer false blockers.
- Main missing pieces: none for this scoped PR. Partial-index `where` parsing and UI/editor diagnostics remain future follow-ups.

## Goal

Use `sqlite3-parser` as a normal dependency to improve SQLite schemadiff dependency analysis behind a small sqlfu-owned internal API.

The first target is the SQL-body analysis in `packages/sqlfu/src/schemadiff/sqlite/analysis.ts`, especially:

- view dependency facts
- trigger dependency facts
- `check(...)` column references

Do not expose `sqlite3-parser` AST nodes as public sqlfu API. The parser should feed narrow planner-facing facts such as referenced tables and referenced columns.

## Acceptance Bar

This task should clearly justify the dependency in at least one of these ways:

- illustrative schemadiff examples that improve over the current token heuristics
- or a net removal of a meaningful amount of local parser/heuristic code

Prefer illustrative examples. The dependency does not need to be vendored.

## Checklist

- [x] Add `sqlite3-parser` as a package dependency. _added `sqlite3-parser@0.7.1` to `packages/sqlfu/package.json` and `pnpm-lock.yaml`_
- [x] Add red schemadiff tests that show current false positives or false negatives from token-only analysis. _added two `drop-column.sql` fixtures: a CTE that shadows the dropped table name, and a trigger that writes the same-named column on another table; both failed before the parser collector_
- [x] Add an internal parser-backed reference collector with a narrow sqlfu-owned result shape. _implemented `packages/sqlfu/src/schemadiff/sqlite/references.ts` returning `SqliteReferenceFacts` rather than leaking raw AST nodes_
- [x] Wire the collector into view / trigger / `check(...)` dependency analysis without changing the planner contract. _`analysis.ts` still returns the same `SqliteDependencyFact` shape, now fed by parser-backed table/column facts_
- [x] Keep the formatter and TypeSQL parser path out of scope. _no formatter or TypeSQL files were changed_
- [x] Run focused schemadiff tests. _`pnpm --filter sqlfu test --run test/schemadiff` passed: 79 tests_
- [x] Run typecheck or explain why it could not be run. _`pnpm --filter sqlfu typecheck` passed_
- [x] Update this task with implementation notes and mark done checklist items with comments. _completed in this task file before moving it to `tasks/complete/`_
- [x] Open/update the draft PR body with `Closes #110`. _draft PR #111 includes `Closes #110`_

## Implementation Notes

- Assumption: use `sqlite3-parser` as a normal runtime dependency. The install footprint is acceptable for the spike, and vendoring would make this harder to evaluate cleanly.
- The implementation keeps `sqlite3-parser` behind `references.ts`; planner code consumes `referencedTables` and `referencedColumns`.
- The view collector understands CTE names as scope-local tables, so `with person as (...) select ... from person` no longer makes the view depend on the real `person` table.
- The trigger collector distinguishes trigger-subject columns from other tables' columns, so `insert into audit_log(nickname)` no longer blocks dropping `person.nickname`.
- `check(...)` references are collected from parsed `CreateTableStmt` constraint expressions, with the previous heuristic retained only as a fallback if parsing fails.
- Package measurement after build: `npm pack --dry-run --json` in `packages/sqlfu` reports 241,990 bytes packed, 1,005,020 bytes unpacked, 181 files.

## Verification

- `pnpm --filter sqlfu test --run test/schemadiff`
- `pnpm --filter sqlfu typecheck`
- `pnpm --filter sqlfu build`
- `cd packages/sqlfu && npm pack --dry-run --json`
