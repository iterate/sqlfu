---
status: done
size: small
---

# Classify Postgres errors by SQLSTATE

## Status summary

Done. Postgres errors get real kinds from their SQLSTATE; spec covers every kind against a real Postgres. Docs and `tasks/pg.md` updated. Nothing missing.

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
- **No new kinds.** `tasks/complete/2026-04-22-error-taxonomy-v2.md` floated adding `permission_denied` (42501) and splitting `transient` once pg landed. Left for later: this PR only maps onto the existing vocabulary.
- **Spec lives in `packages/pg/test/`**, next to `migration-lock.test.ts`, because that package has `pg` and the docker-compose Postgres in CI. Each kind is produced by a real Postgres, not a fake error object.

## Checklist

- [x] Failing spec in `packages/pg/test/` covering every kind above plus one `unknown` fallthrough _`packages/pg/test/client-errors.test.ts`; 9 of 11 red before the fix (`syntax` passed via the SQLite message fallback, `unknown` trivially)_
- [x] SQLSTATE classifier in `packages/sqlfu/src/errors.ts`, selected by `system` in `adapter-errors.ts` _`classifyPostgresError`; `mapSqliteDriverError` renamed `mapDriverError` since it now covers both_
- [x] Drop the "Errors" note from Known gaps in `packages/sqlfu/docs/guides/postgres.md` _also added one line under Runtime saying kinds work_
- [x] Update the Postgres sentence in `packages/sqlfu/docs/errors.md`; mention SQLSTATE in the kinds comments _added a kind → SQLite / SQLSTATE table instead of per-line comments; also fixed the same stale sentence in `packages/sqlfu/README.md`_
- [x] Tick the step-three error item in `tasks/pg.md`

## Implementation notes

- Both transient cases are reproduced for real: `select ... for update nowait` from a second pool connection while a transaction holds the row lock (55P03), and a repeatable-read transaction updating a row another connection changed after its snapshot (40001). Deadlock (40P01) isn't tested: it takes `deadlock_timeout` (1s by default) to fire.
- The `syntax` test passed before the fix only because the SQLite classifier's message fallback matched `syntax error at or near`. Postgres no longer goes through that fallback at all.
