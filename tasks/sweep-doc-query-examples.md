---
status: in-progress
size: small
---

# Sweep Docs Query Examples

Summary: Spec pass complete; implementation not started. This sweep will look for small docs/examples that still use one-query SQL filenames or generated imports without `.sql.ts`, update only copy-pasteable examples, and leave intentional fixtures alone.

Context:

- Small docs/examples/guides should use a catch-all `queries.sql` file in the appropriate folder rather than single-query filenames like `list-posts.sql`.
- Generated TypeScript imports should use the fully-qualified generated extension, e.g. `./sql/.generated/queries.sql.ts`, not `./sql/.generated/queries.sql`.

Checklist:

- [ ] Find docs and examples that use one-query filenames such as `get-posts.sql`, `list-posts.sql`, or similar.
- [ ] Rename the documented query file examples to `queries.sql` where the example is small enough to fit the convention.
- [ ] Update generated imports to include the full `.sql.ts` extension.
- [ ] Run docs/test verification appropriate to the touched examples.

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
