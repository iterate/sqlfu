# sqlfu

`sqlfu` is a SQLite-first toolkit for projects that want:

- `definitions.sql` as the schema source of truth
- checked-in `.sql` files for queries
- generated TypeScript wrappers next to those queries
- schema diffing and apply flows from a small CLI

It is built around `@libsql/client`, `typesql-cli`, and `sqlite3def`.

## Install

```sh
npm install sqlfu
```

`sqlfu` currently supports macOS and Linux.

## Project Layout

The default layout is:

```txt
.
├── definitions.sql
├── sql/
│   ├── some-query.sql
│   └── some-query.ts
└── sqlfu.config.ts
```

You can keep the defaults or point `sqlfu` somewhere else with `sqlfu.config.ts`.

## Config

Create `sqlfu.config.ts` in your project root:

```ts
import {defineConfig} from 'sqlfu';

export default defineConfig({
  dbPath: './db/app.sqlite',
  definitionsPath: './definitions.sql',
  sqlDir: './sql',
});
```

Useful config fields:

- `dbPath`: default database path for `sqlfu migrate ...`
- `definitionsPath`: schema source of truth
- `sqlDir`: directory containing checked-in `.sql` queries
- `tempDir`: working directory for downloaded binaries and generated temp databases
- `tempDbPath`: schema-materialized database used during `sqlfu generate`
- `typesqlConfigPath`: generated TypeSQL config path
- `sqlite3defBinaryPath`: custom `sqlite3def` binary location
- `sqlite3defVersion`: `sqlite3def` release to auto-download

## Commands

Generate query wrappers from your schema and `.sql` files:

```sh
sqlfu generate
```

Inspect schema drift against your configured database:

```sh
sqlfu migrate diff
```

Apply `definitions.sql` to your configured database:

```sh
sqlfu migrate apply
```

Fail if schema drift exists:

```sh
sqlfu migrate check
```

Export the live schema from your configured database:

```sh
sqlfu migrate export
```

If you need to override config for one command, flags still work:

```sh
sqlfu migrate diff --db-path ./tmp/scratch.db
sqlfu generate --sql-dir ./src/sql
```

## What `generate` Does

`sqlfu generate`:

1. materializes `definitions.sql` into a temporary SQLite database
2. writes `typesql.json`
3. runs `typesql compile`
4. refines generated result types for some SQLite cases that TypeSQL currently misses

Generated TypeSQL outputs stay next to your `.sql` files.

## Notes

- `definitions.sql` remains the schema source of truth
- `sqlfu` auto-downloads `sqlite3def` for macOS and Linux into `.sqlfu/`
- SQLite view typing is still imperfect in TypeSQL, and some expressions such as `substr(...)` are not inferred directly, so `sqlfu` applies a small post-pass to improve generated result types without changing the SQL-first workflow
