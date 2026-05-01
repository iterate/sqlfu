---
status: complete
size: large
branch: sqlfu-types-metadata
base: arktype-validator
pr: 85
date: 2026-05-01
---

# `sqlfu_types` metadata table for typed JSON logical columns

## Status Summary

Done. `sqlfu_types` now acts as a reserved typegen metadata table for strict
JSON `json_*` logical types, including generated TypeScript object shapes,
JSON driver encoding, result parsing, query catalog metadata, and runtime
validation across Arktype, Valibot, Zod, and Zod Mini. The future
TypeScript-to-SQL and runtime Arktype-serialization ideas remain out of scope.

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

- [x] Add a failing integration-style spec for a `sqlfu_types` JSON logical type. _`test/generate/runtime.test.ts` covers generated insert/select behavior, raw SQLite JSON-text storage, table output, catalog output, and Arktype validation._
- [x] Extract `sqlfu_types` metadata while loading schema. _`loadSqlfuTypes` reads metadata columns, TEXT affinity, and strict JSON defaults from `PRAGMA table_xinfo("sqlfu_types")`._
- [x] Map table columns declared with a metadata logical type to a richer generated field. _Declared `json_*` types now attach parsed schema fields while keeping `logicalType: "json"` for driver encoding._
- [x] Generate TypeScript types from the strict JSON Arktype POJO. _The covered example emits `{ action: 'message' | 'reaction'; content: string }` in tables, params/results, and catalog metadata._
- [x] Generate runtime validator schemas for Arktype, Valibot, Zod, and Zod Mini from the metadata shape. _Arktype gets the metadata POJO form; the other emitters reuse generated object fields._
- [x] Serialize typed JSON inputs with `JSON.stringify` before driver calls and parse JSON outputs before returning or validating. _The existing JSON logical-type driver path now handles metadata-backed JSON fields before object-field flattening._
- [x] Exclude `sqlfu_types` from normal generated table exports/catalog entries. _`loadSchema` skips the reserved table after reading its metadata._
- [x] Add a readable failure test for malformed strict JSON metadata. _Generation now errors with `sqlfu_types.<logical_type> default must be strict JSON...`._
- [x] Update docs to show the strict JSON metadata table and clarify the future TypeScript-to-SQL direction is out of scope. _Added a typed JSON columns section to `packages/sqlfu/docs/typegen.md`._
- [x] Run focused typegen/runtime tests, package typecheck, and the full `sqlfu` test suite. _See verification log below._
- [x] Move this task to `tasks/complete/` and update the PR body once implementation is done. _Moved to `tasks/complete/2026-05-01-sqlfu-types-metadata.md`; PR body updated after implementation._

## Implementation Notes

- The `affinity-types` branch already added JSON driver encoding with
  `JSON.stringify` on write and `JSON.parse` on read for columns declared
  exactly `json`. This task should generalize that path to metadata-backed
  `json_*` logical types instead of adding a parallel runtime path.
- Arktype is useful here as a canonical schema language because the metadata is
  serializable. It is not the only generated validator target.

### 2026-05-01 Log

- Added `LogicalTypeDefinition` metadata parsed from strict JSON defaults on the
  reserved `sqlfu_types` table. The first slice requires logical type names to
  start with `json_` and their metadata columns to have TEXT affinity.
- Metadata-backed columns reuse the existing JSON driver encoding:
  `JSON.stringify` for inputs and `JSON.parse` for result rows.
- The Arktype emitter uses the stored JSON definition directly, while Zod,
  Zod Mini, and Valibot emit equivalent schemas from the generated field tree.
- Fixed a generated-validator bug exposed by the new multi-query test: result
  parsing now references the local result schema name instead of hardcoding
  `Result`, which was undefined in multi-query generated modules.
- Verification:
  - Red: `pnpm --filter sqlfu test --run test/generate/runtime.test.ts -t "sqlfu_types metadata"` first failed because payloads were still inferred as numbers.
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts -t "sqlfu_types"`
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter @sqlfu/ui build` for generated UI assets in this fresh worktree.
  - `pnpm --filter sqlfu test --run`
