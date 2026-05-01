---
status: ready
size: medium
branch: arktype-validator
base: affinity-types
---

# Replace packages/sqlfu Zod usage with Arktype

## Status Summary

Spec captured; implementation not started. This is stacked on `affinity-types`
so it can build on the JSON logical-type capture there. Main missing pieces are
removing first-party Zod imports/options from `packages/sqlfu`, updating generated
validator fixtures/tests/docs, and proving the CLI/UI routers still validate
inputs through arktype-compatible schemas.

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

- [ ] Replace direct `zod` imports in `packages/sqlfu/src` with arktype schemas.
- [ ] Remove `zod` from `packages/sqlfu` direct dependencies and make arktype the
  direct runtime dependency where needed.
- [ ] Remove `zod` and `zod-mini` from `SqlfuValidator`, config validation, and
  generated validator emission.
- [ ] Update runtime validation tests and markdown fixtures to cover arktype and
  valibot only.
- [ ] Update docs and README references so users are directed to arktype first,
  with no supported Zod validator mode in `packages/sqlfu`.
- [ ] Run focused generator/router tests, package typecheck, and the sqlfu test
  suite.

## Implementation Notes

- Current Zod runtime imports are in `packages/sqlfu/src/node/cli-router.ts` and
  `packages/sqlfu/src/ui/router.ts`.
- Current generated Zod support is centralized in
  `packages/sqlfu/src/typegen/index.ts` around `zodEmitter`, `zodMiniEmitter`,
  `parseFlavour: 'zod'`, and Zod-specific parse/prettify branches.
- Arktype generation already exists and uses the Standard Schema path, so the
  likely implementation is deletion and simplification rather than adding a new
  validator backend.
