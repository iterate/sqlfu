The earlier draft/final migration refactor plan is obsolete.

Current direction:

- no `snapshot.sql`
- no draft/final migration lifecycle
- `definitions.sql` is the schema-authoring surface
- `sqlfu draft` creates a new migration file from replayed migrations vs `definitions.sql`
- `sqlfu migrate` applies migrations to a target database
- `sqlfu check` verifies replayed migrations match `definitions.sql`

Remaining high-priority work:

1. Add a migrations table so `migrate` applies only pending migrations.
2. Detect edited already-applied migrations and fail clearly.
3. Document the finalized-only workflow everywhere the old draft model still leaks.
