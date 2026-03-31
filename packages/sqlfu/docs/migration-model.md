# sqlfu Migration Model

This document captures the current design direction for `sqlfu`'s migration system.

## Persistent States

`sqlfu` cares about five persistent states:

1. `definitions.sql`
   - The desired schema.
   - This is the thing we want the world to converge to.

2. The actual database
   - The real SQLite database file or runtime database.
   - It may be drifted, partially migrated, hand-edited, or otherwise incorrect.

3. Final migration files
   - The historical recipe we expect durable environments to apply.
   - These are immutable once finalized.

4. `snapshot.sql`
   - A committed snapshot of what replaying all final migrations should produce.
   - This is the finalized migration baseline.

5. The draft migration
   - At most one mutable migration.
   - This bridges finalized history to the current desired schema.

There is also one important non-persistent state:

- Ephemeral materialized snapshots
  - Temporary SQLite databases used during diffing, replay, and consistency checks.

## Command Semantics

### `sqlfu sync`

- Directly make the target database match `definitions.sql`.
- Good for local development, tests, and ephemeral databases.
- Does not mutate migrations.
- Does not mutate `snapshot.sql`.

### `sqlfu migrate`

- Apply finalized migrations to the target database.
- Fails if a draft migration exists, unless explicitly overridden.
- Good for production and durable shared environments.
- May refresh `snapshot.sql` after finalized history changes.

### `sqlfu draft`

- Create or update the single draft migration.
- Diffs the finalized migration baseline against `definitions.sql`.
- Does not depend on the actual database being clean.
- Does not mutate `snapshot.sql`.

## Baseline Rules

`snapshot.sql` represents finalized history only.

That means:

- `snapshot.sql` changes when finalized migration history changes.
- `snapshot.sql` does not change when the draft changes.
- `snapshot.sql` does not change when `sqlfu sync` updates a local database directly.

The draft should always be computed from:

- replayed final migrations, or `snapshot.sql`
- compared against `definitions.sql`

The draft should not be computed from:

- whatever the current local database happens to look like

## Divergence Rules

Some mismatches are acceptable.

Allowed:

- The actual database differs from `definitions.sql` during local development.
- `definitions.sql` differs from finalized migrations while a draft exists.

Not allowed:

- Final migrations differ from `snapshot.sql`.
- In strict CI, `definitions.sql` differs from finalized migrations plus the draft.
- In migration mode, the database differs from finalized migrations after `sqlfu migrate`.

## Typical Resolution Steps

### `definitions.sql` differs from finalized migrations, and no draft exists

- Run `sqlfu draft`.

### `definitions.sql` differs from finalized migrations, and a draft already exists

- Run `sqlfu draft` again to update the draft in place.

### `snapshot.sql` differs from replayed finalized migrations

- Refresh `snapshot.sql` from finalized history.

### The actual database differs from `definitions.sql` in local development

- Run `sqlfu sync`.

### The actual database differs from finalized migrations in migration mode

- If the difference is just pending migrations, run `sqlfu migrate`.
- If the database has drifted outside migration history, stop and inspect.

## Checks

`sqlfu check` should report multiple relationships, not just one boolean:

- desired schema vs finalized migrations plus draft
- finalized migrations vs `snapshot.sql`
- actual database vs desired schema in sync mode
- actual database vs finalized migrations in migration mode

This can be one command with a structured report, or multiple targeted subcommands.

## Non-Goals

- Down migrations are not supported.
- Multiple drafts are not supported.
- Git-based draft heuristics are not core behavior.

## Extension Points

The default draft policy should be explicit metadata, but `sqlfu` should allow a callback:

- `migration.status() => 'draft' | 'final'`

That keeps the default predictable while still allowing custom git-aware or branch-aware behavior.
