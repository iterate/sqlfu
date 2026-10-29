---
status: done
size: large
---

# Make Postgres work on real schemas

Status: done. All three sections landed on this branch (PR #159), each with a red-first spec against real Postgres. Left for later: migra creates functions and composite types after tables, a few pg typegen type mismatches (`bigint`/`numeric` as strings, `cast` nullability), migra options. Those are in the guide's Known gaps and `tasks/pg.md` step three. Follow-up to #156 (merged).

Covers the first three items of "Step three" in [pg.md](../pg.md). The guide's "Known gaps" (`packages/sqlfu/docs/guides/postgres.md`) lists the user-facing symptoms and should shrink to whatever is left when this lands.

## Schema renderer

Status: done.

`draft`, `check` and `generate` re-read a Postgres schema as SQL text through `pgDialect.materializeSchemaSql` (apply DDL to a scratch db, read it back) and `pgDialect.extractSchemaFromClient` (read the live db). Both used `renderCanonicalSchema`, a hand-rolled `pg_catalog` renderer that only knew `public` tables, columns, constraints, indexes and views. Anything else was lost, so `diffSchema(rendered, original)` wasn't empty.

Spec: for a schema `S`, `diffSchema({baselineSql: materializeSchemaSql(S), desiredSql: S})` returns `[]`. Same for `extractSchemaFromClient` on a db where `S` was applied.

Decisions (made without the user, review these):

- **Render with the vendored migra, diffing an empty inspector against the db.** `Migration.create(null, db)` gives `create` statements for everything migra can see, which is what pgkit's migrator does for `definitions.sql`. The renderer and the differ now agree on what a schema contains. Skipping the render step was the other option, but the UI live-schema pane, drift checks and typegen want SQL text, and changing the `Dialect` contract for one dialect is a bigger change.
- **Output style is migra's.** Schema-qualified names, separate `create unique index` + `add constraint ... using index`, same as pg drafts. Statements trimmed and joined with one blank line, not run through `sql-formatter`.
- **`excludedTables` drops the table and everything hanging off it** (indexes, constraints, triggers, RLS policies, owned sequences) from the inspector. Matched by unqualified name, as on SQLite.
- **Leave out what every fresh database has:** the `public` schema and the `plpgsql` extension.
- **Extension versions aren't pinned,** matching `diffSchema`'s `ignore_extension_versions: true`.
- **Grants and comments stay out.** `diffSchema` doesn't diff them either. Listed in Known gaps.
- **Fix migra bugs in the vendored copy, with `sqlfu:` comments.**

- [x] `serial` / `bigserial` (`relation "t_id_seq" does not exist`) _`renderSchema` in `packages/pg/src/impl/schema.ts`_
- [x] identity columns (spurious `add generated always as identity` in every later draft) _same_
- [x] enums, domains (`type does not exist`) _same, plus vendored fixes: domains created after the tables using them, `create domain` missing `;`, domain over an enum created twice_
- [x] stored generated columns _same_
- [x] functions, triggers, materialized views, extensions, non-`public` schemas (redrafted every time) _same_
- [x] Spec covers all of the above plus shapes that already worked (plain tables, FKs, views, checks, indexes, uuid default, jsonb, arrays) _`packages/pg/test/schema-round-trip.test.ts`; failing cases are `test.fails`_
- [x] `excludedTables` _`omitTables` in `schema.ts`_
- [x] Docs _Known gaps shrunk to what's still broken; dropped the "use `uuid` or `text` ids" advice_

Left for later:

- migra creates functions and composite types after tables, so a default/check/generated column calling a user function, or a composite-type column, fails in drafts and `generate`. Functions' `dependent_on` only covers views (`deps.sql` reads `pg_rewrite`); fixing it needs attrdef/constraint → function deps from `pg_depend`, and it reorders every draft fixture that adds a function. In `tasks/pg.md` step three and Known gaps.
- Custom ICU collations render as `locale = 'null'` and lose `deterministic = false`. The differ doesn't catch it. In Known gaps.

Notes: probed 34 extra shapes against postgres:16. Round-trip fine: partitioned tables, RLS policies, views on views/functions, standalone sequences, deferrable FKs, inheritance, unlogged tables, partial/expression indexes, `setof` functions, triggers/serial/enums in other schemas, identity options, enum arrays, `unique nulls not distinct`, cross-schema FKs, procedures, exclusion constraints, quoted identifiers. Also fixed column collations (`ColumnInfo.creation_clause` left out `collate`). `packages/ui/test/pg-studio.spec.ts` passes 3/3.

## Typegen parity

Status: done.

Same `definitions.sql` and `sql/queries.sql`, generated with SQLite and with `pgDialect`:

| query | SQLite | Postgres before |
| --- | --- | --- |
| `select ... where slug = :slug limit 1` | `Promise<Result \| null>` | `Promise<Result[]>` |
| `select 1 as a` (no `from`) | `Promise<Result \| null>` | `Promise<Result[]>` |
| `select count(*) ... from posts` (no `group by`) | `Promise<Result \| null>` | `Promise<Result[]>` |
| `insert/update/delete ... returning` | `Promise<Result>` via `client.all` | `client.run(...)`, no row type |
| `update posts set title = :title where slug = :slug` | `(client, data: {title}, params: {slug})` | `(client, params: {title, slug})` |
| `where slug = :slug` on `text not null` | `slug: string` | `slug: string \| null` |

"FROM-less selects get no columns" was stale: it came from an old note in `tasks/complete/2026-05-07-pg-package.md`, and the temp-view pass in `packages/pg/src/impl/typegen.ts` already gives them columns. The real FROM-less gap was the row count.

The shared wrapper generator (`getResultMode` in `packages/sqlfu/src/typegen/index.ts`) was right. The pg analyzer got its inputs wrong: it never set `returning` or `data`, set `multipleRowsResult: true` for every select and RETURNING, and hard-coded every param's `notNull` to `false`.

Decisions (made without the user, review these):

- **Fix in the pg analyzer.** New `packages/pg/src/impl/query-shape.ts` reads the `pgsql-ast-parser` AST plus catalog facts (unique indexes, column nullability, aggregate and set-returning functions from `pg_proc`) and fills those fields.
- **Copy SQLite's rules, warts included,** so generated code ports between dialects. Where SQLite is wrong, fix both dialects together later:
  - DML+RETURNING is always one row, even `insert ... select ... returning`. Same as typesql.
  - Params are not-null unless tested with `is [not] null`, or inserted/set into a nullable column. `coalesce(:x, ...)` stays not-null, as on SQLite.
- **Single-row selects:** `limit 1`; no `from`; an aggregate with no `group by`; or one table whose `and`-ed equalities cover a unique index (PK, single or multi-column, not partial or expression indexes). typesql only spots the unique-key case when a table has exactly one unique column. pg checks every unique index rather than copying that quirk.
- **Set-returning functions** (`select generate_series(1, 3)`) stay multi-row unless `limit 1`. SQLite has none.
- **Update `data` split only when safe.** Wrapper args are `[...data, ...params]`, so split only when every SET param's `$N` comes before every other param's. Named params always qualify (SET is the first clause); hand-numbered `set title = $2 where id = $1` doesn't.
- **If `pgsql-ast-parser` can't parse a query,** keep the old loose output (array, nullable params). `returning` comes from "DML with result columns", which needs no parse.
- **Spec = parity test.** `packages/pg/test/generate-parity.test.ts` generates one project with each dialect and asserts identical wrapper signatures and namespace types, pinning SQLite's output in an inline snapshot. Schemas stick to `integer`/`text` so column types agree.

- [x] `limit 1` returns `Result | null`, not an array _`isMultipleRowSelect` in `query-shape.ts`_
- [x] `insert/update/delete ... returning` wrappers return rows _`returning: true` for DML with result columns, in `typegen.ts`_
- [x] update SET params go in `data`, as on SQLite _`findDataParams` in `query-shape.ts`_
- [x] `where col = :param` params aren't typed nullable _`findNullableParams` in `query-shape.ts`_
- [x] FROM-less selects (`select 1 as a`) get result columns _already worked; they now also return `Result | null`_
- [x] Spec: red parity test first, one test per case _`packages/pg/test/generate-parity.test.ts`, all 6 red before the fix_
- [x] Pg-only rules in analyzer fixtures _new `packages/pg/test/fixtures/typegen/result-shape.md`; every fixture now records `multipleRowsResult`, plus `returning`/`data` when set_
- [x] Docs _Postgres guide: runtime example no longer destructures `findPostBySlug`; "Generated wrappers" in Known gaps now lists what's still different_

Left for later:

- pg: `int8` (`count(*)`, `bigint`) is typed `bigint` and `numeric` is typed `number`, but `pg` returns both as strings by default. In Known gaps.
- pg: `cast(...)` drops not-null in the vendored pgkit nullability pass (`isNonNullableField` in `packages/pg/src/vendor/typegen/query/column-info.ts`). In Known gaps.
- pg: DDL in a query file fails analysis, so it gets no wrapper. SQLite emits `client.run`. In Known gaps.
- SQLite: unique-key single-row detection misses tables with more than one unique column.
- Both dialects: DML+RETURNING that can return many rows is typed as one row. Related: `tasks/one-mode-throw-on-empty.md`.
- SQLite: a named param used twice (`:body ... or :body is null`) appears twice in `Params`.

Notes: the parity test's aggregate case uses `coalesce(max(id), 0)`, because SQLite types `max/min/avg` as not-null and `sum(int)` as `number`, while pg says nullable and `bigint`. Those are column types, not wrapper shape.

## Error classification

Status: done.

`wrapAsyncClientErrors` sent every adapter's errors through the SQLite classifier, so a pg `DatabaseError` (SQLSTATE on `.code`, e.g. `'23505'`) always came back `kind: 'unknown'`. Kind names were picked to line up with SQLSTATE, so the fix is a lookup:

| kind | SQLSTATE |
| --- | --- |
| `syntax` | 42601 `syntax_error` |
| `missing_table` | 42P01 `undefined_table` |
| `missing_column` | 42703 `undefined_column` |
| `unique_violation` | 23505 (primary keys too) |
| `not_null_violation` | 23502 |
| `foreign_key_violation` | 23503 |
| `check_violation` | 23514 |
| `transient` | 40001 `serialization_failure`, 40P01 `deadlock_detected`, 55P03 `lock_not_available` |

Anything else stays `'unknown'` (e.g. 22012 `division_by_zero`, or `ECONNREFUSED`).

Decisions (made without the user, review these):

- **`transient` = "retry the transaction and it'll likely work"**, like SQLite's BUSY/LOCKED: serialization failures, deadlocks, `nowait`/`lock_timeout` failures. Connection-level errors (class 08, 57P01, 53300) stay `unknown`; node-postgres mostly reports dropped connections without a SQLSTATE anyway.
- **Classifier picked by `client.system`.** The wrap helpers already read it, so `'postgresql'` gets the SQLSTATE lookup and the 12 SQLite adapters don't change.
- **Only the driver error's own `.code` is read.** No message fallback (pg server errors always carry a SQLSTATE) and no `.cause` digging.
- **No new kinds.** `tasks/complete/2026-04-22-error-taxonomy-v2.md` floated `permission_denied` (42501) for when pg landed. Left for later.

- [x] Spec in `packages/pg/test/`, every kind plus one `unknown` case, produced by real Postgres _`packages/pg/test/client-errors.test.ts`; 9 of 11 red before the fix_
- [x] Map SQLSTATE to `SqlfuError` kinds (always `'unknown'` today) _`classifyPostgresError` in `packages/sqlfu/src/errors.ts`; `mapSqliteDriverError` renamed `mapDriverError`_
- [x] Docs _dropped the Errors paragraph from Known gaps and added one line under Runtime in the Postgres guide; kind → SQLite / SQLSTATE table in `docs/errors.md`; same stale sentence fixed in `packages/sqlfu/README.md`_

Notes: both transient cases are real lock conflicts (`for update nowait` against a held row lock → 55P03; a repeatable-read write conflict → 40001). 40P01 isn't tested because deadlock detection waits `deadlock_timeout` (1s default). The `syntax` test passed before the fix only because the SQLite message fallback matched `syntax error at or near`; Postgres errors no longer go through it.

## Done when

- Each fixed item has a test against real Postgres.
- Known gaps in the Postgres guide only lists what's still broken.
- Matching "Step three" boxes in `pg.md` are ticked.
