---
status: complete
size: small
---

# Lower explicit resource management in built dist

Status summary: Done. `tsconfig.build.json` targets ES2025, so `tsgo` lowers `using` / `await using` to try/finally in `dist/`. `test/dist-syntax.test.ts` parses every `dist/**/*.js` file as ES2025 and replaces the one-off repro shell script.

## Problem

PR 142 tried to remove `using` / `await using` from selected runtime source files by hand. That is too local and too random: the real problem is that the published `sqlfu` package contains explicit resource management (ERM) syntax after `pnpm build`, and consumer bundlers whose parser doesn't know ERM yet (Next.js, when an app imports `defineConfig`, `createD1Client` or `applyMigrations` from `sqlfu`) fail before user code runs.

Keep authoring with ERM in source. Lower it in the built output.

## Assumptions

- Source code may keep `using` and `await using`.
- The important signal is downstream parser compatibility of the built package surface, not a regex assertion against authored source.
- The check covers all of `dist/`, not just the root `dist/index.js` graph. Every published entry gets bundled by someone.

## Checklist

- [x] Close PR 142 in favor of a focused repro branch. _Closed draft PR 142 with a note that the replacement should prove the built-output problem._
- [x] Reproduce: build, then parse built output with a lower syntax target. _First as `scripts/repro-runtime-root-using-transform.sh` (root graph, ES2022), now as `packages/sqlfu/test/dist-syntax.test.ts` (all of dist, ES2025)._
- [x] Lower ERM in `pnpm build`. _`"target": "ES2025"` in `packages/sqlfu/tsconfig.build.json`. tsgo emits its `__addDisposableResource` / `__disposeResources` helpers inline in the 10 files that use ERM._
- [x] Make the repro a real check. _The vitest test runs in the existing `unit-tests` CI job against the full build from `test/global-setup.ts`. Shell script deleted._

## Implementation Notes

- Why ES2025, not ES2022 (the repro's bar): espree puts ERM at ES2026 and import attributes at ES2025. Four node-side entries (`api/exports`, `node/cli-router`, `node/sqlfu-cli`, `ui/router`) import `package.json` `with {type: 'json'}`, which Node needs and which TS doesn't lower. ES2025 is "everything except ERM". The root `dist/index.js` graph happens to be ES2022-clean today, but nothing guards that.
- `tsgo` output at `--target es2022` and `--target es2025` is byte-identical; vs ESNext, only the 10 ERM files change and no `.d.ts` changes.
- Considered and rejected: an esbuild per-file post-transform of `dist/` (reprints every file, drops comments, extra build step); `importHelpers` + `tslib` (adds a runtime dep, and the strict-tier import check bans bare specifiers).
- Lowered output still needs `Symbol.dispose` / `Symbol.asyncDispose` at runtime, same as before (source already defines `[Symbol.dispose]()` methods).

Repro output before the fix:

```text
- dist/config-inline.js:56:11 Parsing error: Unexpected token stmt
- dist/dialect.js:73:25 Parsing error: Unexpected token database
- dist/api/core.js:42:25 Parsing error: Unexpected token database
- dist/api/internal.js:27:17 Parsing error: Unexpected token database
- dist/node/cli-router.js:216:21 Parsing error: Unexpected token database
- dist/node/host.js:86:25 Parsing error: Unexpected token stmt
- dist/typegen/index.js:24:17 Parsing error: Unexpected token materialized
- dist/ui/router.js:135:25 Parsing error: Unexpected token database
- dist/ui/server.js:229:17 Parsing error: Unexpected token database
- dist/schemadiff/sqlite/index.js:8:17 Parsing error: Unexpected token baseline
```
