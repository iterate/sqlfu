---
status: done
size: medium
branch: typebox-validator
---

# TypeBox validator generation

Status summary: Done. sqlfu now accepts `generate.validator: 'typebox'`,
generated wrappers emit TypeBox schemas with native compiled parsing, CLI inputs
use trpc-cli's TypeBox adapter, and `sqlfu_types` custom JSON definitions emit
`Type.Script` schemas. No missing pieces are known beyond replacing the
pkg.pr.new trpc-cli dependency when a normal npm release exists.

## Goal

Add `generate.validator: 'typebox'` support to sqlfu's generated query wrappers,
using TypeBox-native schemas and TypeBox-native parsing/error formatting.

## Assumptions

- trpc-cli's TypeBox adapter is unreleased on npm `0.14.1`, so this branch should
  consume the pkg.pr.new preview for commit `e9c8057` until a normal trpc-cli
  release exists.
- sqlfu-generated query wrappers should import TypeBox directly and parse with
  TypeBox APIs. They should not validate through Standard Schema.
- The trpc-cli adapter should only be used where sqlfu itself passes TypeBox
  schemas into tRPC CLI surfaces.
- `typebox` should be added as an opt-in validator dependency for generated
  wrappers and tests.
- If feasible within scope, custom JSON types from `sqlfu_types` should become
  TypeBox schemas via `Type.Script`, so validator output can reflect the
  user-provided TypeScript definition instead of falling back to unknown.

## Checklist

- [x] Add `typebox` to the accepted `generate.validator` values. _Implemented in `src/types.ts` and `src/config.ts`._
- [x] Add generator fixtures that pin TypeBox schema emission and native parse
      guards. _Covered in `test/generate/fixtures/validators.md`._
- [x] Emit TypeBox object/primitive/enum/array/nullability/optionality schemas. _Implemented by `typeboxEmitter` in `src/typegen/index.ts`._
- [x] Format TypeBox validation errors without `prettifyStandardSchemaError`. _Implemented by `parseTypeBox` / `prettifyTypeBoxError` in `src/typebox.ts`._
- [x] Use the trpc-cli `typeboxToStandardSchema` adapter for sqlfu's CLI router
      if the new trpc-cli preview supports it cleanly. _Implemented in `src/node/cli-router.ts` with the pkg.pr.new trpc-cli build._
- [x] Investigate `Type.Script` for `sqlfu_types` custom JSON definitions. _Implemented for `plainTsType` fields and pinned in `test/generate/fixtures/logical-types.md`._
- [x] Run targeted generator tests and typecheck. _Ran fixtures, TypeBox runtime tests, CLI config tests, sqlfu typecheck, build, and `git diff --check`._

## Implementation Notes

- 2026-05-12: trpc-cli PR #201 (`Add TypeBox support`) is merged to main at
  `e9c8057`. The continuous release page reports
  `npm i https://pkg.pr.new/mmkal/trpc-cli@e9c8057`, and `npm pack` succeeds
  against that URL.
- 2026-05-12: Implementation uses TypeBox's `Schema.Compile(...).Parse(...)`
  path for generated validation. Pretty errors are formatted from TypeBox
  `ParseError.errors`; `prettyErrors: false` lets TypeBox's raw `ParseError`
  propagate.
- 2026-05-12: `Type.Script` successfully parses `sqlfu_types` TypeScript object
  definitions into runtime JSON Schema for TypeBox validators.
- 2026-05-12: Follow-up polished multiline `Type.Script` output by indenting
  embedded newlines and expanded the PR body with an abbreviated
  `definitions.sql` plus generated TypeBox file example.
