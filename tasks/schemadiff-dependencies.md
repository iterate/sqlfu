status: in-progress
size: medium

# Schemadiff Dependency Model And Operation Ordering

We have a working SQLite-native schemadiff, but its planner is still too coarse around object dependencies.

The next step is to introduce an explicit dependency/blocker model and operation ordering so we can handle cases like:

- dropping indexed columns without rebuilding the whole table
- dropping columns referenced by triggers/views by dropping and recreating those dependent objects around the column drop
- keeping rebuild fallback for intrinsic table-definition blockers like primary keys, foreign keys, unique constraints, check constraints, and generated-column dependencies

The goal is not to port PostgreSQL migra/schemainspect wholesale. The goal is to take the good planner ideas and apply them honestly to SQLite.

## Checklist

- [x] Add a small topological sorter module under `packages/sqlfu/src/schemadiff/` by copying the code from `@pnpm/deps.graph-sequencer`. Comment at the top with explicit attribution, what was copied, and any modifications made for `sqlfu`. Comment: vendored in `packages/sqlfu/src/schemadiff/graph-sequencer.ts` from the published npm tarball for `@pnpm/deps.graph-sequencer@1100.0.0`.
- [x] Introduce a planner-facing dependency model for schemadiff operations. Start with node identifiers as strings, and keep richer metadata in separate objects/maps rather than using large object literals as graph nodes. Comment: `sqlite-native.ts` now plans `SchemadiffOperation` records with string ids and `dependencies: string[]`, then orders them through `orderOperations(...)`.
- [x] Define operation/node kinds for the first useful slice. Comment: first slice includes `drop-index`, `drop-view`, `drop-trigger`, `drop-column`, `create-index`, `create-view`, and `create-trigger`.
  Suggested initial set: `drop-index`, `drop-trigger`, `drop-view`, `drop-column`, `create-index`, `create-trigger`, `create-view`, `rebuild-table`.
- [x] Refactor the current direct-drop-column fast path so it returns structured blockers/dependencies instead of a boolean gate. Comment: the direct-drop path now returns planned operations plus handled removed trigger/view names; intrinsic blockers still live in `canUseDirectDropColumn(...)` and need a fuller typed blocker model.
  The planner should be able to say “column drop is blocked by these external objects” versus “column drop is blocked by intrinsic table-definition features”.
- [ ] Add a small analysis layer that derives structured dependency facts from inspected SQLite objects.
  This should answer questions like:
  1. which columns an index or `check(...)` clause actually depends on
  2. which tables/views a view depends on
  3. which tables/views a trigger depends on
  4. whether a blocker is an external dependent object or an intrinsic table-definition constraint
- [ ] Introduce first-class blocker/dependency records instead of relying on booleans and ad hoc local checks.
  The planner should work with explicit records keyed by string ids, for example:
  1. blocker kind: `external-dependent` vs `table-definition`
  2. owner id: `table:t`, `view:v1`, `index:t_x_partial`
  3. referenced column names
  4. dependency ids
  5. whether the blocker can be removed and recreated around a direct column drop
- [ ] Separate inspection-ish analysis from statement planning and SQL rendering more clearly.
  It does not need a full `schemainspect`/`migra` split, but it should move us toward this file structure:
  1. `src/schemadiff/sqlite/inspect.ts`
     Keep raw schema inspection here or move the inspection-only helpers here if they are currently trapped in `sqlite-native.ts`.
  2. `src/schemadiff/sqlite/analysis.ts`
     Turn inspected schema objects into structured dependency/blocker facts.
  3. `src/schemadiff/sqlite/plan.ts`
     Build `SchemadiffOperation` nodes and dependency edges from the analyzed facts.
  4. `src/schemadiff/sqlite/render.ts`
     Render ordered operations into final SQL strings, including identifier quoting and output formatting.
  5. `src/schemadiff/sqlite/index.ts`
     Keep this as the SQLite orchestrator/entrypoint that wires inspect -> analyze -> plan -> order -> render.
  6. `src/schemadiff/sqlite-native.ts`
     Reduce this to a thin compatibility shim that forwards to `src/schemadiff/sqlite/index.ts`, or delete it if that entrypoint no longer earns its keep.
  Small shared helpers can live in focused files under `src/schemadiff/sqlite/` like `identifiers.ts` or `sqltext.ts` or `types.ts` if that keeps the main files short. No need to get explicit permission to create this kind of file, but only do it if there's an actual benefit - making things *excessively* modular just makes it hard to read!
  Add a short header comment at the top of each file noting which logic is SQLite-specific and, where relevant, whether the file is intended as a future seam for other dialect implementations.
- [ ] Build the operation graph from analyzed dependency data, not scattered `sqlMentionsIdentifier(...)` checks.
  The operation planner should consume analyzed dependency facts and produce:
  1. operation nodes
  2. explicit dependency edges
  3. stable ids for error messages and tests
- [ ] Keep SQL rendering as the last step after planning and ordering.
  The render step should only be responsible for formatting and SQL text generation, not for discovering dependencies or deciding ordering.
- [x] Implement the first dependency-aware planner slice for external blockers only. Comment: direct drop now handles baseline index/view/trigger blockers and recreates desired indexes/views/triggers after the drop when needed.
  If a removed column is blocked only by indexes, triggers, or views, plan:
  1. drop dependent external objects
  2. `alter table ... drop column ...`
  3. recreate surviving desired external objects
- [x] Keep rebuild fallback for intrinsic table-definition blockers. Comment: PK/FK/UNIQUE/CHECK/generated blockers still bail out of the direct path and fall back to rebuild.
  This includes at least: PK, FK, UNIQUE table constraints, CHECK constraints, generated-column dependencies, and any case we cannot yet prove safe.
- [ ] Remove or shrink current SQL text heuristics as structured inspection becomes available.
  `createSql.includes(...)` / regex checks should be treated as temporary scaffolding, not the design.
- [x] Replace text-matching heuristics for partial-index predicates with structured dependency analysis. Comment: `src/schemadiff/sqlite/sqltext.ts` now tokenizes SQL while skipping strings/comments, and `sqlite-native.ts` uses that when checking partial-index `where` blockers.
  Add support for cases where a predicate contains a string literal like `'y'` but does not actually depend on column `y`.
- [x] Replace text-matching heuristics for `check(...)` clauses with structured dependency analysis. Comment: `src/schemadiff/sqlite/analysis.ts` now checks `check(...)` definitions via identifier tokens instead of raw substring matching.
  Add support for cases where a `check(...)` clause contains a string literal like `'y'` but does not actually depend on column `y`.
- [x] Replace text-matching heuristics for view dependencies with structured dependency analysis. Comment: view dependency checks now flow through token-aware `sqlMentionsIdentifier(...)`, which ignores string literals and comments.
  Add support for cases where a view SQL string mentions a table name only inside a string literal, comment, or otherwise non-semantic text.
- [ ] Replace text-matching heuristics for trigger dependencies with structured dependency analysis.
  Trigger planning should be based on analyzed references to tables/views, not broad string matching over the trigger body.
- [x] Add fixture coverage in `packages/sqlfu/test/schemadiff/*.fixture.sql` for the new dependency-aware cases. Comment: `packages/sqlfu/test/schemadiff/drop-column.fixture.sql` now covers direct-drop for simple/indexed/trigger/view cases plus rebuild fallback for FK/CHECK blockers.
  Start with:
  - indexed column drops without rebuild
  - trigger/view drop-and-recreate around direct column drop
  - explicit rebuild fallback cases for FK/CHECK/UNIQUE/PK/generated blockers
- [x] Keep statement ordering deterministic and explain cycle failures clearly. Comment: operation chunks are topo-sorted then alphabetized for stable output, and cycle errors report the offending operation chain.
  If the topo sorter cannot order operations, the error should include enough context to debug the cycle.
- [x] Add fixture coverage for the current heuristic gaps before fixing them. Comment: added failing-then-green cases in `packages/sqlfu/test/schemadiff/fixtures/drop-column.sql` and `packages/sqlfu/test/schemadiff/fixtures/migra-equivalents.sql`.
  Start with:
  - partial-index predicate string literals that mention a dropped column name
  - `check(...)` string literals that mention a dropped column name
  - views/triggers whose SQL text mentions a table name only inside a string literal

## Notes

- Inspiration lineage:
  - `sqlfu` schemadiff is inspired by `@pgkit/schemainspect` and `@pgkit/migra`
  - `pgkit` was ported from djrobstep’s Python `schemainspect` and `migra`
  - those implementations are PostgreSQL-only; this work is SQLite-only for now
- `pgkit` already builds `dependent_on` / `dependents` relationships on inspected objects:
  - `~/src/pgkit/packages/schemainspect/src/pg/obj.ts`
- `pgkit`/`migra` mostly uses a dependency-aware pending-create/pending-drop loop rather than the `TopologicalSorter` directly:
  - `~/src/pgkit/packages/migra/src/changes.ts`
- There is a `dependency_order(...)` helper in `pgkit` `schemainspect`, but the code comments say it is not used by migra and is likely buggy:
  - `~/src/pgkit/packages/schemainspect/src/pg/obj.ts`
- Upstream issue pointing in the same direction:
  - djrobstep/migra issue `#196` calls out wrong DDL ordering and explicitly suggests building a dependency graph and topologically sorting it
  - djrobstep/schemainspect PR `#90` includes work around richer dependency handling

## Open Design Biases

- Bias toward string node ids for graph edges.
  Example shape:
  - `table:a`
  - `column-drop:a.y`
  - `index:a_y_idx:drop`
  - `view:person_names:create`
  Keep the full metadata in side tables keyed by those ids.
- Bias toward small explicit planner data structures rather than clever inferred ordering.
- Bias toward conservative failure or rebuild if we cannot yet model a SQLite rule cleanly.

## Implementation Notes

- Current operation graph support lives directly inside `sqlite-native.ts`. That is enough to prove out the approach, but there is still room to split analysis/graph-building/rendering into clearer phases.
- The current direct-drop gate still uses some temporary SQL-text heuristics, especially around CHECK constraints and view reference detection. Those should be replaced with richer inspected structure before we broaden the direct-drop path further.
- New failing fixtures added to expose the remaining heuristic gaps:
  - `packages/sqlfu/test/schemadiff/fixtures/drop-column.sql`
    - `partial index string literal mentioning dropped column should not block unrelated drop`
    - `check string literal mentioning dropped column should not force rebuild`
  - `packages/sqlfu/test/schemadiff/fixtures/migra-equivalents.sql`
    - `unrelated view string literal mentioning table name should not be treated as a dependency`
- Initial SQLite subfolder seams now exist under `packages/sqlfu/src/schemadiff/sqlite/`:
  - `index.ts`
  - `identifiers.ts`
  - `sqltext.ts`
  - `analysis.ts`
  The main planner still lives in `sqlite-native.ts`, but the first dialect-specific helpers have been moved behind the new boundary.
