---
status: complete
size: large
branch: compat-existing-tools
pr: https://github.com/iterate/sqlfu/pull/126
---

# Compatibility with existing database tools

## Status

Implementation is complete and verified in PR #126. The branch adds
driver-native `generate.runtime` targets for common SQLite runtimes, snapshots
their generated output, documents the production-import story, and adds a Kysely
recipe. Runtime validation composition remains intentionally out of scope.

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

- [x] Add config/runtime validation for native SQLite runtime targets. _Added
  `node:sqlite`, `better-sqlite3`, `bun:sqlite`, `libsql`, and `@libsql/client`
  to `SqlfuGenerateRuntime` and config shape validation._
- [x] Generate sync wrappers for `node:sqlite`, `better-sqlite3`, `bun:sqlite`,
  and native `libsql` that call the driver directly and do not import `sqlfu`.
  _Implemented the native renderer branch in `packages/sqlfu/src/typegen/index.ts`._
- [x] Generate async wrappers for `@libsql/client` that call the client directly
  and do not import `sqlfu`. _Generated wrappers call `client.execute(...)` and
  return promises._
- [x] Cover query shapes with tests: select, select-one, insert/update/delete
  without `returning`, DDL, named params, list expansion, object expansion, and
  JSON logical result decoding if it composes with native targets. _Runtime tests
  cover direct `node:sqlite` DDL, insert metadata, update metadata, list
  expansion, object expansion, and JSON result decoding; `@libsql/client` covers
  the async direct-driver path._
- [x] Add fixture snapshots showing the generated imports and runtime calls for
  each new target. _Added `fixtures/native-runtimes.md` and synced website
  examples._
- [x] Add a Kysely recipe explaining how to use sqlfu for schema/migration
  authoring and generated table types while Kysely owns ad-hoc query building.
  _Added `docs/integrations/kysely.md` and website sidebar/sync entries._
- [x] Document the production-import story: default generated wrappers import
  `sqlfu`, Effect/native runtime wrappers do not. _Documented in the README,
  typegen docs, Kysely recipe, and native runtime fixtures._
- [x] Update this task with implementation notes and move it to
  `tasks/complete/` when the PR is ready for review. _Moved for PR #126 after
  verification._

## Implementation Notes

- 2026-05-16: User framed this as "compat" broadly. I narrowed the first PR to
  driver-native `generate.runtime` targets plus Kysely docs, because that directly
  addresses the production-risk concern without trying to solve every ORM/query
  builder integration in one pass.
- 2026-05-16: Kept native runtime targets incompatible with `generate.validator`
  for now. Zod-only could be made to work, but standard-schema pretty errors
  currently use a sqlfu helper and broadening that would make this PR about two
  axes at once.
- 2026-05-16: The Kysely docs keep the Kysely table interface explicit because
  sqlfu's generated row type is a selected-row shape, while Kysely uses
  `Generated`, `Insertable`, and `Updateable` to model insert/update semantics.
