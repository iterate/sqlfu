---
status: done
size: medium
---

# Query identity and generated source manifest module

## Status summary

Done. Query identity and generated source manifest handling now live in `packages/sqlfu/src/query-identity.ts`. Typegen writes the manifest through that module, the lint plugin reads/checks through the same module, lint tests no longer hand-assemble the manifest protocol, and focused manifest tests cover parsing/rendering.

## Why this candidate

The architecture explorers surfaced larger candidates around the generated query boundary and schema authority. I am choosing query identity and manifest handling as the overnight slice because it is high leverage without becoming a broad product redesign:

- `CONTEXT.md` already names **Query identity** as a domain concept.
- Typegen writes the generated source manifest in `sql/.generated/queries.ts`.
- The lint plugin parses that manifest with a regex and separately derives generated wrapper paths.
- Lint tests hand-write manifest text, so the generated protocol is recreated in test helpers rather than exercised through a shared interface.

This is not the lowest-risk test-only cleanup, but it is small enough to land as a reviewable architecture PR.

## Assumptions and proxy decisions

- Query identity remains the generated function name and runtime `SqlQuery.name`; this PR should not change naming rules.
- The generated `sqlfuQuerySources` shape should stay source-compatible for now.
- The new module should be synchronous for manifest parsing so the ESLint plugin can keep running without async config loading or bundling.
- Typegen can still own SQL document splitting and `@name` parsing for this slice; the new module owns only identity/path/manifest protocol.
- Generated file output should be unchanged except for any harmless formatting caused by centralizing serialization. Prefer no fixture churn.

## Checklist

- [x] Add a query identity/source-manifest module with a small interface for generated wrapper paths, manifest entries, manifest rendering, and manifest parsing. _added `packages/sqlfu/src/query-identity.ts`; it owns `queryIdentityFromPath`, generated wrapper path helpers, manifest entry construction, rendering, and parsing._
- [x] Use the module from typegen when writing `sql/.generated/queries.ts`. _`writeGeneratedQueriesFile` now renders via `renderQuerySourceManifest`, and query function names use `queryIdentityFromPath`._
- [x] Use the module from the lint plugin when reading `sql/.generated/queries.ts` and checking expected wrapper paths. _`lint-plugin.ts` now imports manifest parsing and wrapper path helpers instead of owning local regex/path functions._
- [x] Update lint tests so manifest fixtures are rendered through the same module instead of hand-written string assembly. _`queriesManifest` in `test/lint-plugin.test.ts` now delegates to `renderQuerySourceManifest`._
- [x] Add focused tests for manifest parsing/rendering edge cases that the regex path was implicitly handling. _added `test/query-identity.test.ts` for identity derivation, wrapper paths, manifest round-trip, and malformed-entry filtering._
- [x] Run focused lint/typegen tests and typecheck. _`pnpm --filter sqlfu test --run test/query-identity.test.ts test/lint-plugin.test.ts test/generate/fixtures.test.ts`, `pnpm --filter sqlfu typecheck`, and `git diff --check` passed._

## Out of scope

- Do not change generated query naming rules.
- Do not move all `QueryDocument` / `QuerySource` loading out of typegen.
- Do not redesign the generated catalog JSON.
- Do not change the lint plugin's sync project discovery model.

## Implementation notes

- Candidate selection came from the 2026-05-14 `improve-codebase-architecture` pass.
- Main files expected: `packages/sqlfu/src/typegen/index.ts`, `packages/sqlfu/src/lint-plugin.ts`, `packages/sqlfu/src/naming.ts` or a new sibling module, and `packages/sqlfu/test/lint-plugin.test.ts`.
- Added **Generated query source manifest** to `CONTEXT.md` because the extracted module makes that protocol a named project concept.
- Kept `@name` annotation parsing in typegen. Moving full query document loading is a separate generated-query-boundary-sized refactor, not this PR.
