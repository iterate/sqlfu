---
name: using-sqlfu
description: Use when working in a project that uses sqlfu: a SQL-first toolkit configured by `sqlfu.config.ts`, either inline (`defineConfig` with `sql` templates for definitions, migrations, and queries) or split out into `definitions.sql`, migration files, checked-in query files, and generated TypeScript wrappers; commands such as `sqlfu draft`, `sqlfu migrate`, `sqlfu generate`, `sqlfu check`, or `sqlfu goto`.
---

# Using sqlfu

`sqlfu` is a SQL-first data toolkit. If this skill triggered, treat the current project/package as using sqlfu for its database workflow: SQL is the authored source and TypeScript types are generated from it.

## First read the config

Find the nearest `sqlfu.config.ts` for the project/package you are changing. It comes in one of two shapes.

**Inline** (what `sqlfu init` creates): one module holds the project as `sql` templates.

- ``definitions: sql`...` ``: desired schema.
- ``migrations: [{name, content: sql`...`}]``: ordered migration history, appended by `sqlfu draft`.
- ``queries: {listPosts: sql`...`}``: each key is a query's name.
- `db` (optional): the database used by CLI commands. Without it they use `.sqlfu/app.db`.

**File-backed** (split out): the config points at files.

- `definitions`: desired schema SQL file.
- `migrations`: migration directory, if the project uses migrations.
- `queries`: directory of checked-in `.sql` query files.
- `db`: the database used by `migrate`, `check`, `sync`, `goto`, `baseline`, and the UI, if configured.
- `generate`: typegen options such as schema authority, runtime validators, sync wrappers, and import extension.

Paths are relative to the config file. Do not assume the defaults if the config says otherwise.

## Source files

- Inline: edit the `definitions` template and the `queries` entries. `sqlfu generate` rewrites each query's tag to carry its types (`sql.many<{parameters: ...; result: ...}>`); do not hand-edit those type arguments. Inline query templates cannot use `${...}` interpolations.
- File-backed: edit the configured `definitions` file and the `.sql` files under `queries`. Generated wrappers live under `<queries>/.generated/`; do not edit them directly.
- In both shapes, do not hand-author a new migration. Run `sqlfu draft`, then review and edit the drafted SQL if needed.

## Schema changes

1. Update the desired schema (`definitions`).
2. Run `sqlfu draft`. Inline configs get a new `migrations` entry in the module; file-backed configs get a new file in the `migrations` directory.
3. Review the new migration. Pay attention to renames, destructive changes, backfills, and SQLite table rebuilds.
4. Run `sqlfu migrate` for the dev database.
5. Run `sqlfu generate` if generated types may have changed.
6. Run `sqlfu check` before considering the schema work complete.

`sqlfu draft` derives a migration name when none is supplied. Only pass an explicit name when the user or repo convention calls for one.

Runtime-managed databases (Durable Objects, per-user SQLite) apply migrations in app code with `db.migrate()`, so skip step 4 there. Do not add `db` to an inline config that only runs in another runtime (for example one importing `cloudflare:workers`): declaring `db` makes the CLI import the module.

A file-backed config without `migrations` has no history to draft. Update the `definitions` file and run the commands that still apply, usually `sqlfu generate` and any repo tests.

## Query changes

1. Add or edit a query: an entry in inline `queries`, or a `.sql` file under the configured `queries` directory. For a small file-backed query set, put several queries in one `queries.sql` with a `/** @name listPosts */` comment before each.
2. Run `sqlfu generate`.
3. Call it from application code: inline queries through the bound config (`const db = dbConfig(client); db.listPosts({limit: 10})`), file-backed queries through the generated wrapper import.

Inline row-returning queries can shape results with `.map((row) => ...)` after the template.

If generated TypeScript looks wrong, fix the SQL source or config first. Generated types are output, not the source of truth.

## Runtime clients

Pick the adapter for the runtime the app actually runs in: `createNodeSqliteClient` for `node:sqlite`, `createBunClient` for `bun:sqlite`, and so on. https://sqlfu.dev/docs/adapters lists them all.

## Useful commands

- `sqlfu init`: create a new sqlfu project (inline config).
- `sqlfu config`: print the resolved project config.
- `sqlfu draft`: create a reviewable migration from the definitions-vs-migrations diff.
- `sqlfu migrate`: apply pending migrations to the configured database.
- `sqlfu pending`: list unapplied migrations.
- `sqlfu applied`: list migrations recorded in the database.
- `sqlfu goto <target>`: move the database schema and migration history to a target migration.
- `sqlfu baseline <target>`: update migration history to a target without changing live schema.
- `sqlfu sync`: push the desired schema directly to the live database; use for local development only.
- `sqlfu generate`: regenerate TypeScript types from inline queries or checked-in query files.
- `sqlfu check`: verify the repo and configured database agree, and report recommended next actions.
- `sqlfu` or `sqlfu serve`: start the local backend for `https://sqlfu.dev/ui` (file-backed configs only).

Use the project's normal command runner for these commands, such as a package script, `pnpm sqlfu ...`, `npx sqlfu ...`, or a local/global `sqlfu` binary already available in the environment. Install the published `sqlfu` package from npm unless the user explicitly asks you to test a local checkout.
