---
status: needs-selection-grilling
size: medium
base: pg-ui
---

# pg-ui Architecture Pass

Summary: Candidate report recorded. The main completed pieces are the skill vocabulary pass, domain/ADR check, and pg UI/server seam exploration. Main missing piece: user selection/grilling on which candidate should become an implementation task; no pg-ui refactors were implemented on this branch.

Assumptions:

- The user asked to run the skill on `pg-ui`, so this branch is based on `origin/pg-ui`, not `main`.
- Because this is bedtime work and the skill normally ends by asking which candidate to explore, the useful output is a reviewable candidate report and task status, not a code refactor.
- Use the upstream-installed skill at `~/.codex/skills/improve-codebase-architecture`.
- Prefer pg UI/server seams: places where sqlite assumptions, pg adapter behavior, or UI data loading make modules shallow or hard to test.

Checklist:

- [x] Read project domain docs and ADRs if present. _Checked with `find`; no `CONTEXT.md` or `docs/adr` files are present in this worktree._
- [x] Explore pg-ui code paths using the skill vocabulary: Module, Interface, Depth, Seam, Adapter, Leverage, Locality. _Focused on `packages/sqlfu/src/ui/router.ts`, `packages/sqlfu/src/dialect.ts`, `packages/sqlfu/src/adapters/pg.ts`, `packages/pg/src/impl/*`, and `packages/ui/src/*` data-loading/query paths._
- [x] Record numbered deepening opportunities with files, problem, solution, and benefits. _See the candidate report below._
- [x] Mark the task as needing user selection/grilling rather than complete if no implementation is chosen. _Set status to `needs-selection-grilling`; the skill should resume by asking which candidate to explore._
- [x] Open/update the PR with the architecture report. _PR #96 body updated after pushing this report commit._

## Candidate Report

The next step is user selection/grilling. Which candidate should be explored first?

1. **Deepen the relation row editing Module**

   **Files**

   - `packages/sqlfu/src/ui/router.ts`
   - `packages/sqlfu/src/ui/shared.ts`
   - `packages/sqlfu/src/dialect.ts`
   - `packages/pg/src/impl/live-introspection.ts`
   - `packages/ui/src/client.tsx`
   - `packages/sqlfu/test/ui-server.test.ts`
   - `packages/ui/test/pg-studio.spec.ts`

   **Problem**

   `uiRouter.table.*` is a shallow Module. Its Interface is `table.list/save/delete`, but the implementation forces `ui/router.ts` to know row identity, editability, primary-key handling, sqlite `rowid`, pg's lack of stable rowid, identifier quoting, boolean value encoding, optimistic delete matching, and pagination SQL. The pg branch moved live introspection onto the `Dialect` Interface, but the row-editing Seam still lives half in the router and half in the dialect. The deletion test says that deleting the helpers from `ui/router.ts` would scatter the same row-key and SQL-building rules across callers/tests, so this is a real Module trying to exist, just not deep enough yet.

   **Solution**

   Introduce a deeper relation row editing Module at the UI/server Seam. Keep `uiRouter.table.*` as the transport Interface, but move "list rows, decide editability, build row keys, insert/update/delete rows, normalize db values" behind a dialect-aware Adapter. SQLite and pg would be two real Adapters at the same Seam; sqlite can expose `rowid` fallback, pg can require a primary key and own pg-specific value handling.

   **Benefits**

   Locality improves because row-editing rules stop living in a long router file beside unrelated schema, catalog, SQL runner, and query-file procedures. Leverage improves because the UI, oRPC handlers, and tests all exercise one relation row editing Interface. Tests can become integration-style specs against the Module for sqlite and pg row-key/editability behavior, then thinner UI tests only need to prove the row editor calls that Interface.

2. **Move relation query building behind a server-side Module**

   **Files**

   - `packages/ui/src/relation-query-builder.ts`
   - `packages/ui/src/relation-query-panel.tsx`
   - `packages/ui/src/relation-query-builder.test.ts`
   - `packages/ui/src/client.tsx`
   - `packages/sqlfu/src/ui/router.ts`
   - `packages/sqlfu/src/dialect.ts`

   **Problem**

   The relation query builder is a shallow Module with a raw SQL string Interface. The React UI must know dialect-sensitive SQL generation, limit safety, read-only mode switching, query keys, and result extraction, then it calls the generic `sql.run` endpoint. One test explicitly records a sqlite assumption: numeric comparison values are quoted because sqlite casts strings to numbers. That happens to work for common pg cases, but the Module has no Seam for dialect-specific operators, parameter binding, type-aware literals, identifier policy, or server-side validation.

   **Solution**

   Replace "UI builds SQL, generic SQL runner executes it" with a relation query Module whose Interface is the structured query state: relation, columns, filters, sorts, limit, and offset. The server-side Adapter would use `config.dialect` to quote identifiers, bind values, decide supported operators, and execute safely. The UI can still render an editable SQL preview, but execution should cross the structured relation query Seam instead of relying on client-side SQL text as the behavioral contract.

   **Benefits**

   Locality improves because dialect-sensitive SQL construction and data-loading rules concentrate in one server Module instead of being split between React, tests, and `sql.run`. Leverage improves because every relation browser workflow gets safe parameterization, dialect behavior, and consistent pagination through the same Interface. Tests gain leverage by asserting structured query behavior once for sqlite and pg, rather than encoding sqlite casting assumptions in UI-only tests.

3. **Make configured database lifecycle a deeper Adapter Module**

   **Files**

   - `packages/sqlfu/src/types.ts`
   - `packages/sqlfu/src/node/host.ts`
   - `packages/sqlfu/src/adapters/pg.ts`
   - `packages/ui/test/template-project-pg/sqlfu.config.ts`
   - `packages/ui/test/pg-fixture.ts`

   **Problem**

   The configured database Seam is real, but the current Interface is too shallow for pg. `SqlfuDbFactory` requires a `DisposableAsyncClient`, while `createNodePostgresClient(pool)` returns only an `AsyncClient`. The pg UI template has to explain lifecycle rules inline, create a pool, attach an `error` listener, wrap the client, and implement `[Symbol.asyncDispose]`. That means every pg project/test must know host disposal expectations and node-postgres pool behavior, even though those are Adapter concerns.

   **Solution**

   Deepen the pg database Adapter around lifecycle, not just query execution. Keep `createNodePostgresClient` for users who already own a pool, but add or promote a higher-level pg database Adapter that satisfies the `SqlfuDbFactory` Interface directly. That Adapter should own pool creation, disposal, session error handling expected by sqlfu's host, and the returned `DisposableAsyncClient` shape.

   **Benefits**

   Locality improves because pg pool lifecycle knowledge lives in the pg Adapter instead of every config/template. Leverage improves because UI server, CLI, tests, and docs all reuse the same database lifecycle Interface. Tests can focus on "factory works with host.openDb and disposes cleanly" instead of repeating hand-built pool wrappers in fixtures.

4. **Consolidate pg catalog inspection into one internal Module**

   **Files**

   - `packages/pg/src/impl/live-introspection.ts`
   - `packages/pg/src/impl/schema.ts`
   - `packages/pg/src/impl/typegen.ts`
   - `packages/pg/src/dialect.ts`
   - `packages/sqlfu/src/dialect.ts`
   - `packages/sqlfu/src/ui/router.ts`

   **Problem**

   Pg relation/column knowledge appears in multiple Modules: live introspection for the UI, canonical schema rendering for drift/materialization, and typegen schema loading. Each has its own pg catalog queries, `public` schema assumption, relation filtering, column ordering, and type naming. The public `Dialect` Interface is useful, but the pg Adapter implementation is shallow internally because each method re-learns the same catalog model.

   **Solution**

   Introduce an internal pg catalog inspection Module behind the pg Adapter. It should expose a small Interface that can answer "visible relations", "relation columns", and "canonical relation model" once, then let `pgListLiveRelations`, `pgExtractSchemaFromClient`, and `pgLoadSchemaForTypegen` adapt that model to their specific public `Dialect` methods.

   **Benefits**

   Locality improves because future pg schema support, such as non-public schemas, custom types, generated columns, or richer primary-key metadata, changes in one place. Leverage improves because typegen, schema drift, and UI browsing all benefit from the same pg catalog fixes. Tests gain leverage through one catalog fixture suite reused by live introspection, canonical schema, and typegen assertions.

5. **Create a schema workspace data-loading Module**

   **Files**

   - `packages/ui/src/client.tsx`
   - `packages/sqlfu/src/ui/router.ts`
   - `packages/sqlfu/src/node/host.ts`
   - `packages/pg/src/impl/schema.ts`
   - `packages/pg/src/impl/schemadiff.ts`
   - `packages/ui/test/studio.spec.ts`
   - `packages/ui/test/pg-studio.spec.ts`

   **Problem**

   The Studio root eagerly suspends on `project.status`, `schema.get`, `catalog`, `schema.check`, and `schema.authorities.get` before rendering most workflows. On pg, `schema.check` and authorities can perform expensive extraction/materialization work through pg Adapters. Invalidation is similarly broad: schema commands and table/SQL mutations refetch `orpc.schema.key()` or call `invalidateSchemaContent()` from several UI modules. The data-loading Interface is shallow because each caller needs to know which expensive server Modules might be stale.

   **Solution**

   Add a schema workspace data-loading Module that owns route-aware loading and invalidation policy. It could split "navigation snapshot" from "schema diagnostics/authorities", lazily load heavy pg-backed data only when the Schema panel needs it, and expose a single invalidation Interface for mutations that might affect relations, catalog, rows, or drift cards.

   **Benefits**

   Locality improves because caching and invalidation policy stop being distributed through `Studio`, `SchemaPanel`, `TablePanel`, `SqlRunnerPanel`, and `QueryPanel`. Leverage improves because pg's expensive Adapters get called only by workflows that need them, and every mutation gains a consistent refresh story. Tests can assert the data-loading Module's query/invalidation behavior directly, while Playwright specs verify user-visible freshness rather than internal request ordering.

## Implementation Notes

- Created during bedtime work on 2026-05-06.
- Loaded `/Users/mmkal/.codex/skills/improve-codebase-architecture/SKILL.md` and `LANGUAGE.md`; report should use Module, Interface, Depth, Seam, Adapter, Leverage, and Locality exactly.
