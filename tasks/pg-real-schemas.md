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

- [ ] Map SQLSTATE to `SqlfuError` kinds (always `'unknown'` today)

## Done when

- Each fixed item has a test against real Postgres.
- Known gaps in the Postgres guide only lists what's still broken.
- Matching "Step three" boxes in `pg.md` are ticked.
