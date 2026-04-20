status: in-progress
size: medium

# Typegen emits everything your app needs to talk to your db

## Implementation status (2026-04-20)

Primary piece (row-type emission) is landed and tested. Tertiary piece (dogfood refactor of `migrations/index.ts`) is deferred — see "Implementation log" below for why.

**Shipped in this PR:**

- Typegen emits a `tables.ts` in `.generated/` with one row type per table and view in the live schema. `<RelationName in PascalCase>Row`, e.g. `posts` → `PostsRow`, `post_summaries` → `PostSummariesRow`.
- Nullable columns are typed `T | null` (not `T?`) — every column is always present on a row; a null-valued column is distinct from an absent key.
- Barrel (`.generated/index.ts`) re-exports `tables.ts` so `import {PostsRow} from './.generated'` works.
- 20 existing snapshot tests updated to reflect the new output; one focused new test asserts the convention end-to-end with a mix of tables, views, nullable, and not-null columns.

**Deferred (see Implementation log):**

- The dogfood refactor of `migrations/index.ts` onto the new generated wrappers. Needs small typegen cleanups first (query catalog and migrations-bundle side effects; DDL support or a "definitions-only config" carve-out).

## One-line summary

Today typegen only emits typed wrappers for files in `queries/`. This task extends it to emit **TS row types for every table/view in `definitions.sql`**, so the generated output is "the complete bundle a consuming app needs to talk to its db": table row shapes + typed query wrappers + migration bundle, all behind one import path.

## Why the reframe

The original task (`dogfood-migration-queries`) focused on moving `insert into sqlfu_migrations` etc. out of inline template strings in `packages/sqlfu/src/migrations/index.ts` and into `queries/*.sql` files. That's still a nice-to-have, but it's a symptom of the real gap: our generated output today is incomplete. It tells you the shape of rows *a query returns*, but not the shape of rows *a table holds*. Any non-trivial consumer ends up re-typing column sets by hand, or importing `QueryCatalog`-derived types and squinting at them.

Framed as "generate everything I need for my app to work with my db":

- **Primary**: table/view row types emitted from `definitions.sql`. `import {PostRow, PostSummaryRow} from './.generated'` just works.
- **Secondary**: optional barrel convenience — e.g. a `Tables` map, or a `sqlfu.d.ts`-style ambient module. Bikeshed in design.
- **Tertiary** (the original task's focus): use the new types internally to tidy `migrations/index.ts`. If the typed row for `sqlfu_migrations` and a typed wrapper for `insert-migration.sql` happen to fall out of this, great — but it's a demonstration, not the headline.

## Grilling outcomes (2026-04-20)

Locked in, so future agents don't relitigate:

- **Filtered schema authorities is a *separate* PR**, not a prereq. Sqlfu-internal will not move onto the full migration framework in this PR. If we want to dogfood migrations against `sqlfu_migrations` itself later, that new PR handles authority-scoping.
- **When we do authority-scoping, it's a single glob** for now (`authorityPattern: 'sqlfu_*'`-style), not per-object-type. Revisit if a real use case breaks it.
- **No `scope`/`namespace` column on `sqlfu_migrations`.** Multi-project-in-one-db is speculative. The counter-argument: the sqlfu_migrations shape itself will change *very* rarely, and when it does it's a BIG DEAL anyway — migrations-for-migrations is not worth it.
- **`ensureMigrationTable` (the function) gets deleted.** The underlying *DDL* stays, expressed as a query file (`queries/ensure-migration-table.sql` using `CREATE TABLE IF NOT EXISTS`). It's run through the generated typed wrapper at the top of `applyMigrations`/`readMigrationHistory` — same behavior, one source of truth for the table shape.
- **Typegen runs before `tsc` at build time.** Consumers install sqlfu from npm and get pre-generated code. Nobody needs to run our CLI against our package just to `import` us.
- **Don't rename `migrations/index.ts`** to `schema.ts`/`db.ts`. The file is still about migration bookkeeping; a rename would be churn for its own sake.
- **Keep sqlfu-internal flagged "internal-use"** so we revisit the multi-project question deliberately if/when it comes up.

## Concrete shape of the work

1. **Row-type emission from `definitions.sql`.**
   - Input: the same parsed schema typegen already loads (`extractSchema` in `core/sqlite.ts`).
   - Output: one TS file in `.generated/` exporting a named type per table/view. Name mapping mirrors whatever convention the existing query wrappers use (`post_events` → `PostEventRow`? `PostEventsRow`? pick one; document it).
   - Nullability, type mapping, and validator integration should reuse the same code paths as query-column analysis — no parallel type mapper.
   - Decide: one file per table, or one `tables.ts` barrel? (Probably barrel. Fewer files, and users import by name.)

2. **Barrel exposes the new types.**
   - `.generated/index.ts` currently re-exports query wrappers. Add row types to the same barrel so `import * as db from './.generated'` surfaces everything.

3. **Dogfood refactor of `migrations/index.ts`** (smaller now, still worth doing):
   - Add `packages/sqlfu/queries/ensure-migration-table.sql` (DDL with `CREATE TABLE IF NOT EXISTS`) and one query per distinct SQL in the file today (`select-migration-history.sql`, `insert-migration.sql`, `delete-migration-history.sql`).
   - Run typegen against `packages/sqlfu` as part of the build, so generated wrappers ship inside the published package.
   - Rewrite the generator bodies in `migrations/index.ts` to call the generated wrappers instead of inline template strings. Delete `ensureMigrationTable` (the function) — inline the call to the generated `ensureMigrationTableQuery` at the top of `applyMigrations`/etc.
   - Delete the content/checksum rename alter-table hack in `ensureMigrationTableGen`. That was a back-compat shim from before the rename; we're pre-pre-alpha so it goes.

4. **Build wiring.**
   - `pnpm --filter sqlfu build` runs typegen *before* `tsc`. Details TBD — either a prepublish step or just chained in the package's `build` script. Either way, CI must not regress if someone deletes `.generated/`.
   - Check `.gitignore` story: do we commit `.generated/` into sqlfu's own source, or is it truly build-time-only and excluded? Recommendation: excluded locally, but the npm publish includes it.

5. **Tests.**
   - A test that imports a row type from the generated output and asserts shape (types-only test — `expectTypeOf` style).
   - A test that the existing migrations integration tests still pass after `migrations/index.ts` is rewritten against generated wrappers.

## Deliberately out of scope

- Filtered schema authorities (separate PR).
- Any migration framework for sqlfu-internal (explicitly deferred; queries only).
- Changing the on-disk checksum format (sha256 stays — inherited from the original task).
- Reworking sync/async unification (landed in #15).
- Multi-project-per-db support (no namespace column).
- Rollback, squash, or new migration features.

## Still-open decisions

Small ones that should be resolved during implementation, not before starting:

- Naming convention for row types (`PostRow` vs `PostsRow` vs `TableRow<'posts'>`). Pick one, document in a top-level JSDoc in the emitter.
- Where row types live relative to existing generated wrappers: same barrel for sure; single `tables.ts` file or one-per-table is a small call.
- Whether the row-type output uses the validator's output type (e.g. `z.infer<typeof postRowSchema>`) or a plain TS type alias. Probably plain alias — row types don't need runtime validation by default, and users can opt in per-query.
- Whether generated row types are readonly. Per project convention: no.

## Breadcrumb

Original motivation + PR #15 review comment is at <https://github.com/mmkal/sqlfu/pull/15#discussion_r3110098823>.

## Implementation log

### 2026-04-20 — row-type emission

- Added `writeTablesFile(generatedDir, schema)` in `packages/sqlfu/src/typegen/index.ts`. Reuses the same `RelationInfo` map that `loadSchema` already builds for query-column analysis, so there's no parallel type mapping.
- Convention: `relationTypeName(name)` is a PascalCase of the snake/kebab relation name, then a `Row` suffix. Alphabetically sorted in the file.
- Nullability policy for row types: required key, `| null` suffix. This deliberately differs from the convention query-result types use (`foo?: string` for nullable select columns), because a table row always has every column — a null-valued column is distinct from an absent key. Both conventions live side-by-side in the generated output now. Documented in a module-level JSDoc on `writeTablesFile`.
- `writeGeneratedBarrel` unconditionally re-exports `./tables.${ext}`. Even when the schema is empty, `tables.ts` is written with `export {};` so the barrel import resolves.

### 2026-04-20 — dogfood refactor deferred

Started scoping the refactor of `packages/sqlfu/src/migrations/index.ts` onto generated wrappers. Hit three design rocks worth flagging before implementing:

1. **DDL isn't expressible as a typegen query.** `CREATE TABLE IF NOT EXISTS sqlfu_migrations(...)` can't be moved into `queries/ensure-migration-table.sql` and get a typed wrapper — typesql analysis switches on `queryType: 'Select'|'Insert'|'Update'|'Delete'|'Copy'`. Options: (a) keep the DDL inline as a string and put only the dynamic queries through typegen, (b) move the DDL to `definitions.sql` and emit a companion constant that bundles its content, (c) add DDL support to typegen. (a) is the smallest step and still gets us table-shape single source of truth via the generated row type.
2. **`generateQueryTypesForConfig` has side effects that don't fit a library-author use case.** It also writes `.sqlfu/query-catalog.json` and a migrations bundle to `${migrations}/.generated/`. For sqlfu-internal we want neither. Either refactor the entry point so the caller can opt out, or live with the stray files under `.sqlfu/` and an empty `src/migrations/zero-migrations/.generated/migrations.ts`.
3. **Dual-dispatch vs generated wrappers.** Generated wrappers are async-only (`Promise<...>`). `migrations/index.ts` uses a sync+async dual-dispatch generator pattern so one code path services both sync and async clients. Two ways to reconcile: (a) keep the generators, and only import the *SQL string constants + row types* from the generated output (still dogfoods SQL-in-file + typegen analysis, keeps dual-dispatch untouched), (b) extend typegen to emit sync+async pairs. (a) is the right scope for this PR; (b) belongs to its own task.

The path of least resistance for the dogfood piece is: add `packages/sqlfu/src/migrations/queries/*.sql` for SELECT/INSERT/DELETE, a small `scripts/generate-migrations-types.ts` that programmatically runs typegen on them (accepting the side-effect files in `.sqlfu/` and an empty migrations bundle), commit the generated output, import the SQL constants + row types in `migrations/index.ts`, keep the `CREATE TABLE` DDL inline, delete the content→checksum rename shim. That's a coherent follow-up PR; stacking it here muddies review of the row-type change.
