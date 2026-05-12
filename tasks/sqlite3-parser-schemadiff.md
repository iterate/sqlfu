---
status: in-progress
size: medium
issue: 110
---

# SQLite Parser Backed Schemadiff Analysis

## Status Summary

- Close to done: not started.
- Main completed pieces: issue #110 identified `sqlite3-parser` as a plausible plain dependency for SQLite AST-backed analysis.
- Main missing pieces: add the dependency, prove it improves schemadiff with red fixtures, replace the relevant token heuristics, and measure the line/size tradeoff.

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

- [ ] Add `sqlite3-parser` as a package dependency.
- [ ] Add red schemadiff tests that show current false positives or false negatives from token-only analysis.
- [ ] Add an internal parser-backed reference collector with a narrow sqlfu-owned result shape.
- [ ] Wire the collector into view / trigger / `check(...)` dependency analysis without changing the planner contract.
- [ ] Keep the formatter and TypeSQL parser path out of scope.
- [ ] Run focused schemadiff tests.
- [ ] Run typecheck or explain why it could not be run.
- [ ] Update this task with implementation notes and mark done checklist items with comments.
- [ ] Open/update the draft PR body with `Closes #110`.

## Implementation Notes

- Assumption: use `sqlite3-parser` as a normal runtime dependency. The install footprint is acceptable for the spike, and vendoring would make this harder to evaluate cleanly.
- The first test should exercise a visible schemadiff outcome, not just a private helper.
