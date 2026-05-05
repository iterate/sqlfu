---
status: complete
size: medium
branch: arktype-validator
base: affinity-types
pr: 84
date: 2026-05-01
---

# Replace packages/sqlfu internal Zod usage with Arktype

## Status Summary

Done after PR review correction. `packages/sqlfu` first-party CLI/UI router
inputs use Arktype schemas and the runtime dependency list no longer includes
Zod. Generated validator support remains intact for Arktype, Valibot, Zod, and
Zod Mini. CLI command inputs now use Arktype object schemas unioned with
`undefined`, restoring omitted-input call-sites while relying on the released
trpc-cli optional-union JSON Schema fix. The `sqlfu_types` metadata-table
implementation is split to the stacked follow-up branch.

## Summary Ask

Switch `packages/sqlfu` away from Zod and onto Arktype as the first-party runtime
schema dependency. The motivation is to avoid shipping both Zod and Arktype from
sqlfu itself, and to keep a path open for fully serializable logical-type
metadata: future `sqlfu_types` rows could store arktype-compatible POJOs and use
that metadata to derive both runtime validators and generated TypeScript types.
This task changes sqlfu's own implementation dependency only; generated Zod and
Zod Mini support remains public API.

## Assumptions

- Scope is `packages/sqlfu` first-party code, docs, tests, fixtures, and package
  metadata. Transitive Zod entries in the workspace lockfile may remain if other
  packages or dependencies still require them.
- `generate.validator: 'arktype'` should remain supported.
- `generate.validator: 'valibot'` can remain for now because it is not Zod and
  already shares the Standard Schema runtime path with arktype.
- `generate.validator: 'zod'` and `'zod-mini'` remain supported generated-code
  targets. Users who choose those modes provide Zod in their application, while
  sqlfu keeps it as a dev-only dependency for fixtures and runtime tests.
- The legacy `generate.zod` config-key rejection should remain, but its migration
  hint should continue pointing users to the `generate.validator` union.
- CLI/UI router inputs should use arktype schemas directly if `@orpc/server`
  accepts Standard Schema-compatible input validators.

## Non-goals

- Do not implement the `sqlfu_types` metadata table in this task.
- Do not infer precise JSON payload shapes from arktype metadata yet.
- Do not remove Zod or Zod Mini as generated validator targets.
- Do not remove Zod from unrelated workspace packages or from transitive
  dependency graphs.
- Do not remove Valibot unless it proves necessary to make the arktype switch
  coherent.

## Checklist

- [x] Replace direct `zod` imports in `packages/sqlfu/src` with arktype schemas. _`src/node/cli-router.ts` and `src/ui/router.ts` now import `type` from `arktype`; CLI flag bags use `schema.or('undefined')`, so router clients can call omitted-input commands without passing `{}`._
- [x] Remove `zod` from `packages/sqlfu` direct dependencies and make arktype the
  direct runtime dependency where needed. _Moved `arktype` into `packages/sqlfu` dependencies and moved Zod to dev-only coverage for generated-code tests._
- [x] ~~Remove `zod` and `zod-mini` from `SqlfuValidator`, config validation, and
  generated validator emission.~~ _Entered in error; PR review clarified that only the internal dependency should be removed. Restored public Zod and Zod Mini support._
- [x] Restore runtime validation tests and markdown fixtures for Arktype, Valibot,
  Zod, and Zod Mini. _Generated validator support stays at the existing four-target union._
- [x] Keep docs and README references validator-neutral. _Restored the runtime-validation docs that list Arktype, Valibot, Zod, and Zod Mini as supported options._
- [x] Run focused generator/router tests, package typecheck, and the sqlfu test
  suite. _Focused generator/runtime checks, router-adjacent tests, typecheck, and the full `sqlfu` package test suite pass after the correction._

## Implementation Notes

- Current Zod runtime imports are in `packages/sqlfu/src/node/cli-router.ts` and
  `packages/sqlfu/src/ui/router.ts`.
- Current generated Zod support is centralized in
  `packages/sqlfu/src/typegen/index.ts` around `zodEmitter`, `zodMiniEmitter`,
  `parseFlavour: 'zod'`, and Zod-specific parse/prettify branches.
- Arktype generation already exists and uses the Standard Schema path, so the
  likely implementation is deletion and simplification rather than adding a new
  validator backend.
- Review correction: public generated-code targets are not implementation
  dependencies. Zod and Zod Mini stay in `SqlfuValidator`; `packages/sqlfu`
  itself stops importing Zod in first-party runtime code.
- Optional CLI command schemas originally needed a local `toJsonSchema` mutation
  shim for trpc-cli. That is now handled by trpc-cli `0.14.1`, so this branch
  uses direct `schema.or('undefined')` unions with a normal semver dependency.

## Verification Log

- Red check before implementation:
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -t "rejects unknown validator values"` failed because config validation still listed `'zod'` and `'zod-mini'`.
- Passing checks after implementation:
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -u`
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts`
  - `pnpm --filter sqlfu test --run test/ui-server.test.ts test/cli-config.test.ts test/init.test.ts`
  - `pnpm --filter @sqlfu/ui build` to generate ignored UI serialized assets in this fresh worktree.
  - `pnpm --filter sqlfu test --run`
- Red check during PR review repair:
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts` failed because the restored generated Zod tests could not resolve a package-local Zod install.
- Passing checks after PR review repair:
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts`
  - `pnpm --filter sqlfu test --run test/ui-server.test.ts test/cli-config.test.ts test/init.test.ts`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -t "legacy generate.zod"`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run`
- Passing checks after removing the optional-input shim:
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run test/migrations/migrations.test.ts test/migrations/edge-cases.test.ts test/migrations/prefix-config.test.ts`
  - `pnpm --filter sqlfu test --run test/cli-config.test.ts test/ui-server.test.ts`
  - `pnpm --filter sqlfu test --run`
- Passing checks after restoring direct `.or('undefined')` CLI inputs on
  `trpc-cli@0.14.1`:
  - `pnpm --filter sqlfu build`
  - `node packages/sqlfu/bin/sqlfu.js serve --help`
  - `node packages/sqlfu/bin/sqlfu.js migrate --help`
  - `pnpm --filter sqlfu test --run test/cli-config.test.ts test/init.test.ts`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run test/ui-server.test.ts`
  - `pnpm --filter sqlfu test --run`
