---
status: in-progress
size: medium
branch: typebox-validator
---

# TypeBox validator generation

Status summary: Initial task spec only. The trpc-cli TypeBox adapter has been
confirmed on main via PR #201 and the pkg.pr.new preview release at
`https://pkg.pr.new/mmkal/trpc-cli@e9c8057`; implementation and verification are
still pending.

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

- [ ] Add `typebox` to the accepted `generate.validator` values.
- [ ] Add generator fixtures that pin TypeBox schema emission and native parse
      guards.
- [ ] Emit TypeBox object/primitive/enum/array/nullability/optionality schemas.
- [ ] Format TypeBox validation errors without `prettifyStandardSchemaError`.
- [ ] Use the trpc-cli `typeboxToStandardSchema` adapter for sqlfu's CLI router
      if the new trpc-cli preview supports it cleanly.
- [ ] Investigate `Type.Script` for `sqlfu_types` custom JSON definitions.
- [ ] Run targeted generator tests and typecheck.

## Implementation Notes

- 2026-05-12: trpc-cli PR #201 (`Add TypeBox support`) is merged to main at
  `e9c8057`. The continuous release page reports
  `npm i https://pkg.pr.new/mmkal/trpc-cli@e9c8057`, and `npm pack` succeeds
  against that URL.
