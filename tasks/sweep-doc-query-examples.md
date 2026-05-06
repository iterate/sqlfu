---
status: ready
size: small
---

# Sweep Docs Query Examples

Summary: Not started. Some existing docs/examples predate the query-file naming and generated-import conventions added during the Guides pass; sweep them separately so the Guides PR can stay focused.

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
