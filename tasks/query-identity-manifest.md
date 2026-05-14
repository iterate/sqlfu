---
status: ready
size: medium
---

# Query identity and generated source manifest module

## Status summary

Architecture pass selected this as the bedtime improvement. Nothing is implemented yet. The intended slice is a behavior-preserving extraction: make query identity and generated source manifest handling a real module, then make typegen and the lint plugin use it instead of each owning path/name/manifest rules.

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

- [ ] Add a query identity/source-manifest module with a small interface for generated wrapper paths, manifest entries, manifest rendering, and manifest parsing.
- [ ] Use the module from typegen when writing `sql/.generated/queries.ts`.
- [ ] Use the module from the lint plugin when reading `sql/.generated/queries.ts` and checking expected wrapper paths.
- [ ] Update lint tests so manifest fixtures are rendered through the same module instead of hand-written string assembly.
- [ ] Add focused tests for manifest parsing/rendering edge cases that the regex path was implicitly handling.
- [ ] Run focused lint/typegen tests and typecheck.

## Out of scope

- Do not change generated query naming rules.
- Do not move all `QueryDocument` / `QuerySource` loading out of typegen.
- Do not redesign the generated catalog JSON.
- Do not change the lint plugin's sync project discovery model.

## Implementation notes

- Candidate selection came from the 2026-05-14 `improve-codebase-architecture` pass.
- Main files expected: `packages/sqlfu/src/typegen/index.ts`, `packages/sqlfu/src/lint-plugin.ts`, `packages/sqlfu/src/naming.ts` or a new sibling module, and `packages/sqlfu/test/lint-plugin.test.ts`.
