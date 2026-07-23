---
status: complete
size: small
---

# Reproduce runtime root ERM syntax in build output

Status summary: Repro complete. `scripts/repro-runtime-root-using-transform.sh` runs the real `pnpm --filter sqlfu build`, walks the built `dist/index.js` import graph, and fails on ES2022 parsing at the emitted ERM syntax. The actual build transform is intentionally left for a follow-up implementation PR.

## Problem

PR 142 tried to remove `using` / `await using` from selected runtime source files by hand. That is too local and too random: the real problem is that the published `sqlfu` root runtime import graph can contain explicit resource management syntax after `pnpm build`, and bundlers targeting older JavaScript syntax can fail before user code runs.

The likely product direction is to keep authoring with explicit resource management in source, then have the build step transform package output to plain `try` / `finally` where the published runtime surface needs it.

## Assumptions

- Source code may keep `using` and `await using`.
- The repro should run from a clean checkout with installed dependencies.
- The repro can be a shell script rather than a formal test for now.
- The important signal is downstream parser compatibility of the built package surface, not a regex assertion against authored source.

## Checklist

- [x] Close PR 142 in favor of a focused repro branch. _Closed draft PR 142 with a note that the replacement should prove the built-output problem._
- [x] Add a script that runs `pnpm --filter sqlfu build`. _Added `scripts/repro-runtime-root-using-transform.sh`._
- [x] Make the script bundle or parse the built root `sqlfu` entry with a realistic lower syntax target. _The script uses esbuild metadata to collect the built root import graph, then parses each reachable `dist/*.js` file as ES2022 through ESLint's parser._
- [x] Make the script fail on current `main` with the bundler/parser error that motivated PR 142. _The script exits 1 on current `main` because `dist/config-inline.js`, `dist/dialect.js`, and `dist/schemadiff/sqlite/index.js` still contain ERM syntax after build._
- [x] Document the expected next fix: transform built ERM syntax during `pnpm build`, rather than hand-editing runtime source. _The script also runs an esbuild `target=es2022` probe of the same root graph and reports that it parses successfully after lowering._

## Acceptance Criteria

- A reviewer can run one shell script and see the failure.
- The failure points at explicit resource management syntax in the built root runtime import graph.
- The task and PR body explain why the repro replaces PR 142.

## Implementation Notes

Observed script output on this branch:

```text
FAIL: built sqlfu root import graph contains syntax that an ES2022 parser rejects.
Checked 48 built files reachable from dist/index.js.

First failures:
- dist/config-inline.js:56:11 Parsing error: Unexpected token stmt
  using stmt = client.prepare(sql);
- dist/dialect.js:73:25 Parsing error: Unexpected token database
  await using database = await host.openScratchDb('materialize-schema');
- dist/schemadiff/sqlite/index.js:8:17 Parsing error: Unexpected token baseline
  await using baseline = await host.openScratchDb('baseline');

An esbuild target=es2022 probe of the same root graph parses successfully.
That suggests the eventual fix can live in pnpm build as a dist transform instead of source edits.
```
