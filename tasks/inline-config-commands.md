---
status: in-progress
size: medium
base: inline-config-docs (stacked on #148)
---

# Inline configs: support migrate/check (and friends) plus optional `db`

## Status summary

Spec written, implementation not started. The goal is command parity between
inline and file-backed configs: `sqlfu migrate`, `sqlfu check`, `sync`,
`pending`, `applied`, `find`, `goto`, `baseline` should work on inline
defineConfig projects, and inline configs should accept the same optional
`db` (path or factory) that file-backed configs do. The Admin UI backend
stays file-backed-only for now.

## Why

Inline configs are now the default onboarding shape (#148), but most CLI
commands throw `This command requires a file-backed sqlfu config`. The SQL is
fully available statically (definitions template + migration entries), and
`openDb` already falls back to `<projectRoot>/.sqlfu/app.db` when a config has
no `db`. There is no fundamental blocker - only the missing plumbing from an
inline module to a `SqlfuContext`.

## Design

`loadContextConfig` (api/internal.ts) stops throwing for inline projects and
instead resolves them into a full `SqlfuContext`:

- Synthesize a `SqlfuProjectConfig` for the inline source: `projectRoot`,
  default `generate` settings, default `dialect`, `db` resolved as below.
- Extend `SqlfuContext` with an optional `inline` field carrying the
  statically-parsed repo inputs: `{definitionsSql: string, migrations: Migration[]}`
  (via `inlineMigrationsToMigrationFiles`).
- The two repo-input seams check it:
  - `readDefinitionsSql(context)` returns `context.inline.definitionsSql`
    instead of reading `definitions.sql` from disk.
  - `readMigrationsFromContext(context)` returns `context.inline.migrations`
    instead of reading `config.migrations.path`.
- Everything else (applyMigrateSql, analyzeDatabase, applySyncSql, goto,
  baseline, materialize*) already only consumes `context.config` +
  `context.host`, so it works unchanged.

### Optional inline `db`

- `InlineConfigDefinition` gains `db?: string | SqlfuDbFactory` - inert at
  runtime (binding still happens via `dbConfig(client)`), carried on
  `factory.config` like the rest of the definition.
- The static parser records whether the defineConfig object has a `db`
  property (`InlineConfigSource.hasDb`). Unknown property values are already
  tolerated by `parseObjectProperties`.
- Only when `hasDb` is true does the CLI dynamically import the module to
  read the actual value (same import mechanism as file-backed configs). This
  preserves the Durable Objects story: inline modules importing
  `cloudflare:workers` etc. are never imported by the CLI unless they opted
  into a CLI-visible `db`.
- The imported value is located from the module's exports using the source's
  parsed target (default export / named export / class static). A `db` on a
  non-exported config is a clear error telling the user to export it.
- No `db` property -> synthesized config leaves `db` undefined -> `openDb`
  falls back to `.sqlfu/app.db`, matching file-backed behavior.

### Scope limits

- Modules with **multiple** inline defineConfig calls (e.g. several class
  statics): `generate`/`draft` keep working per-source; the db-touching
  commands error with a clear message for now. Multi-source modules are the
  runtime-managed (Durable Object) case where CLI migrate does not apply.
- The Admin UI backend (`sqlfu serve` / `assertServableProject`) still
  requires file-backed configs; error message updated to say that, not
  "supports generate and draft only".
- `draft` and `generate` keep their dedicated inline implementations
  (appendInlineMigration / writeInlineQueryTypes); the api/core.ts paths must
  keep routing inline projects to them rather than the file-backed
  implementations.

## Checklist

- [ ] static parser records `hasDb` on `InlineConfigSource`
- [ ] `InlineConfigDefinition.db?` runtime type + carried on `factory.config`
- [ ] inline context resolution in `loadContextConfig` (synthesized config +
      `context.inline` repo inputs + db import when `hasDb`)
- [ ] `readDefinitionsSql` / `readMigrationsFromContext` inline seams
- [ ] `sqlfu migrate` applies inline migration entries (default scratch db +
      explicit db factory) and records history
- [ ] `sqlfu check` works: `migrationsMatchDefinitions` (repo-only) and
      `check.all` (db-backed) for inline projects
- [ ] `sync`/`pending`/`applied`/`find`/`goto`/`baseline` work via the same
      context (spot-test pending + sync)
- [ ] api/core.ts draft/generate still route inline projects to the inline
      implementations
- [ ] multi-source inline modules produce a clear error for db commands
- [ ] UI serve guard message updated
- [ ] docs: cli.md / README command-split section updated; turso guide gets
      its (now legitimate) `db` factory example back
