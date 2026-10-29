---
status: done
size: medium
---

# pg typegen: same wrapper shapes as SQLite

Item two of "Step three" in `tasks/pg.md`. Found while verifying the Postgres guide (PR #156) against the docker-compose Postgres.

## Status summary

Done. pg wrappers match SQLite for every case in the table below, checked end to end by `packages/pg/test/generate-parity.test.ts`. Remaining dialect differences are listed under "Follow-ups" and in the Postgres guide's Known gaps.

## The problem

Same `definitions.sql` and `sql/queries.sql`, generated once with the default dialect and once with `pgDialect`:

| query | SQLite | Postgres today |
| --- | --- | --- |
| `select ... where slug = :slug limit 1` | `Promise<Result \| null>` | `Promise<Result[]>` |
| `select 1 as a` (no `from`) | `Promise<Result \| null>` | `Promise<Result[]>` |
| `select count(*) ... from posts` (aggregate, no `group by`) | `Promise<Result \| null>` | `Promise<Result[]>` |
| `insert/update/delete ... returning` | `Promise<Result>` via `client.all` | `client.run(...)`, no row type |
| `update posts set title = :title where slug = :slug` | `(client, data: {title}, params: {slug})` | `(client, params: {title, slug})` |
| `where slug = :slug` on `text not null` | `slug: string` | `slug: string \| null` |

The original report also said FROM-less selects get no columns. That's stale: it came from an old note in `tasks/complete/2026-05-07-pg-package.md`, and the temp-view pass in `packages/pg/src/impl/typegen.ts` fixed it (`primitives.md` fixture shows `select 1 as a` → `a: number`). The real FROM-less gap is the row-count shape above.

## Where the loss happens

The wrapper generator (`packages/sqlfu/src/typegen/index.ts`, `getResultMode`) is shared. It reads three descriptor fields that the pg analyzer gets wrong:

- `returning` — pg never sets it, so DML+RETURNING is treated as metadata-only (`client.run`).
- `multipleRowsResult` — pg sets `true` for every select and every RETURNING.
- `parameters[].notNull` — pg hard-codes `false`. sqlfu's `refineDescriptor` can only tighten (`field.notNull || column.notNull`) and only maps insert/set params to columns, so where-clause params stay nullable.

Plus `data` — SQLite splits update SET-clause params into a separate `data` argument; pg never fills it.

## Decisions (made without the user; review these)

- **Fix in the pg analyzer, not the shared generator.** The generator is right; the pg descriptor is wrong. New module `packages/pg/src/impl/query-shape.ts` reads the `pgsql-ast-parser` AST (already a dependency via vendored pgkit typegen) and returns `returning`, `multipleRowsResult`, param nullability, and the update `data` split.
- **Match SQLite's rules, including the questionable ones.** Parity means the generated code ports between dialects. Where SQLite's rule is wrong, the fix belongs in both dialects at once, so it's a follow-up, not a pg-only divergence:
  - DML+RETURNING is always single-row (`multipleRowsResult: false`), even `insert ... select ... returning` or multi-row `values`. Same as typesql's sqlite analyzer.
  - Params default to not-null. They become nullable only when a param is tested with `is null` / `is not null` / `is [not] distinct from`, or is inserted/set into a nullable column. `coalesce(:x, ...)` stays not-null, same as SQLite.
- **Single-row selects**: `limit 1`; no `from`; aggregate in the select list with no `group by`; or single table + top-level `and`-ed equalities that cover a unique index (PK or single/multi-column unique, no partial/expression indexes). The unique-key rule is a superset of SQLite's: typesql only spots it when the table has exactly one unique column (so `where slug = :slug` on a table with a PK *and* a unique slug is `Result[]` on SQLite). Doing it properly on pg and leaving SQLite's quirk as a follow-up beats copying the quirk.
- **Postgres-only trap: set-returning functions.** `select generate_series(1, 3)` has no `from` but returns 3 rows. Any select list calling a function with `pg_proc.proretset` stays multi-row (unless `limit 1`).
- **Update `data` split only when it's safe.** The generator emits args as `[...data, ...params]`, which must match `$1..$N`. Split only when every SET-clause param index comes before every other param index; otherwise keep everything in `params`.
- **If the AST parse fails**, keep today's conservative output (`Result[]` for selects, nullable params) instead of guessing. `returning` comes from "DML with result columns", which needs no parse.
- **Spec = parity test.** `packages/pg/test/generate-parity.test.ts` runs `sqlfu generate` on one project with SQLite and with `pgDialect`, and asserts the wrapper signatures and namespace types are identical, with an inline snapshot of the pg output so a reader sees the shape. Schemas stick to `integer`/`text` so the type mappings agree.

## Checklist

- [x] red parity spec, one test per case: `limit 1`, FROM-less, aggregate, insert/delete RETURNING, update RETURNING (data split), where-param nullability _`packages/pg/test/generate-parity.test.ts`; asserts the SQLite shape with an inline snapshot, then `pg` toEqual it_
- [x] `query-shape.ts` + wire into `analyzeOneQuery` _catalog facts (unique indexes, column nullability, aggregate + set-returning functions from `pg_proc`) load once per `analyzeQueries` call_
- [x] param nullability cases in the analyzer fixtures (`is null` escape hatch, nullable insert target) _new `packages/pg/test/fixtures/typegen/result-shape.md`_
- [x] regenerate analyzer fixtures whose param `notNull` changes _fixture output now also shows `multipleRowsResult`, plus `returning`/`data` when set_
- [x] SRF guard covered by a test _`set-returning-function-*` cases in `result-shape.md`_
- [x] tick step three item two in `tasks/pg.md`
- [x] update "Generated wrappers" under Known gaps in `packages/sqlfu/docs/guides/postgres.md` _old four bullets replaced with the remaining verified gaps; runtime example no longer destructures `findPostBySlug`_

## Follow-ups (not this PR)

- SQLite: unique-key single-row detection misses tables with more than one unique column.
- Both dialects: DML+RETURNING that can return many rows (`insert ... select`, multi-row `values`, `update`/`delete` without a unique `where`) is typed as one row. Related: `tasks/one-mode-throw-on-empty.md`.
- SQLite: a named param used twice (`:body ... or :body is null`) appears twice in `Params`.
- pg: DDL in a query file fails analysis (`syntax error at or near "create"`); SQLite emits a `client.run` wrapper.
- pg: `int8` (`count(*)`, `bigint`) is typed `bigint` and `numeric` is typed `number`, but `pg` returns both as strings by default. Either type them `string` or install type parsers in `createNodePostgresClient`.
- pg: `cast(...)` drops not-null in the vendored pgkit nullability pass (`isNonNullableField` in `packages/pg/src/vendor/typegen/query/column-info.ts`).

## Implementation notes

- Parity spec picks queries whose column types already agree between dialects. SQLite types `max/min/avg` as not-null and `sum(int)` as `number`; pg says nullable and `bigint`. Those are column-type differences, not wrapper shape, so the aggregate case uses `coalesce(max(id), 0)`.
- `returning` comes from "DML with result columns" rather than the AST, so it needs no extra parse and can't claim rows the column pass didn't find.
- Update `data` split: with named params, SET is the first clause so its params always get the lowest `$N`. Only hand-numbered `$N` (`set title = $2 where id = $1`) can make it unsafe; then everything stays in `params`.
- The fixture runner's `simplifyAnalysis` gained `multipleRowsResult`, `returning` and `data`, so every analyzer fixture now records the row shape.
