---
status: in-progress
size: large
branch: compat-existing-tools
---

# Compatibility with existing database tools

## Status

Spec is fleshed out and implementation is starting. The main bet is to make
`sqlfu generate` able to emit driver-native query wrappers for common SQLite
runtimes, so application production code does not need to import `sqlfu`. The
Kysely part should start as a recipe unless implementation exposes a small,
obvious generated-type improvement.

## Goal

Make sqlfu friendlier to projects that already chose a database runtime or query
builder. sqlfu should be useful for SQL-first schema authoring, migrations, and
generated query wrappers without forcing a pre-alpha `sqlfu` runtime import into
production code.

## Assumptions

- `generate.runtime` is the right config axis. It already separates sqlfu's
  default client wrappers from Effect SQL wrappers.
- The first native targets should cover the SQLite drivers users are most likely
  to already have in production: `node:sqlite`, `better-sqlite3`, `bun:sqlite`,
  `libsql`, and `@libsql/client`.
- Native generated wrappers should keep the existing generated static surface:
  namespace `Params` / `Result` / `Data`, `sql`, and `query`.
- Runtime validation can remain scoped to the default `sqlfu` runtime for this
  pass unless the direct-driver path composes cleanly without broadening the
  change too much.
- Kysely compatibility is mainly documentation: sqlfu can own schema/migrations
  and table/query type generation while Kysely remains the app's query builder.
  If Kysely needs a small generated DB interface to be ergonomic, add it only if
  it stays tightly scoped.

## Checklist

- [ ] Add config/runtime validation for native SQLite runtime targets.
- [ ] Generate sync wrappers for `node:sqlite`, `better-sqlite3`, `bun:sqlite`,
  and native `libsql` that call the driver directly and do not import `sqlfu`.
- [ ] Generate async wrappers for `@libsql/client` that call the client directly
  and do not import `sqlfu`.
- [ ] Cover query shapes with tests: select, select-one, insert/update/delete
  without `returning`, DDL, named params, list expansion, object expansion, and
  JSON logical result decoding if it composes with native targets.
- [ ] Add fixture snapshots showing the generated imports and runtime calls for
  each new target.
- [ ] Add a Kysely recipe explaining how to use sqlfu for schema/migration
  authoring and generated table types while Kysely owns ad-hoc query building.
- [ ] Document the production-import story: default generated wrappers import
  `sqlfu`, Effect/native runtime wrappers do not.
- [ ] Update this task with implementation notes and move it to
  `tasks/complete/` when the PR is ready for review.

## Implementation Notes

- 2026-05-16: User framed this as "compat" broadly. I narrowed the first PR to
  driver-native `generate.runtime` targets plus Kysely docs, because that directly
  addresses the production-risk concern without trying to solve every ORM/query
  builder integration in one pass.
