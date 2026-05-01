---
status: complete
size: medium
branch: arktype-validator
base: affinity-types
pr: 84
date: 2026-05-01
---

# Replace packages/sqlfu Zod usage with Arktype

## Status Summary

Done. `packages/sqlfu` no longer imports or directly depends on Zod; CLI/UI
router inputs use Arktype schemas, generated validation supports Arktype and
Valibot only, docs point users to Arktype first, and the focused plus full
`sqlfu` package checks pass. Remaining Zod references are deliberate legacy
`generate.zod` rejection coverage or transitive lockfile entries outside this
package's first-party surface.

## Summary Ask

Switch `packages/sqlfu` away from Zod and onto Arktype as the first-party runtime
schema dependency. The motivation is to avoid shipping both Zod and Arktype from
sqlfu itself, and to keep a path open for fully serializable logical-type
metadata: future `sqlfu_types` rows could store arktype-compatible POJOs and use
that metadata to derive both runtime validators and generated TypeScript types.

## Assumptions

- Scope is `packages/sqlfu` first-party code, docs, tests, fixtures, and package
  metadata. Transitive Zod entries in the workspace lockfile may remain if other
  packages or dependencies still require them.
- `generate.validator: 'arktype'` should remain supported and become the primary
  documented validator option.
- `generate.validator: 'valibot'` can remain for now because it is not Zod and
  already shares the Standard Schema runtime path with arktype.
- `generate.validator: 'zod'` and `'zod-mini'` should be removed from the public
  sqlfu validator union rather than silently mapping to arktype.
- The legacy `generate.zod` config-key rejection should remain, but its migration
  hint should point users to `generate.validator: 'arktype' | 'valibot' | null`.
- CLI/UI router inputs should use arktype schemas directly if `@orpc/server`
  accepts Standard Schema-compatible input validators.

## Non-goals

- Do not implement the `sqlfu_types` metadata table in this task.
- Do not infer precise JSON payload shapes from arktype metadata yet.
- Do not remove Zod from unrelated workspace packages or from transitive
  dependency graphs.
- Do not remove Valibot unless it proves necessary to make the arktype switch
  coherent.

## Checklist

- [x] Replace direct `zod` imports in `packages/sqlfu/src` with arktype schemas. _`src/node/cli-router.ts` and `src/ui/router.ts` now import `type` from `arktype`; CLI optional-input schemas keep object JSON Schema for trpc-cli._
- [x] Remove `zod` from `packages/sqlfu` direct dependencies and make arktype the
  direct runtime dependency where needed. _Moved `arktype` into `packages/sqlfu` dependencies and removed the direct `zod` dependency; lockfile Zod entries remain transitive._
- [x] Remove `zod` and `zod-mini` from `SqlfuValidator`, config validation, and
  generated validator emission. _`SqlfuValidator` is now `'arktype' | 'valibot'`; Zod emitters and Zod-specific parse branches were deleted from typegen._
- [x] Update runtime validation tests and markdown fixtures to cover arktype and
  valibot only. _Regenerated `validators.md` and `query-annotations.md`; runtime tests now exercise Arktype plus Valibot Standard Schema behavior._
- [x] Update docs and README references so users are directed to arktype first,
  with no supported Zod validator mode in `packages/sqlfu`. _Rewrote `docs/runtime-validation.mdx` around Arktype/Valibot and updated README/getting-started references._
- [x] Run focused generator/router tests, package typecheck, and the sqlfu test
  suite. _See verification log below._

## Implementation Notes

- Current Zod runtime imports are in `packages/sqlfu/src/node/cli-router.ts` and
  `packages/sqlfu/src/ui/router.ts`.
- Current generated Zod support is centralized in
  `packages/sqlfu/src/typegen/index.ts` around `zodEmitter`, `zodMiniEmitter`,
  `parseFlavour: 'zod'`, and Zod-specific parse/prettify branches.
- Arktype generation already exists and uses the Standard Schema path, so the
  likely implementation is deletion and simplification rather than adding a new
  validator backend.

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
