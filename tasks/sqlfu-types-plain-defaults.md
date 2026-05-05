---
status: in-progress
size: medium
branch: sqlfu-types-plain-defaults
base: arktype-validator
pr: tbd
---

# `sqlfu_types` plain TypeScript defaults for JSON columns

## Status Summary

Started. The intended replacement for PR 85 keeps the `sqlfu_types` metadata
table idea, but drops JSON schema objects, validator schemas, and reference
resolution. Missing pieces are implementation, generated fixtures, runtime
coverage, docs, and the draft PR update.

## Summary Ask

Redo PR 85 with a smaller metadata format. A reserved `sqlfu_types` table can
declare logical JSON type names by using the metadata column name as the SQLite
declared type and the column default as a plain TypeScript type expression:

```sql
create table sqlfu_types(
  json_slack_payload text default '{ action: "message" | "reaction"; content: string }'
);

create table slack_webhooks(
  id integer primary key,
  payload json_slack_payload not null
);
```

Generated wrappers should infer `payload` as:

```ts
{ action: "message" | "reaction"; content: string }
```

instead of `unknown`, stringify typed JSON inputs before executing SQL, and parse
JSON result columns as `JSON.parse(...) as TheType` before returning them.

## Decisions

- `sqlfu_types` defaults are plain TypeScript type strings, not JSON, Arktype,
  Zod, Valibot, imports, references, or aliases.
- The first slice handles logical type names that start with `json_` and have
  SQLite TEXT affinity.
- Typegen should use the default value directly as the generated TypeScript type
  string after decoding the SQL string literal.
- The generated runtime should still store JSON as text using the existing
  `JSON.stringify` path for inputs.
- Output parsing should cast parsed JSON with the extracted type:
  `JSON.parse(row.payload) as SlackPayloadType`.
- `sqlfu_types` is reserved metadata and should not produce normal generated
  table row exports.
- Missing metadata keeps the existing JSON behavior: `json` columns stay
  `unknown`.
- Invalid or missing defaults should fail generation with an error naming the
  `sqlfu_types` column.

## Non-goals

- Do not generate validator schemas from the TypeScript type string.
- Do not resolve type references, imports, aliases, or external files.
- Do not redesign the metadata format in this PR.
- Do not replace the existing JSON logical-type storage behavior.

## Checklist

- [ ] Commit this task specification before implementation.
- [ ] Read `sqlfu_types` metadata while loading schema.
- [ ] Decode plain TypeScript type defaults from SQLite default values.
- [ ] Apply metadata-backed JSON types to table rows, query inputs, and query outputs.
- [ ] Emit `JSON.parse(...) as TheType` for typed JSON result columns.
- [ ] Exclude `sqlfu_types` from normal generated table output.
- [ ] Add readable fixture coverage for generated query/table output.
- [ ] Add runtime coverage for JSON text storage and typed parsed reads.
- [ ] Update typegen docs with the narrowed metadata format.
- [ ] Open the replacement PR as draft, close PR 85, and update this task with PR details.
- [ ] Run focused tests and typecheck.
- [ ] Move this task to `tasks/complete/` once the implementation is done.

## Implementation Notes

- PR 85 proved the broad shape but used strict JSON defaults and validator
  schema generation. This replacement should avoid that complexity.
- The existing `json` logical type already gives the right storage behavior:
  inputs go through `JSON.stringify` and selected outputs go through
  `JSON.parse`. The implementation should enrich that path with a per-column
  TypeScript type string instead of creating a parallel runtime.
