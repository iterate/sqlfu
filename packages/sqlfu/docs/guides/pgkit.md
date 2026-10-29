# Coming from pgkit

[pgkit](https://github.com/mmkal/pgkit) is sqlfu's Postgres-only predecessor,
by the same author. Most of sqlfu's ideas were tried there first, and
`@sqlfu/pg` builds on vendored copies of pgkit's `schemainspect`, `migra` and
`typegen` code.

sqlfu is not a drop-in replacement. The ideas carry over; the files, config and
migration history don't. Use sqlfu for new Postgres projects. Moving an
existing pgkit project over is not a supported path yet.

## Package by package

| pgkit | sqlfu | Difference |
| --- | --- | --- |
| `@pgkit/client` | `createNodePostgresClient()` + generated wrappers | pgkit's client is a slonik-style `sql` tag API. sqlfu's client is a thin adapter over `pg`, mostly called through generated wrappers. |
| `@pgkit/typegen` | `sqlfu generate` | pgkit types `sql` tags inline in `.ts` files. sqlfu types `.sql` files and generates wrappers next to them. |
| `@pgkit/migrator` | `sqlfu draft`, `migrate`, `check`, `goto`, `baseline`, `sync` | Same `definitions.sql` + diff model. Different history table (see below). |
| `@pgkit/migra`, `@pgkit/schemainspect` | inside `@sqlfu/pg` | Vendored, not exported. Schema/extension filter options aren't wired up. |
| `@pgkit/admin` | `sqlfu serve` ([Admin UI](../../../ui/README.md)) | sqlfu's UI also shows migrations, drift and generated queries. |
| none | `sqlfu format`, lint plugin | New in sqlfu. |

## Migrator commands

| pgkit migrator | sqlfu |
| --- | --- |
| `up` | `sqlfu migrate` |
| `create` | `sqlfu draft` (writes the diff from `definitions.sql`) |
| `list`, `latest` | `sqlfu pending`, `sqlfu applied`, `sqlfu find` |
| `check` | `sqlfu check` |
| `goto` | `sqlfu goto` |
| `baseline` | `sqlfu baseline` |
| `definitions updateDb` | `sqlfu sync` |
| `definitions updateFile`, `rebase`, `repair`, `wipe`, `sql` | no equivalent yet |
| `unlock` | not needed: sqlfu's advisory lock is released when its transaction ends |

## What doesn't carry over

- **Migration history.** pgkit records migrations in its own table (`migrations`
  by default). sqlfu uses `sqlfu_migrations` and doesn't read pgkit's. To adopt
  sqlfu on a database pgkit already migrated, start a fresh migration
  history and use `sqlfu baseline` to mark it as applied.
- **Inline queries.** Queries written as `sql` tags in `.ts` files need to move
  into `.sql` files before `sqlfu generate` will type them.

## Read next

- [Postgres](./postgres.md) to set up a Postgres project.
- [SQL migrations](../migration-model.md) for sqlfu's migration model.
