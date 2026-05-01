---
status: complete
size: medium
---

# Add Effect support to generated query modules

**Status summary:** Done. The generator now has opt-in Effect client output, the source
fixture is green after red failures for the old/missing shape, runtime usage works against a
real sqlite client with `yield* listPosts(db)`, and package typecheck/build plus the relevant
generate/config tests are green.

## Assumptions

- Effect support should be opt-in so plain sqlfu users do not install or import `effect`.
- The public surface should feel like Drizzle's support from the screenshot: generated code
  exposes an Effect client service that can be provided with a sqlfu client, yielded inside
  `Effect.gen`, and passed to normal generated query wrappers.
- The generated Effect client should preserve existing query wrappers instead of replacing them.
  Existing imports like `findPost(client, params)` continue to work; Effect users can call
  `yield* findPost(db, params)` with the yielded Effect client.
- The first slice can support generated query modules and the `.generated/index.ts` barrel.
  Deeper relation-style APIs can follow later if needed.

## Checklist

- [x] Add a failing fixture or integration spec for opt-in generated Effect support. _added `packages/sqlfu/test/generate/fixtures/effect.md`; first run failed because `sql/.generated/effect.ts` was `<MISSING>`_
- [x] Implement the smallest generated output needed for the fixture to pass. _`writeGeneratedEffectFile` now emits `SqlfuClient` / `EffectClient`, and plain query wrappers overload on `EffectClient` when `generate.effect` is true_
- [x] Add a runtime test that runs an Effect program against a real sqlfu client. _`runtime.test.ts` imports the generated Effect client, provides a node sqlite client, and calls `yield* listPosts(db)` / `yield* findPostBySlug(db, params)`_
- [x] Keep Effect imports out of default generated output. _barrel export for `effect.ts` is gated on `config.generate.effect`; existing non-effect fixtures still pin the default index shape_
- [x] Update config/types so the feature is discoverable and validates invalid values clearly. _`SqlfuGenerateConfig.effect` and `assertConfigShape` now cover the opt-in flag_
- [x] Run focused generate/runtime tests and package typecheck. _green: `pnpm --filter sqlfu typecheck`, relevant generate/config vitest files, and `pnpm --filter sqlfu build`_
- [x] Move this task to `tasks/complete/` when the branch is done. _moved to `tasks/complete/2026-05-01-effect-support.md` on the feature branch_

## Implementation Notes

- Clipboard screenshot reference:
  - `import * as Effect from 'effect/Effect'`
  - `const DB = PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices));`
  - `const db = yield* DB;`
- Shipped sqlfu shape: `generate: {effect: true}` emits `SqlfuClient.make().pipe(Effect.provide(SqlfuClient.DefaultServices(client)))`, yielding an `EffectClient` that normal generated query wrappers accept:
  - `const db = yield* DB;`
  - `const posts = yield* listPosts(db);`
- Red/green breadcrumb:
  - Red: `pnpm --filter sqlfu exec vitest run test/generate/fixtures.test.ts -t "generate.effect"`
    failed on missing `sql/.generated/effect.ts`.
  - Red after review: focused fixture/runtime tests failed because the branch still generated the old service-object API and `SqlfuClient` was undefined.
  - Green: the focused fixture and runtime Effect client tests pass.
