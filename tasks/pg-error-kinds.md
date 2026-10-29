---
status: in-progress
size: small
---

# Classify Postgres errors by SQLSTATE

## Status summary

Spec only so far. Nothing implemented.

## Problem

`createNodePostgresClient` wraps every driver error in `SqlfuError`, but `kind` is always `'unknown'`. `wrapAsyncClientErrors` runs every adapter's errors through `mapSqliteDriverError`, which looks for SQLite result codes and messages. A pg `DatabaseError` has the SQLSTATE on `.code` (`'23505'`), which matches none of them.

Found while verifying the Postgres guide (PR #156) against a real Postgres: unique (23505), not-null (23502) and missing-table (42P01) errors all came back `kind: 'unknown'`, `system: 'postgresql'`.

## Plan

`SqlfuErrorKind` names were picked to line up with SQLSTATE names, so this is a lookup table.

| kind | SQLSTATE | condition name |
| --- | --- | --- |
| `syntax` | 42601 | `syntax_error` |
| `missing_table` | 42P01 | `undefined_table` |
| `missing_column` | 42703 | `undefined_column` |
| `unique_violation` | 23505 | `unique_violation` (primary keys too) |
| `not_null_violation` | 23502 | `not_null_violation` |
| `foreign_key_violation` | 23503 | `foreign_key_violation` |
| `check_violation` | 23514 | `check_violation` |
| `transient` | 40001, 40P01, 55P03 | `serialization_failure`, `deadlock_detected`, `lock_not_available` |

Anything else stays `'unknown'` (e.g. 22012 `division_by_zero`, or `ECONNREFUSED` from a refused connection).

Decisions (made without the user, review these):

- **`transient` = "retry the transaction and it'll likely work".** That's what SQLite's BUSY/LOCKED mean. The pg equivalents are serialization failures, deadlocks and `nowait`/`lock_timeout` lock failures. Connection-level errors (class 08, 57P01 `admin_shutdown`, 53300 `too_many_connections`) stay `unknown`: node-postgres mostly reports dropped connections as plain `Error`s without a SQLSTATE anyway, and retrying a statement on a dead connection isn't the same thing as retrying after lock contention.
- **Pick the classifier by `client.system`.** `wrapSyncClientErrors` / `wrapAsyncClientErrors` already read `system` off the client, so `'postgresql'` selects the SQLSTATE lookup and everything else keeps the SQLite classifier. No new parameter for the 12 SQLite adapters to pass.
- **Read only the driver error's own `.code`.** No message-substring fallback (pg server errors always carry a SQLSTATE) and no `.cause` digging (no known pg wrapper needs it).
- **Spec lives in `packages/pg/test/`**, next to `migration-lock.test.ts`, because that package has `pg` and the docker-compose Postgres in CI. Each kind is produced by a real Postgres, not a fake error object.

## Checklist

- [ ] Failing spec in `packages/pg/test/` covering every kind above plus one `unknown` fallthrough
- [ ] SQLSTATE classifier in `packages/sqlfu/src/errors.ts`, selected by `system` in `adapter-errors.ts`
- [ ] Drop the "Errors" note from Known gaps in `packages/sqlfu/docs/guides/postgres.md`
- [ ] Update the Postgres sentence in `packages/sqlfu/docs/errors.md`; mention SQLSTATE in the kinds comments
- [ ] Tick the step-three error item in `tasks/pg.md`
