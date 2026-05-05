---
status: complete
size: medium
base: main
---

# Docs Guides And sqlfu_types Values Examples

Summary: Done on this branch. Added the Guides section and adapter/runtime guide pages, rewrote `sqlfu_types` docs/tests/fixtures to the column-list `values` view shape, and verified the touched generate/docs surfaces. Remaining work is PR review.

Assumptions:

- The Durable Objects guide should be repetitive with Getting Started and adapter docs rather than DRY.
- The first Guides section should cover Durable Objects and then mirror the same pattern for the other main SQLite runtimes already documented.
- The `sqlfu_types` view examples should prefer:

  ```sql
  create view sqlfu_types (name, encoding, format, definition) as
  values (...);
  ```

  instead of a `select ...`-only shape.

- Keep this docs-focused unless a test fixture needs updating to lock the new example shape.

Checklist:

- [x] Create a human-facing Guides section in the docs/site navigation. _Added a `Guides` sidebar group in `website/astro.config.mjs` and registered nested guide docs in `website/scripts/sync-docs.mjs`._
- [x] Add a Durable Objects getting-started guide that connects config, adapter, migrations, and generated query usage. _Added `packages/sqlfu/docs/guides/durable-objects.md` with per-DO config, migration bundle, adapter, and generated wrapper usage._
- [x] Add similarly repetitive guides for the other main adapter/runtime types. _Added D1, Node SQLite, Bun SQLite, Turso/libSQL, Expo SQLite, and sqlite-wasm guide pages under `packages/sqlfu/docs/guides/`._
- [x] Rewrite `sqlfu_types` docs/examples/tests to use `create view sqlfu_types (...) as values (...);`. _Updated `typegen.md`, logical-types fixtures, runtime tests, and the repo `CLAUDE.md` example._
- [x] Run docs/test verification that is practical for the touched surface. _Passed targeted generate/runtime Vitest suite, oxfmt check for touched JS/TS files, `@sqlfu/ui` build, and website build._

## Implementation Notes

- Created during bedtime work on 2026-05-06.
- 2026-05-06: Confirmed the branch/worktree is clean and mapped the docs sync pipeline (`packages/sqlfu/docs/*` -> Starlight docs via `website/scripts/sync-docs.mjs`).
- 2026-05-06: Added the guide source pages and navigation wiring before running tests.
- 2026-05-06: Replaced the old `select ... as name` `sqlfu_types` examples with `create view sqlfu_types (name, encoding, format, definition) as values ...`.
- 2026-05-06: Verification passed: `pnpm --filter sqlfu exec vitest --run test/generate/runtime.test.ts test/generate/fixtures.test.ts`, `pnpm exec oxfmt --check website/astro.config.mjs website/scripts/sync-docs.mjs website/scripts/sync-llms.mjs packages/sqlfu/test/generate/runtime.test.ts`, `pnpm --filter @sqlfu/ui build`, and `pnpm --filter sqlfu-website build`.
