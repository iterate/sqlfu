# CLI

The sqlfu CLI is the project control surface. It reads `sqlfu.config.ts`, works
against the SQL files in your repo, and starts the local backend used by the
hosted Admin UI.

Most commands can be run through `npx`:

```sh
npx sqlfu check
```

If sqlfu is installed in your project, package-manager exec commands work too:

```sh
pnpm exec sqlfu migrate
```

## Common commands

### `npx sqlfu`

Start the local backend for the hosted Admin UI.

```sh
npx sqlfu
```

The command prints `sqlfu ready at https://sqlfu.dev/ui`. The UI shell is hosted,
but the database backend stays on your machine.

### `npx sqlfu check`

Report the important repo and database mismatches:

- `definitions.sql` not matching replayed migrations
- pending migrations
- applied migrations that no longer match the repo
- live schema drift

This is the safest command to run when you are not sure what the next migration
command should be.

### `npx sqlfu draft`

Create a migration file from the difference between replayed migrations and
`definitions.sql`.

```sh
npx sqlfu draft
```

sqlfu shows the drafted SQL before writing the file. The diff is best-effort:
review the generated migration the same way you would review a hand-written one.

### `npx sqlfu migrate`

Apply pending migrations to the configured database.

```sh
npx sqlfu migrate
```

Migrations run in filename order and are recorded in the migration-history table
configured for your project.

### `npx sqlfu generate`

Generate TypeScript wrappers and query metadata from checked-in `.sql` files.

```sh
npx sqlfu generate
```

By default, type generation reads `definitions.sql`, so it does not need a live
database. Change `generate.authority` when generated types should follow
replayed migrations, migration history, or live schema instead.

### `npx sqlfu format`

Rewrite `.sql` files with sqlfu's formatter.

```sh
npx sqlfu format "sql/**/*.sql" definitions.sql
```

The command accepts file paths, directories, and simple glob patterns.

### `npx sqlfu sync`

Update the live database directly from `definitions.sql`.

```sh
npx sqlfu sync
```

This is a local-development tool. Production databases should normally move by
reviewed migrations and `npx sqlfu migrate`.

## History tools

### `npx sqlfu pending`

List migration files that have not been applied to the configured database.

### `npx sqlfu applied`

List migrations recorded in the configured database.

### `npx sqlfu find <target>`

Resolve a migration target by name or prefix.

### `npx sqlfu goto <target>`

Move both live schema and migration history to an exact target migration.

### `npx sqlfu baseline <target>`

Rewrite migration history to an exact target without changing live schema.

## Project tools

### `npx sqlfu init`

Create a starting `sqlfu.config.ts` and ignore `.sqlfu/` local artifacts.

### `npx sqlfu kill`

Stop the local sqlfu backend process on the default port.

### `npx sqlfu config`

Print the resolved project config. This is mostly useful while debugging config
loading.
