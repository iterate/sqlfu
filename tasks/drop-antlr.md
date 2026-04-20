---
status: in-progress
size: large
---

# Replace ANTLR with a hand-written SQLite parser

## Status (high-level, human-skim)

Multi-night task. **Night 2 complete.** The parser now covers ~all of the SQL shapes that show up in the real test corpus (measured at 100% pass rate, see "Night 2 status" below). Next pick-up is still phase 3 (consumer swap).

- [x] Phase 0: plan refinement + per-phase acceptance criteria
- [x] Phase 1: surface-area analysis — `types.ts` enumerates every ANTLR node shape the analyzer reads (24 node types, one file).
- [x] Phase 2: tokenizer + substantially full recursive-descent parser — `tokenizer.ts`, `select_stmt.ts`, `dml_stmt.ts` ship with tests. All additive, zero analyzer changes. Covers SELECT (+ JOIN, CTE, compound, group/order/limit), the full SQLite expression grammar with precedence, INSERT/UPDATE/DELETE + RETURNING + ON CONFLICT.
- [ ] Phase 3: per-file analyzer swap (next session) — details under "Next steps" below.
- [ ] Phase 4: fixture tail (future session) — likely quite small given the current coverage measurement.
- [ ] Phase 5: delete ANTLR + `typesql-parser/sqlite/` + `antlr4/` (future session)

### Next steps for phase 3 (resumption guide)

1. Add an ANTLR-compatible shim over the plain-data AST. The shim should make a `ParsedSelectStmt` look like a `Select_stmtContext` from `types.ts` (it needs `.getText()`, `.start.start`, `.stop?.stop`, plus the accessor methods). Aim for a thin wrapper class, not a deep copy.
2. Start swapping `sqlite-query-analyzer/` consumers. Topological order (leaves first):
   - `enum-parser.ts` — smallest surface, only reads Create_table/Column_def/Column_constraint/Expr. Good first swap.
   - `traverse.ts` — the big one. Break it into logical chunks if needed.
   - `parser.ts` — replace `parseSqlite` call with the new parser entry.
3. Each swap commits in isolation with tests still green.

All of the ANTLR code stays in place the whole time until phase 5. New parser lands alongside it under a new directory, then consumers migrate one at a time. Tests must pass on every push.

## Per-phase acceptance criteria

These are the concrete "done" signals that should be satisfied before each phase's commit/push lands.

### Phase 1 — surface-area analysis

- `packages/sqlfu/src/vendor/sqlfu-sqlite-parser/types.ts` exists and is the *only* new file in this commit.
- It documents every `*Context` kind the analyzer `instanceof`-checks or constructs from ANTLR output, by:
  - grouping by statement (SELECT / INSERT / UPDATE / DELETE / common) and by construct (expr / join / with-clause / returning / etc.);
  - one TypeScript interface per node kind;
  - each interface includes a comment citing the 1–2 most common accessors the analyzer calls on it (`ctx.result_column_list()`, `ctx.table_name()`, etc.);
  - a short top-of-file summary noting total node count and which ANTLR generator files we are replacing.
- Nothing in `typesql/` or `typesql-parser/` is modified. No `instanceof`/accessor call sites migrate in this phase.
- `pnpm --filter sqlfu test --run` still green; `pnpm --filter sqlfu typecheck` still green.

### Phase 2 — tokenizer + select skeleton

- `packages/sqlfu/src/vendor/sqlfu-sqlite-parser/tokenizer.ts` is self-contained (no imports from `typesql-parser/`), exports `tokenize(sql: string): Token[]` and a `TokenKind` union.
- Handles: keywords (case-insensitive), identifiers (bare + `"quoted"` + `` `backtick` `` + `[bracket]`), string literals (`''` escape), numeric literals (int, float, hex `0x...`), parameter markers (`?`, `?N`, `:name`, `@name`, `$name`), the SQLite operator set (`||`, `<>`, `!=`, `<=`, `>=`, `==`, `<<`, `>>`), punctuation, `--` line + `/* */` block comments.
- `tokenizer.test.ts` uses a small sample of queries pulled from `test/generate.test.ts` / `test/fixtures/**` and asserts token streams via `toMatchInlineSnapshot` (readable, no magic numbers).
- `select_stmt.ts` recursive-descent parses the simplest subset — literal `SELECT x FROM t WHERE y = ?`-class queries — and produces AST nodes conforming to `types.ts`. Its test asserts parse shape on 2–3 tiny fixtures.
- Nothing in `typesql/` or `typesql-parser/` is modified.
- `pnpm --filter sqlfu test --run` still green; `pnpm --filter sqlfu typecheck` still green.

### Phase 3 — analyzer swap (future session)

One PR per consumer file under `sqlite-query-analyzer/`, in topological order (leaves first: `util-nullability.ts`, then `traverse.ts`, then the orchestrator). Each swap keeps ANTLR alive; only when the last consumer migrates does the old import disappear.

### Phase 4 — fixture tail (future session)

One failing fixture per commit. Red test first, then minimal grammar addition to pass.

### Phase 5 — delete (future session)

Drop `typesql-parser/sqlite/`, `antlr4/`, the re-exports, the bundle-vendor delete list entries. Confirm tarball size drop against the estimate in this task.

The sqlfu codebase only needs an AST rich enough to feed `sqlite-query-analyzer/traverse.ts` (the 64 kB inference engine that derives column types / nullability / parameter types). The test suite covers the shapes that matter.

## Phasing

### 1. Carve out the ANTLR surface area the analyzer actually depends on

Before writing any parser, enumerate what `sqlite-query-analyzer/*.ts` reads from the ANTLR AST. That's the shape of the AST the new parser needs to produce. Expected workflow:

- Grep all `instanceof *Context` checks and `ctx.foo_bar_list()` accessor calls from `sqlite-query-analyzer/`, `codegen/sqlite.ts`, and `shared-analyzer/`.
- Bucket them by node type (Sql_stmt, Select_stmt, Result_column, Table_or_subquery, Expr, Join_constraint, Update_stmt, Insert_stmt, Delete_stmt, Returning_clause, Select_core, Column_name, …).
- The analyzer uses ~40-ish node types by rough count. That's the target surface, not "full SQLite grammar".

Exit criterion: a short TypeScript `types.ts` listing every AST node kind the analyzer consumes, with an example of each accessor it calls.

### 2. MVP parser: DQL-only, no alternates

Write a recursive-descent parser for a *minimal* subset that covers most of the test fixtures:

- tokenizer (keywords, identifiers, literals, operators, parameter markers `?` / `:name`)
- `select_stmt` → with-clause + select-core + compound operators + order-by + limit
- `table_or_subquery` (single table, subquery in parens, joined table)
- `result_column` (star, table.star, expression [AS alias])
- `expr` — literals, columns, function calls, unary/binary ops, CASE, subquery, IN, BETWEEN, LIKE, NULL handling
- `insert_stmt` / `update_stmt` / `delete_stmt` / `returning_clause`

Skip: CREATE/ALTER/DROP (we use `sqlite_master` introspection), PRAGMA (handled separately), window functions (can fall back / defer), triggers, virtual tables.

Exit criterion: ≥ 80 % of `test/generate.test.ts` cases parsing and passing type-inference. Count how many, ship a passing partial run before moving on.

### 3. Swap the analyzer over one accessor at a time

In `sqlite-query-analyzer/traverse.ts` and friends, replace imports from `typesql-parser/sqlite/...` with imports from the new `vendor/sqlfu-sqlite-parser/` (or wherever we land it). Because the AST shape mirrors ANTLR's by design (step 1), each swap should be mostly an import rename. Go file-by-file, keep ANTLR alive alongside until every consumer is migrated.

Exit criterion: all 1071 tests passing on the new parser. `typesql-parser/sqlite/` and `vendor/antlr4/` can be deleted.

### 4. Expand to handle the remaining failing fixtures

From the MVP, work backwards through fixtures that don't pass yet. Each failing fixture is a feature to add: window functions, recursive CTEs, specific function calls, collations, etc. Each gets its own commit with a test case pinned to the fixture.

### 5. Delete ANTLR

Remove `src/vendor/typesql-parser/` entirely, remove `src/vendor/antlr4/`, remove the entry-point re-exports in `typesql-parser/index.ts`, drop `typesql-parser` from the bundle-vendor script's delete list. Verify the dist tree no longer mentions antlr.

## Scope and risk

- **Realistic effort**: 2-3 focused nights. Not one. The parser itself is ~2k lines; the long tail is making every test fixture produce exactly the same AST-shape the current analyzer expects.
- **Regression risk**: moderate. The test suite is good but covers *behaviors*, not every syntactic edge. Unknown unknowns likely in:
  - String literal quoting edge cases (single vs double, `''` escapes)
  - `NATURAL JOIN` / `USING (col)` — null propagation semantics
  - CASE expression nullability propagation (weirdly subtle)
  - Subquery correlation (referencing outer columns)
  - Compound SELECT (`UNION ALL` etc.) — type coercion rules
  - JSON path expressions, if any tests use them
- **What to do if a fixture won't parse**: do NOT quietly delete it. If the fixture exercises a feature sqlfu can't support without that grammar rule, either add the rule or open a separate task to drop the feature deliberately.

## What this is NOT

- **Not a typesql rewrite.** Keep `shared-analyzer/` and `sqlite-query-analyzer/` as-is; only swap out the parser layer underneath them.
- **Not a sql-formatter rewrite.** sql-formatter uses its own nearley grammar and is tiny (56 kB); leave it alone.
- **Not a grammar-completeness exercise.** If a SQLite feature has no existing test fixture *and* no real-world user asked for it, it's out of scope.

## Before-and-after size estimate

| Chunk | Now | After drop-antlr |
|---|---|---|
| `typesql-parser/sqlite/SQLiteParser.ts` (generated) | 445 kB input, ~250 kB minified | 0 |
| `typesql-parser/sqlite/SQLiteLexer.ts` (generated) | 72 kB input, ~40 kB minified | 0 |
| `antlr4` runtime | 115 kB input, ~60 kB minified | 0 |
| New hand-rolled parser | 0 | ~40-60 kB minified |
| **Net change to vendored bundle** | | **~−320 kB minified** |

Expected tarball impact: **217 kB packed → ~100-130 kB packed**, **967 kB unpacked → ~600 kB unpacked**.

## Dependencies / ordering

Depends on the `slim-package` branch landing first (PR #29). That branch sets up the \`shared-analyzer/\` structure this task swaps the parser under.

## Implementation log

### 2026-04-20 (night 1, bedtime session)

- Task file fleshed out with concrete per-phase acceptance criteria so future sessions (or other agents) can pick up without re-deriving "what's done-enough for phase N".
- Landed on directory name `packages/sqlfu/src/vendor/sqlfu-sqlite-parser/` (matches the hint in the original phase 3 bullet and puts it under `vendor/` alongside the ANTLR tree it's ultimately replacing; still "vendored" in the sense that `typesql` is the consumer — keeps future pure-typesql resync mechanics clean).
- Ground rule for this session: no deletion of anything, no consumer swaps. Everything is additive.
- Phase 1 shipped: `types.ts` documents 24 consumed node shapes. Turns out ~16 of them are `getText()`-only identifier leaves — the real structural work is concentrated in `ExprContext` (~40 accessors), `Select_stmtContext`, `Select_coreContext`, `Table_or_subqueryContext`, and the parallel-list shapes of `Update_stmt`/`Upsert_clause`. Good news: that's ~5 nodes to implement carefully, not 24.
- Phase 2 shipped: tokenizer covers the full lexical surface, 16 tests. `select_stmt.ts` parser covers the simplest shapes with 14 tests; crucially it emits plain-data AST, not ANTLR-shaped nodes — that's a deliberate deferral to phase 3, which I added a shim layer to.
- Where I stopped: the parser's grammar surface is intentionally tiny (no JOIN, no GROUP BY, no CASE, no IN/BETWEEN/LIKE, no function calls, no CTEs/UNION). That's phase 4 per fixture.
- Test count over the session: 1071 → 1101 on the sqlfu filter. The 30 new tests are purely additive; no pre-existing behavior changed.

### 2026-04-21 (night 2, bedtime session)

Goal for the session: expand the phase-2 grammar to cover substantially more SQL shapes so that phase 3 (consumer swap) has a realistic shot at actually landing. Did not start phase 3.

#### Shipped

1. **SELECT, full grammar.** One commit (`drop-antlr night-2: full SELECT parser + expression precedence`). `select_stmt.ts` went from 420 → 1600 lines. Now covers:
   - DISTINCT / ALL, multi-column result columns, star / `tbl.*` / expression-with-alias (AS or bare).
   - FROM with all five explicit JOIN shapes (INNER / LEFT / RIGHT / FULL [OUTER] / CROSS / NATURAL) and both ON and USING constraints; comma-joined list; subquery in FROM; table-valued functions; nested joined `(a JOIN b ON ...)` shape.
   - GROUP BY (multi-expr), HAVING, ORDER BY with ASC/DESC + NULLS FIRST/LAST, LIMIT with both OFFSET and legacy `LIMIT a, b` forms.
   - Compound SELECT: UNION, UNION ALL, INTERSECT, EXCEPT, chainable. ORDER BY / LIMIT bind to the outer compound.
   - WITH / CTE, RECURSIVE, column-alias lists, multiple CTEs.
2. **Expressions, full precedence.** Implemented as a precedence-climbing recursive descent: OR, AND, NOT, equality (=, ==, !=, <>, IS [NOT] [DISTINCT FROM], IN, [NOT] LIKE/GLOB/MATCH/REGEXP, BETWEEN, ISNULL/NOTNULL), comparison, bit-and/or, shift, additive, multiplicative, ||, unary -/+/~, COLLATE, primary. Function calls including DISTINCT-arg, `*`-arg (count(*)), in-call ORDER BY (accepted & dropped), FILTER (WHERE ...), OVER (...) presence tracking. CAST(expr AS typename) with parameterized types. CASE (searched + simple). EXISTS / NOT EXISTS. Scalar subqueries. Parenthesized expression lists. BLOB literals `x'...'`. CURRENT_DATE / CURRENT_TIME / CURRENT_TIMESTAMP modeled as zero-arg function calls.
3. **Tokenizer fixes.** BLOB literal scanning moved ahead of identifier scanning so `x'deadbeef'` doesn't tokenize as `x` + `'deadbeef'`. Window-function names (RANK / ROW_NUMBER / DENSE_RANK / CUME_DIST / FIRST_VALUE / LAST_VALUE / NTH_VALUE / NTILE / PERCENT_RANK / LEAD / LAG) pulled out of the reserved-keyword set so they parse as ordinary identifiers / function names. Several unused framing-keyword entries (`CURRENT`, `PARTITION`, `RANGE`, `ROWS`, `GROUPS`, `UNBOUNDED`, etc.) removed too, since they only appear inside OVER (...) which the parser brace-matches past rather than parsing.
4. **`NOT EXISTS` collapses into `Exists(negated=true)`** rather than leaving `Unary(NOT, Exists(negated=false))` — saves consumers from having to unwrap.
5. **INSERT / UPDATE / DELETE.** One commit (`drop-antlr night-2: INSERT / UPDATE / DELETE + RETURNING`). New `dml_stmt.ts` (~550 lines) reuses the SELECT parser's expression grammar via two new reentry helpers on `select_stmt.ts`: `parseSelectFrom` and `parseExprFromCursor`. Covers:
   - INSERT: OR-action, schema-qualified table, column list, VALUES (multi-row) / SELECT / DEFAULT VALUES sources. `REPLACE INTO` shorthand tracked separately (`source_is_replace`).
   - ON CONFLICT (target) [WHERE pred] DO NOTHING | DO UPDATE SET ... [WHERE ...].
   - UPDATE: OR-action, optional alias, multi-assignment including tuple `(a, b) = (1, 2)`, WHERE, RETURNING. Records `where_offset` (byte offset of the WHERE keyword) so the analyzer can partition bind-parameter markers between SET and WHERE — this is the subtlety called out in `types.ts`.
   - DELETE: FROM, optional alias, WHERE (+ offset), RETURNING.
   - RETURNING: supports `*`, `tbl.*`, and `expr [AS alias]` with full expression grammar.

#### Test count

- Night 1: 30 parser tests, 1101 sqlfu-filter total.
- Night 2: **129 parser tests** (joins: 14, clauses: 10, compound: 6, cte: 4, expressions: 40, dml: 25, select: 20; tokenizer: 16). Sqlfu-filter total **1206**. All additive.
- Typecheck clean.

#### Coverage measurement

Built a scratch script (`test/sqlfu-sqlite-parser/coverage.ignoreme.ts`) that harvests every embedded SQL fixture from the test corpus (test files + loose `.sql` files, excluding the intentionally-malformed cross-dialect formatter fixtures) and attempts to parse each with the appropriate entry point.

Results: **420 fixtures total → 55 in-scope DQL/DML queries → 55/55 pass (100%)**. 326 are skipped DDL (CREATE / DROP / PRAGMA / ATTACH / BEGIN / etc. — out of scope per plan), 39 are skipped unknown (non-executable string content).

What this means: the parser likely covers ~all of the SQL shapes that the real test suite exercises at the analyzer level. Phase 3 (consumer swap) is now the bottleneck, not grammar coverage. Any remaining fixture-tail work (phase 4) is expected to be very small.

#### Not shipped (deferred)

- No analyzer consumer swap yet. Per the ground rules I kept ANTLR fully in place and changed no analyzer code. Phase 3 still needs an ANTLR-compatible shim wrapping the plain-data AST so `ExprContext.getText()`, `.PLUS()`, `.start.start`, etc. all work. That shim is where the real risk lives — once it's written, consumer migration should be largely mechanical file-by-file.
- CREATE TABLE / column constraint parsing for `enum-parser.ts`. Listed in `types.ts` as consumed by the analyzer (CHECK `col IN (...)` detection); not implemented yet. Small scope; could go in the first phase-3 session.
- Window function OVER (...) is brace-matched, not parsed — presence only. That matches what the analyzer needs per `types.ts` but will need real parsing if fixture-tail demands it.
- Top-level `WITH ... INSERT` / `WITH ... UPDATE` / `WITH ... DELETE`. Embedded selects inside DML already handle WITH. Adding a DML-level WITH preamble is a small ask for phase 3/4.
- ANTLR-shim layer for phase 3. Plan: a thin wrapper class per AST node type that implements the `*Context` interface documented in `types.ts`. Because the AST shape was deliberately designed (phase 1) to match what the analyzer reads, this should be mostly typing + simple accessor forwarding.

#### Next steps (for night 3 or future resumption)

Phase 3 consumer swap, starting with `enum-parser.ts` (smallest surface), then `traverse.ts` (the big one), then `parser.ts` (the orchestrator). Each file swap keeps ANTLR alive so the system remains green throughout. See night-1 "Next steps" above — unchanged.
