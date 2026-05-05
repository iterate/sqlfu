---
status: ready
size: small
---

# SQL runner named-parameter binding repro

## Status

Ready as a small bug task. This PR now records the current repro only. The
original demo-mode `:name` failure was mostly absorbed by the shared
`client.prepare()` / sqlite-wasm adapter path on `main`; the remaining visible
demo bug is for bare UI form params against SQL placeholders written with
`@name` or `$name`.

## What's broken

In demo mode (`?demo=1`), SQL runner queries that use `@name` or `$name`
placeholders generate a form field keyed by the bare identifier, but the
sqlite-wasm adapter binds that bare key as `:name`. sqlite-wasm then rejects the
bind because the statement parameter is `@name` or `$name`, not `:name`.

```
SqlfuError: Invalid bind() parameter name: :limitt
```

## UI Repro

1. Run `pnpm demo`.
2. Open the SQL runner in the browser at `?demo=1`.
3. Enter:

   ```sql
   select name, type
   from sqlite_schema
   where name not like 'sqlite_%'
   limit @limitt;
   ```

4. Fill the generated `limitt` params field with `2`.
5. Click **Run SQL**.

Expected: two rows.

Actual: demo mode reports `Invalid bind() parameter name: :limitt`.

The same repro works with `$limitt`. On current `main`, `:limitt` should work.

## Why

The UI detects all three SQLite named-parameter prefixes with
`detectNamedParameters` and strips the prefix when building the params form, so
`:limitt`, `@limitt`, and `$limitt` all submit params as `{limitt: ...}`.

The sqlite-wasm adapter currently translates any unprefixed params key to the
colon form before calling sqlite-wasm. That is enough for SQL written as
`:limitt`, but it is wrong for SQL written as `@limitt` or `$limitt`.

SQLite stores parameter names with their prefix character included; see
https://www.sqlite.org/c3ref/bind_parameter_name.html.

## What "supported" means (the contract to document)

SQLite accepts three named-parameter prefixes (https://www.sqlite.org/lang_expr.html#varparam):

- `:name`
- `@name`
- `$name` (plus Tcl-ish `::`/`(...)` suffixes — we don't promise those)

Plus positional `?` / `?NNN`.

sqlfu's public contract, confirmed by this task:

1. **Supported in SQL**: `:name`, `@name`, `$name`. All three.
2. **Supported in the params object**: keys are the **bare identifier**
   (no prefix). This matches the RJSF form-field names the UI generates and
   is what users have in their heads.
3. **Positional `?` params**: bind via an array value passed as `params`.
4. **Mixed named+positional**: undefined / unsupported (matches SQLite's own
   guidance — "best to avoid mixing named and numbered parameters"). Not our
   job to error; we just don't guarantee behavior.
5. **The host adapter's job** is to translate (1) + (2) into whatever the
   underlying driver needs.

## Plan

- [x] Update this task with the current UI repro. _Captured the `@limitt` /
  `$limitt` demo-mode repro that remains on current `main`._
- [ ] Replace the stale `packages/ui/src/demo/browser-host.test.ts` coverage
  with a test that exercises the real adapter or host path. The current direct
  raw `db.exec({bind: {limitt: 2}})` assertion fails by design and no longer
  tests the app path.
- [ ] Fix `packages/sqlfu/src/adapters/sqlite-wasm.ts` so bare named params
  bind correctly for `:name`, `@name`, and `$name`. The implementation needs to
  preserve already-prefixed keys and array params.
- [ ] Add or update docs/JSDoc for the params contract if this bug fix becomes
  the place where we formalize it.

## Non-goals

- Warning/erroring on mixed named+positional usage.
- Accepting already-prefixed keys from the UI (the UI uses bare keys; the
  forgiveness in the host is for programmatic callers, not a feature).
- Changing the live/node-host path. It works; don't touch it.
- `?NNN` explicit numbering. The UI doesn't expose it; if users type it
  directly into the SQL runner it'll just work via node:sqlite and probably
  via sqlite-wasm too — out of scope to audit.

## Implementation Notes

- 2026-05-05: Re-checked PR #43 against `main`. The PR only carries this task
  file. `packages/ui/src/demo/browser-host.ts` now calls `client.prepare()`,
  and the sqlite-wasm adapter prefixes bare keys as `:name`, so `:limitt` is no
  longer the current repro. `@limitt` and `$limitt` still fail because the
  adapter guesses the colon prefix.
