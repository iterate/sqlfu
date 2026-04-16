status: ready
size: medium

# Schemadiff Dependency Model And Operation Ordering

We have a working SQLite-native schemadiff, but its planner is still too coarse around object dependencies.

The next step is to introduce an explicit dependency/blocker model and operation ordering so we can handle cases like:

- dropping indexed columns without rebuilding the whole table
- dropping columns referenced by triggers/views by dropping and recreating those dependent objects around the column drop
- keeping rebuild fallback for intrinsic table-definition blockers like primary keys, foreign keys, unique constraints, check constraints, and generated-column dependencies

The goal is not to port PostgreSQL migra/schemainspect wholesale. The goal is to take the good planner ideas and apply them honestly to SQLite.

## Checklist

- [ ] Add a small topological sorter module under `packages/sqlfu/src/schemadiff/` by copying the code from `@pnpm/deps.graph-sequencer`. Comment at the top with explicit attribution, what was copied, and any modifications made for `sqlfu`.
- [ ] Introduce a planner-facing dependency model for schemadiff operations. Start with node identifiers as strings, and keep richer metadata in separate objects/maps rather than using large object literals as graph nodes.
- [ ] Define operation/node kinds for the first useful slice.
  Suggested initial set: `drop-index`, `drop-trigger`, `drop-view`, `drop-column`, `create-index`, `create-trigger`, `create-view`, `rebuild-table`.
- [ ] Refactor the current direct-drop-column fast path so it returns structured blockers/dependencies instead of a boolean gate.
  The planner should be able to say “column drop is blocked by these external objects” versus “column drop is blocked by intrinsic table-definition features”.
- [ ] Separate inspection-ish analysis from statement planning a bit more clearly.
  This does not need a full `schemainspect`/`migra` split, but it should move us toward:
  1. inspect/analyze schema objects and blockers
  2. build an operation graph
  3. topologically order operations
  4. render SQL statements
- [ ] Implement the first dependency-aware planner slice for external blockers only.
  If a removed column is blocked only by indexes, triggers, or views, plan:
  1. drop dependent external objects
  2. `alter table ... drop column ...`
  3. recreate surviving desired external objects
- [ ] Keep rebuild fallback for intrinsic table-definition blockers.
  This includes at least: PK, FK, UNIQUE table constraints, CHECK constraints, generated-column dependencies, and any case we cannot yet prove safe.
- [ ] Remove or shrink current SQL text heuristics as structured inspection becomes available.
  `createSql.includes(...)` / regex checks should be treated as temporary scaffolding, not the design.
- [ ] Add fixture coverage in `packages/sqlfu/test/schemadiff/*.fixture.sql` for the new dependency-aware cases.
  Start with:
  - indexed column drops without rebuild
  - trigger/view drop-and-recreate around direct column drop
  - explicit rebuild fallback cases for FK/CHECK/UNIQUE/PK/generated blockers
- [ ] Keep statement ordering deterministic and explain cycle failures clearly.
  If the topo sorter cannot order operations, the error should include enough context to debug the cycle.

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
