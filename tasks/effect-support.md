---
status: ready
size: medium
---

# Add Effect support to generated query modules

**Status summary:** Spec only. The clipboard screenshot showed Drizzle's Effect integration
pattern: a generated database service can be provided with a driver layer and then yielded
inside `Effect.gen`. Main missing pieces are the red/green TDD cycles, implementation, docs or
fixtures, and final PR verification.

## Assumptions

- Effect support should be opt-in so plain sqlfu users do not install or import `effect`.
- The public surface should feel like Drizzle's support from the screenshot: generated code
  exposes an Effect service that can be provided with a sqlfu client and then `yield*`ed inside
  `Effect.gen`.
- The generated service should preserve the existing query wrappers instead of replacing them.
  Existing imports like `findPost(client, params)` should continue to work.
- The first slice can support generated query modules and the `.generated/index.ts` barrel.
  Deeper relation-style APIs can follow later if needed.

## Checklist

- [ ] Add a failing fixture or integration spec for opt-in generated Effect support.
- [ ] Implement the smallest generated output needed for the fixture to pass.
- [ ] Add a runtime test that runs an Effect program against a real sqlfu client.
- [ ] Keep Effect imports out of default generated output.
- [ ] Update config/types so the feature is discoverable and validates invalid values clearly.
- [ ] Run focused generate/runtime tests and package typecheck.
- [ ] Move this task to `tasks/complete/` when the branch is done.

## Implementation Notes

- Clipboard screenshot reference:
  - `import * as Effect from 'effect/Effect'`
  - `const DB = PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices));`
  - `const db = yield* DB;`
- Likely sqlfu shape: `generate: {effect: true}` emits an exported service tag from
  `.generated/index.ts` or an adjacent generated module, with a provider helper that accepts
  a `Client`/`SyncClient`.
