---
status: ready
size: large
branch: sqlfu-types-metadata
base: arktype-validator
pr: TBD
date: 2026-05-01
---

# `sqlfu_types` metadata table for typed JSON logical columns

## Status Summary

Ready to implement. The intended first slice is strict-JSON metadata in a
reserved `sqlfu_types` schema table, feeding stronger generated TypeScript and
runtime validation for JSON logical columns. The branch is stacked on the
Arktype-internal validator branch because Arktype is the planned canonical
serializable schema substrate, but generated Zod, Zod Mini, and Valibot targets
must remain supported.

## Summary Ask

Let users define logical JSON types inside `definitions.sql` with a metadata
table:

```sql
create table sqlfu_types(
  json_slack_payload text default '{ "action": "''message'' | ''reaction''", "content": "string" }',
  json_stripe_payload text default '{ "id": "string", "type": "string", "data": { "foo": "number" } }'
);

create table slack_webhooks(
  id int,
  payload json_slack_payload,
  created_at int
);
```

`payload json_slack_payload` should then generate a typed payload rather than
`unknown`, serialize inputs to JSON text before executing SQL, parse outputs
back to objects, and validate both directions with the configured validator.

## Decisions

- `sqlfu_types` defaults are strict JSON strings. The JSON values are
  Arktype-compatible POJO definitions; object keys are field names and string
  values are Arktype expressions like `"string"` or `"'message' | 'reaction'"`.
- The initial implementation only handles logical type names beginning with
  `json_`, stored with text affinity. General scalar/branded logical types can
  come later.
- Generated validator targets stay compatible with existing config:
  `arktype`, `valibot`, `zod`, `zod-mini`, or no validator.
- `sqlfu_types` is reserved metadata for typegen. It should not produce normal
  generated table row exports, even if it exists in the schema.
- If a column declared type is not present in `sqlfu_types`, keep the existing
  affinity/logical-type behavior.
- Invalid metadata should fail generation with a clear message naming the
  logical type and the bad default value.

## Non-goals

- Do not generate `definitions.sql` from TypeScript type definitions yet.
- Do not attempt to serialize arbitrary runtime Arktype `Type` instances yet.
- Do not implement non-JSON logical types in this slice.
- Do not drop generated Zod or Zod Mini support.
- Do not redesign the user-provided validator plugin story in
  `tasks/typegen-extensibility.md`.

## Checklist

- [ ] Add a failing integration-style spec for a `sqlfu_types` JSON logical type. _Start with generated insert/select behavior, raw SQLite storage, and generated TypeScript/validator output._
- [ ] Extract `sqlfu_types` metadata while loading schema. _Read column names, declared storage types, and strict JSON defaults from the metadata table._
- [ ] Map table columns declared with a metadata logical type to a richer generated field. _Keep driver encoding as JSON text but attach the parsed schema metadata._
- [ ] Generate TypeScript types from the strict JSON Arktype POJO. _The example should infer `{action: 'message' | 'reaction'; content: string}`._
- [ ] Generate runtime validator schemas for Arktype, Valibot, Zod, and Zod Mini from the metadata shape. _Existing validator targets remain public API._
- [ ] Serialize typed JSON inputs with `JSON.stringify` before driver calls and parse JSON outputs before returning or validating. _Reuse the affinity-types JSON driver path where possible._
- [ ] Exclude `sqlfu_types` from normal generated table exports/catalog entries. _It is metadata, not an application table surface._
- [ ] Add a readable failure test for malformed strict JSON metadata. _The error should name `sqlfu_types.<logical_type>`._
- [ ] Update docs to show the strict JSON metadata table and clarify the future TypeScript-to-SQL direction is out of scope.
- [ ] Run focused typegen/runtime tests, package typecheck, and the full `sqlfu` test suite.
- [ ] Move this task to `tasks/complete/` and update the PR body once implementation is done.

## Implementation Notes

- The `affinity-types` branch already added JSON driver encoding with
  `JSON.stringify` on write and `JSON.parse` on read for columns declared
  exactly `json`. This task should generalize that path to metadata-backed
  `json_*` logical types instead of adding a parallel runtime path.
- Arktype is useful here as a canonical schema language because the metadata is
  serializable. It is not the only generated validator target.
