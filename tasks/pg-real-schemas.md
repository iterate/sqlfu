---
status: in-progress
size: large
---

# Make Postgres work on real schemas

Status: just started. Three sessions work in parallel on this one branch, each owning one section below. Stacked on #156 (`pg-docs`).

Covers the first three items of "Step three" in [pg.md](./pg.md). The guide's "Known gaps" (`packages/sqlfu/docs/guides/postgres.md`) lists the user-facing symptoms and should shrink to whatever is left when this lands.

Each section's owner fleshes out its own spec in its first commit and only edits its own section, its own Known gaps rows, and its own `pg.md` checkbox.

## Schema renderer

Owner: "Fix Postgres schema renderer for real schemas" session.

`renderCanonicalSchema` in `packages/pg/src/impl/schema.ts` drops or mangles these, so `draft`/`check`/`generate` break:

- [ ] `serial` / `bigserial` (`relation "t_id_seq" does not exist`)
- [ ] identity columns (spurious `add generated always as identity` in every later draft)
- [ ] enums, domains (`type does not exist`)
- [ ] stored generated columns
- [ ] functions, triggers, materialized views, extensions, non-`public` schemas (redrafted every time)

## Typegen parity

Owner: "Match Postgres typegen output to SQLite" session.

- [ ] `limit 1` returns `Result | null`, not an array
- [ ] `insert/update/delete ... returning` wrappers return rows
- [ ] `where col = :param` params aren't typed nullable
- [ ] FROM-less selects (`select 1 as a`) get result columns

## Error classification

Owner: "Classify Postgres errors into SqlfuError kinds" session.

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
