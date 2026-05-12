---
status: complete
size: small
---

# Sweep Docs Query Examples

Summary: Done. Small copy-paste docs and landing demos now use `queries.sql` plus `@name` where needed, generated imports include `.sql.ts`, and filename-focused docs/tests were left alone intentionally.

Context:

- Small docs/examples/guides should use a catch-all `queries.sql` file in the appropriate folder rather than single-query filenames like `list-posts.sql`.
- Generated TypeScript imports should use the fully-qualified generated extension, e.g. `./sql/.generated/queries.sql.ts`, not `./sql/.generated/queries.sql`.

Checklist:

- [x] Find docs and examples that use one-query filenames such as `get-posts.sql`, `list-posts.sql`, or similar. _searched generated imports, filename patterns, real `.sql` files, docs pages, website content, and tests with `rg`; left behavior fixtures and filename-identity docs in place_
- [x] Rename the documented query file examples to `queries.sql` where the example is small enough to fit the convention. _updated getting-started, dynamic queries, Effect SQL, formatter, lint-plugin, and landing demos; added `@name` where the generated function name depends on it_
- [x] Update generated imports to include the full `.sql.ts` extension. _fixed docs imports in client, Effect SQL, typegen, lint-plugin, getting-started, runtime validation, and landing demos_
- [x] Run docs/test verification appropriate to the touched examples. _ran touched-file `oxfmt --check`, `pnpm --filter @sqlfu/ui build`, and `pnpm build:website`; full `pnpm format:check` still fails on pre-existing non-doc files_

## Implementation Notes

- Created from follow-up feedback on PR #94 on 2026-05-06.
- Search approach:
  - Use `rg` across docs, examples, READMEs, tests, and website content for generated import paths containing `.generated/` that end at `.sql`.
  - Use `rg --files` and targeted filename searches for likely one-query names such as `list-*.sql`, `get-*.sql`, `create-*.sql`, `update-*.sql`, `delete-*.sql`, and `find-*.sql`.
  - Check references before renaming files so examples, docs prose, and generated import paths stay in sync.
- Assumptions:
  - Rename small documentation examples to `queries.sql`; do not rename larger fixtures or tests where the filename is part of the behavior being tested.
  - Prefer lowercase SQL in touched snippets, matching the project convention.
  - Keep prose edits narrow and apply the writing-well checklist only to text touched during the sweep.
- 2026-05-12 implementation notes:
  - Updated small examples that are meant to be copied into an app.
  - Left `typegen.md`, `observability.md`, `runtime-validation.mdx` generated-code snippets, test fixtures, and UI template projects using descriptive filenames where the filename is the subject of the example or fixture behavior.
  - Applied the writing-well pass by keeping touched prose direct, removing the stale filename-identity wording from getting-started, and avoiding inflated phrasing.
