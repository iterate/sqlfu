---
status: ready
size: medium
---

# SQL Parser For Sqlfu

## Status Summary

- Close to done: `not started`
- Main reason to consider this:
  - `sqlfu` already owns other SQL-aware subsystems like formatting and schemadiff, so a parser is not obviously out of scope
  - the remaining schemadiff precision gap is mostly “token-aware heuristics vs real syntax/AST understanding”
- Main caution:
  - this should start as a targeted capability decision, not as a blanket rewrite of every SQL feature around a parser

## 2026-05-17 SQLite built-ins spike

Status summary: spike complete, implementation intentionally deferred. SQLite built-ins can narrow parser adoption for schema-body dependency analysis: `node:sqlite` exposes `sqlite3_set_authorizer()` as `DatabaseSync.setAuthorizer()` in Node v24.10.0+, `sqlite3_column_origin_name()` through `StatementSync.columns()`, and a focused spec now demonstrates what those APIs can and cannot cover. The main missing piece is product integration design across all supported SQLite adapters, because not every adapter exposes authorizer callbacks.

Assumptions:

- Parser adoption should stay out of scope unless the SQLite built-in investigation produces concrete gaps that need AST-level analysis.
- `schemadiff` should not be rewritten wholesale in this branch.
- Primary-source SQLite documentation is enough for API capability claims, but repo-local tests/prototypes should decide what is feasible from the bindings sqlfu actually uses.

Scope:

- Check `sqlite3_set_authorizer()`, `sqlite3_column_origin_name()`, `explain` / `explain query plan`, and `sqlite3_stmt_scanstatus()` for dependency-analysis usefulness.
- Inspect sqlfu's existing SQLite runtime/bindings path to see which of those capabilities are exposed to TypeScript today.
- Land the smallest durable artifact from the finding: a focused spec/prototype if feasible, otherwise a concise internal note plus this task update.

Checklist:

- [x] Read primary SQLite docs for the candidate built-in APIs. *Checked SQLite C API docs for authorizer, column-origin, scanstatus, and explain/query-plan behavior; links are in the implementation log below.*
- [x] Identify the SQLite binding(s) used by sqlfu and whether they expose those APIs. *`node:sqlite` exposes `setAuthorizer()` and `StatementSync.columns()`; `better-sqlite3`/`libsql` expose `columns()`-style origin metadata but not an authorizer callback on sqlfu's current surfaces; `bun:sqlite` documents column names/types/declared types but not origin/authorizer.*
- [x] Add executable evidence for the practical conclusion where feasible. *Added `packages/sqlfu/test/schemadiff/sqlite-builtins-spike.test.ts`.*
- [x] Update this task with the conclusion, remaining parser scope, and next steps. *Recorded below: authorizer is promising for SQLite-only schema-body dependencies, but parser work remains relevant for adapter portability and raw SQL bodies without a compiled SQLite context.*
- [x] Push the branch and update the PR body with evidence and checks. *Opened and updated PR #132 with the authorizer conclusion, before/after, and targeted check results.*

Conclusion:

- `sqlite3_set_authorizer()` is the only candidate built-in that can materially narrow parser adoption for dependency analysis. It reports semantic table/column reads and writes while SQLite compiles statements.
- In `node:sqlite` on Node v24.10.0+, the authorizer can report:
  - `check (...)` column reads while compiling `create table`
  - partial-index indexed and `where` column reads while compiling `create index`
  - base-table column reads for view bodies when preparing a query against the view, with the view name in the callback source argument
  - trigger-body reads and writes when preparing a DML statement that can fire the trigger, with the trigger name in the callback source argument
  - table-only reads where SQLite reports an empty column name, such as `count(*)` views and `exists(select 1 from posts)` trigger bodies
- `sqlite3_column_origin_name()` / `StatementSync.columns()` is useful supporting metadata for result columns only. It does not report non-output dependencies such as `where` columns.
- `explain` / `explain query plan` should not be used as a dependency-analysis API. SQLite documents the output as troubleshooting-oriented and unstable, and the spike spec shows it reports table scan shape without column-level dependencies.
- `sqlite3_stmt_scanstatus()` is not a fit for this problem. SQLite documents it as predicted/measured performance data, and it requires a compile-time SQLite option.

Next steps:

- Decide whether schema diff should introduce a `node:sqlite`-backed internal dependency probe for SQLite schema bodies, separate from the public adapter abstraction.
- If yes, prototype a tiny internal function that materializes schema SQL into a scratch `DatabaseSync`, installs an authorizer, compiles targeted probe statements, and returns `referenced tables/views`, `referenced columns`, and `trigger/view source` facts.
- Account for Node support explicitly. `DatabaseSync.setAuthorizer()` is not available in the repo's declared Node 22 floor, so product integration either needs a feature check and fallback, a dev-tool-only path, or a deliberate engine bump.
- Keep parser adoption scoped to the cases the authorizer cannot cover cleanly: adapter-independent analysis, incomplete SQL fragments without a materialized schema, and AST-level transformations beyond dependency facts.

## Goal

Evaluate and, if justified, introduce a real SQL parser capability to support higher-precision analysis in parts of `sqlfu` such as:

- SQLite schemadiff dependency analysis
- view / trigger / `check(...)` expression reference analysis
- other future SQL-aware tooling where token scanning stops being robust enough

This is not automatically a “replace everything with parser ASTs” task.

## Why This Exists

Current schemadiff is much better than it was:

- it ignores strings/comments
- it handles alias-shadowing cases that used to produce false positives
- it has typed dependency/blocker facts rather than purely ad hoc planner logic

But it is still fundamentally token/heuristic-driven rather than AST-driven.

Important nuance: only some parts of schemadiff are token-based today.

Already metadata-driven from SQLite inspection:

- table existence / removal / creation
- column lists and column order
- primary keys
- foreign keys
- index lists and indexed columns
- trigger/view object existence
- generated/hidden column detection

Those come from SQLite catalog tables and PRAGMA inspection, not from token scanning.

Still token/heuristic-driven today:

- whether a `check(...)` clause actually references a removed column
- whether a partial-index `where` clause actually references a removed column
- which tables/views a view definition really depends on
- which tables/views/columns a trigger body really depends on
- alias-shadowing / qualified-name / expression-position edge cases in those SQL bodies

So the parser question is not “should schemadiff stop using SQLite metadata?” It is “should the SQL-body analysis parts stop relying on token-aware heuristics?”

A parser would fill the gap around things like:

- exact column references instead of token presence
- aliases and qualified names with stronger confidence
- subqueries / CTEs / more complex trigger bodies
- fewer false positives and false negatives in weird but valid SQL

That gap is real, but it is not yet proven large enough to justify parser complexity by default.

## Checklist

- [ ] Survey existing parser options that could plausibly fit `sqlfu`.
  Consider:
  1. SQLite-specific parsers
  2. general SQL parsers with usable SQLite support
  3. whether we can reuse an existing parser already in the ecosystem instead of inventing one
- [ ] Decide whether parser adoption should be:
  1. a runtime dependency
  2. a vendored/parser-submodule approach
  3. a tightly scoped optional internal tool used only for certain analyses
- [ ] Define the first narrow success case.
  Recommended first target:
  - parser-backed dependency analysis for SQLite views / triggers / `check(...)` expressions in schemadiff
- [ ] Write fixtures that current token-aware analysis cannot handle cleanly, and use them as the acceptance bar.
  The parser task should be justified by concrete failing cases, not by architecture aesthetics alone.
- [ ] Decide what the parser should produce for `sqlfu`.
  Prefer a narrow internal representation such as:
  - referenced tables/views
  - referenced columns
  - aliases / scopes where needed
  rather than leaking raw third-party ASTs everywhere.
- [ ] Keep parser integration incremental.
  The first parser-backed consumer should be one analysis path, not a repo-wide forced migration.
- [ ] Document the maintenance tradeoffs.
  This should include:
  - supported dialect scope
  - update strategy if the parser is vendored or wrapped
  - what still intentionally stays heuristic if not worth parsing

## Recommended Scope

Good first scope:

- parser-backed SQLite dependency analysis for schemadiff

Bad first scope:

- rewrite formatter, schemadiff, and every other SQL-aware subsystem at once
- invent a brand-new SQL parser unless existing options are clearly inadequate

## SQLite Built-In Investigation

Before committing to parser work, it is worth checking whether SQLite itself can provide enough analysis for some of the current gaps.

Promising avenues:

- `sqlite3_set_authorizer()`
  This is the most interesting built-in lead. SQLite calls the authorizer during statement compilation, including for column reads/writes, so it may be able to report table/column usage for ordinary statements without needing a full parser in `sqlfu`.
- `sqlite3_column_origin_name()`
  Potentially useful for understanding where result columns came from, though it is narrower than full dependency analysis.
- `EXPLAIN` / `EXPLAIN QUERY PLAN`
  Probably more useful for execution planning than semantic dependency extraction, but still worth confirming.
- `sqlite3_stmt_scanstatus()`
  Likely runtime/scan-oriented rather than semantic, but worth ruling in or out explicitly.

This does not automatically replace parser work:

- these APIs may help for ordinary statements compiled by SQLite
- they may be less helpful for stored SQL text analysis such as view definitions, trigger bodies, and `check(...)` clauses where `sqlfu` still needs structured dependency understanding

So a good first step in this task is:

- determine whether SQLite built-ins can cover enough of the dependency-analysis problem to sidestep or narrow the parser scope

## Notes

- The justification here came out of the SQLite schemadiff dependency-model work:
  - we closed the obvious correctness gaps with token-aware structured analysis and fixtures
  - the main remaining caveat is parser-grade precision for more exotic SQL
- This is a “someday if justified by real cases” task, not an emergency follow-up.

## Implementation Log

### 2026-05-17 SQLite built-ins spike

- Primary-source SQLite references:
  - `sqlite3_set_authorizer()` is invoked while SQL is compiled by `sqlite3_prepare*()`, and reports reads/writes with a trigger-or-view source argument: https://www.sqlite.org/c3ref/set_authorizer.html
  - `sqlite3_column_origin_name()` reports the origin of result columns in a `select` statement: https://sqlite.org/c3ref/column_database_name.html
  - `explain` / `explain query plan` output is intended for interactive troubleshooting and may change between SQLite releases: https://www.sqlite.org/lang_explain.html and https://sqlite.org/eqp.html
  - `sqlite3_stmt_scanstatus()` is performance/plan telemetry and is only available when SQLite is compiled with `SQLITE_ENABLE_STMT_SCANSTATUS`: https://www.sqlite.org/c3ref/stmt_scanstatus.html
- Binding notes:
  - Node v26 exposes `DatabaseSync.setAuthorizer()` and `StatementSync.columns()` in `node:sqlite`.
  - `better-sqlite3` and `libsql` expose statement `columns()` metadata similar to origin metadata, but sqlfu's current adapter surfaces do not expose a compile-time authorizer hook there.
  - Bun documents `columnNames`, `columnTypes`, and `declaredTypes`, but not origin table/column metadata or authorizer callbacks in `bun:sqlite`.
- Executable artifact:
  - `packages/sqlfu/test/schemadiff/sqlite-builtins-spike.test.ts` demonstrates the authorizer can report dependency facts for `check (...)`, partial indexes, view bodies, and trigger bodies.
  - The same spec demonstrates that origin metadata and `explain query plan` do not report non-result-column dependencies like `where user_id = 1`.
