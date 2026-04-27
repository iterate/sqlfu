---
name: using-sqlfu
description: Use when working in a project that uses sqlfu: a SQL-first toolkit with `sqlfu.config.ts`, `definitions.sql`, migrations, checked-in query files, generated TypeScript wrappers, and commands such as `sqlfu draft`, `sqlfu migrate`, `sqlfu generate`, `sqlfu check`, or `sqlfu goto`.
---

# Using sqlfu

`sqlfu` is a SQL-first data toolkit. If this skill triggered, treat the current project/package as using sqlfu for its database workflow: SQL is the authored source and TypeScript is generated from it.

## First read the config

Find the nearest `sqlfu.config.ts` for the project/package you are changing. It tells you where sqlfu's files live:

- `definitions`: desired schema SQL.
- `migrations`: ordered migration history, if the project uses migrations.
- `queries`: checked-in `.sql` query files.
- `db`: the database used by `migrate`, `check`, `sync`, `goto`, `baseline`, and the UI, if configured.
- `generate`: typegen options such as schema authority, runtime validators, sync wrappers, and import extension.

Paths are relative to the config file. Do not assume the defaults if the config says otherwise.

## Source files

- Edit `definitions.sql` or the configured `definitions` file when changing the desired schema.
- Do not hand-author a new migration file. Run `sqlfu draft`, then review and edit the drafted SQL if needed.
- Edit query `.sql` files under the configured `queries` directory. Generated wrappers live under `<queries>/.generated/`; do not edit them directly.

## Schema changes

When `migrations` is configured:

1. Update the configured `definitions` file.
2. Run `sqlfu draft`.
3. Review the new migration. Pay attention to renames, destructive changes, backfills, and SQLite table rebuilds.
4. Run `sqlfu migrate` for the configured dev database.
5. Run `sqlfu generate` if generated outputs may have changed.
6. Run `sqlfu check` before considering the schema work complete.

`sqlfu draft` derives a migration filename when no name is supplied. Only pass an explicit name when the user or repo convention calls for one.

When `migrations` is not configured, there is no migration history to draft. Update the configured `definitions` file and run the commands that still apply for the project, usually `sqlfu generate` and any repo tests.

## Query changes

1. Add or edit a `.sql` file under the configured `queries` directory.
2. Run `sqlfu generate`.
3. Import and call the generated wrapper from application code.

If generated TypeScript looks wrong, fix the SQL source or config first. The generated file is output, not the source of truth.

## Useful commands

- `sqlfu init`: create a new sqlfu project.
- `sqlfu config`: print the resolved project config.
- `sqlfu draft`: create a reviewable migration from the definitions-vs-migrations diff.
- `sqlfu migrate`: apply pending migrations to the configured database.
- `sqlfu pending`: list unapplied migration files.
- `sqlfu applied`: list migrations recorded in the database.
- `sqlfu goto <target>`: move the database schema and migration history to a target migration.
- `sqlfu baseline <target>`: update migration history to a target without changing live schema.
- `sqlfu sync`: push the desired schema directly to the live database; use for local development only.
- `sqlfu generate`: regenerate TypeScript outputs from checked-in query files.
- `sqlfu check`: verify the repo and configured database agree, and report recommended next actions.
- `sqlfu` or `sqlfu serve`: start the local backend for `https://sqlfu.dev/ui`.

Use the project's normal command runner for these commands, such as a package script, `pnpm sqlfu ...`, `npx sqlfu ...`, or a local/global `sqlfu` binary already available in the environment.
