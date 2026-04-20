---
status: ready
size: medium
---

# Adopt api-extractor for the public type surface

## Status (for humans skimming)

Fleshed-out plan. Implementation in progress on branch `api-extractor`. Success criteria unchanged from the original task; this pass adds concrete decisions about config layout, output file locations, how the CLI entry is handled, and the exact script ordering.

Currently `pnpm build` emits 73 `.d.ts` files totalling ~680 kB across `dist/` (60 outside `dist/vendor/`). Every public entry (`index`, `browser`, `client`, `api`, `cli`, `ui/index`, `ui/browser`) has its declarations spread across dozens of per-file `.d.ts` modules that cross-import each other. Two motivations for rolling these through api-extractor:

1. **Bundle size**: collapsing into one `.d.ts` per entry and deleting the unreferenced per-file declarations should cut a measurable chunk of the tarball.
2. **API reports** (the real win): api-extractor can emit a human-reviewable summary of every exported symbol. Checked into the repo, it turns accidental breaking changes into visible diffs in PR review. In a pre-pre-pre-alpha lib where we're still willing to delete stuff aggressively, this lets us do that *deliberately* rather than by accident.

## Plan

### Directory layout

```
packages/sqlfu/
  etc/
    api-extractor/
      base.json          # shared config fragment, extended by each entry config
      index.json
      browser.json
      client.json
      api.json
      ui-index.json
      ui-browser.json
    api-reports/
      index.api.md       # committed, diffed in PRs
      browser.api.md
      client.api.md
      api.api.md
      ui-index.api.md
      ui-browser.api.md
  scripts/
    bundle-types.ts      # new - drives api-extractor across all entries
```

No config for `cli`: it's a bin script with nothing to import. See "CLI entry" below.

### `etc/api-extractor/base.json`

```jsonc
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "projectFolder": "../..",                    // packages/sqlfu
  "compiler": {
    "tsconfigFilePath": "<projectFolder>/tsconfig.build.json"
  },
  "apiReport": {
    "enabled": true,
    "reportFolder": "<projectFolder>/etc/api-reports/",
    "reportTempFolder": "<projectFolder>/etc/api-reports/temp/",
    "includeForgottenExports": true
  },
  "docModel": { "enabled": false },
  "dtsRollup": {
    "enabled": true
    // publicTrimmedFilePath set per-entry
  },
  "tsdocMetadata": { "enabled": false },
  "messages": {
    "extractorMessageReporting": {
      "default": { "logLevel": "warning" },
      "ae-forgotten-export": { "logLevel": "warning", "addToApiReportFile": true },
      "ae-internal-missing-underscore": { "logLevel": "none" }
    }
  }
}
```

Per-entry configs set only `mainEntryPointFilePath`, the report file name, and the rollup output path. Example `etc/api-extractor/index.json`:

```jsonc
{
  "extends": "./base.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  "apiReport": { "reportFileName": "index.api.md" },
  "dtsRollup": {
    "publicTrimmedFilePath": "<projectFolder>/dist/index.bundled.d.ts"
  }
}
```

Rolled-up files land at `dist/<entry>.bundled.d.ts` (`dist/ui/index.bundled.d.ts` for nested). After all entries run, `scripts/bundle-types.ts` moves `dist/<entry>.bundled.d.ts` to `dist/<entry>.d.ts` (overwriting the raw one from tsgo). Then it walks `dist/` and deletes every `.d.ts` / `.d.ts.map` that isn't one of the 6 kept entries. This matches the explicit, exhaustive deletion style of `bundle-vendor.ts`.

The emitted paths stay as `dist/<entry>.d.ts` so `publishConfig.exports[].types` stays as it is today. (Only the `./cli` entry changes - see below.)

### CLI entry

`dist/cli.js` is a shebang'd executable. It has no exported symbols a consumer would import as `from 'sqlfu/cli'`, and the existing `publishConfig.exports['./cli'].types` points at `dist/cli.d.ts` largely because it was cheap to do. Running api-extractor on it produces a nearly-empty rollup with spurious warnings about the command handler functions it imports.

Decision: **drop** `types` from `publishConfig.exports['./cli']`. The entry still exports `default` (the JS file), which is all `bin` and runtime consumers need. `scripts/bundle-types.ts` will delete `dist/cli.d.ts` alongside the other orphaned per-file declarations.

If a future use case wants `import { someCliHelper } from 'sqlfu/cli'` in typed code, we add an api-extractor config for it then. Not now.

### Script wiring

New `build:bundle-types` script:

```jsonc
"build:bundle-types": "tsx scripts/bundle-types.ts"
```

Runs after `build:runtime` and before `build:vendor-typesql`:

```jsonc
"build": "pnpm run build:internal-queries && pnpm run build:runtime && pnpm run build:bundle-types && pnpm run build:vendor-typesql && pnpm run build:bundle-vendor"
```

`scripts/bundle-types.ts` (sketch):

1. For each of the 6 entries, shell out to `api-extractor run --local --config etc/api-extractor/<entry>.json`.
2. Move `dist/<entry>.bundled.d.ts` -> `dist/<entry>.d.ts`.
3. Delete every `.d.ts` / `.d.ts.map` under `dist/` that isn't one of the 6 kept files. Log the count deleted.
4. Non-zero exit if any api-extractor invocation failed or any expected rollup file is missing.

### Forgotten-export triage policy

First run will surface `ae-forgotten-export` warnings. Policy:

- If the referenced type is genuinely part of the public contract, export it from the entry (`export type Foo ...`) so api-extractor picks it up.
- If it's an implementation detail leaking out (e.g. an internal helper's return type annotating a public function), either inline the type, widen the public signature, or add `/** @internal */` to the leaking type.
- If it's from a vendored tree or a dependency we don't want to re-export, leave the warning - it'll land in the report and can be revisited when the noise becomes annoying.

Don't chase zero warnings on the first pass. The point of committing reports is to make the surface visible, not spotless.

### Vendor exclusion

The 6 public entries at `src/{index,browser,client,api,ui/index,ui/browser}.ts` don't import from `src/vendor/typesql/*`, `src/vendor/antlr4/*`, `src/vendor/typesql-parser/*`, or `src/vendor/code-block-writer/*` at the type level (those are all `declaration: false` in their tsconfig). `src/vendor/sql-formatter/*` and `src/vendor/standard-schema/*` do produce `.d.ts` but are only referenced by `formatter.ts`, and `formatter.ts` isn't a public entry. So api-extractor shouldn't need explicit vendor filtering.

If it turns out a public entry transitively hits a vendor type, fix it at the source (add a non-vendor type wrapper at the export site) rather than plumbing `bundledPackages` exceptions.

## Checklist

- [ ] Install `@microsoft/api-extractor` as a devDep on `packages/sqlfu`.
- [ ] Create `packages/sqlfu/etc/api-extractor/base.json` and 6 per-entry configs.
- [ ] Create `packages/sqlfu/scripts/bundle-types.ts` (runs api-extractor across all entries, promotes rollups to `dist/<entry>.d.ts`, deletes orphaned per-file `.d.ts`).
- [ ] Add `build:bundle-types` script and wire into `build`.
- [ ] Run `pnpm build` and commit the initial `etc/api-reports/*.api.md` files.
- [ ] Drop `types` from `publishConfig.exports['./cli']`.
- [ ] Verify `pnpm typecheck` clean.
- [ ] Verify all tests pass.
- [ ] Verify `packages/ui/` typechecks against the rolled-up types.
- [ ] Measure tarball delta with `pnpm pack` before/after.
- [ ] Update `packages/sqlfu/CLAUDE.md` with an `etc/` note.

## Success criteria (unchanged)

- `pnpm build` produces exactly one `.d.ts` file per public entry (6 of them; `cli` intentionally has none).
- Tarball unpacked size drops measurably (target: >=100 kB cut, i.e. 967 kB -> <=850 kB).
- `etc/api-reports/*.api.md` files are committed and reviewed in PRs whenever the public API changes.
- `pnpm typecheck` still clean. All tests still pass.
- Consumers in `packages/ui/` still get full type information.

## Implementation notes

_This section will be filled in as the work progresses._
