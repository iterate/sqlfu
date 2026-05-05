---
status: ready
size: medium
base: main
---

# Docs Guides And sqlfu_types Values Examples

Summary: Spec-only so far. This branch will add a Guides section aimed at adapter-specific onboarding, plus rewrite `sqlfu_types` examples to use a column-list view with `values` rows so multiple logical types are easier to add.

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

- [ ] Create a human-facing Guides section in the docs/site navigation.
- [ ] Add a Durable Objects getting-started guide that connects config, adapter, migrations, and generated query usage.
- [ ] Add similarly repetitive guides for the other main adapter/runtime types.
- [ ] Rewrite `sqlfu_types` docs/examples/tests to use `create view sqlfu_types (...) as values (...);`.
- [ ] Run docs/test verification that is practical for the touched surface.

## Implementation Notes

- Created during bedtime work on 2026-05-06.
