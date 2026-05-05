---
status: complete
size: medium
branch: sqlfu-types-plain-defaults
base: arktype-validator
pr: 92
date: 2026-05-05
---

# `sqlfu_types` view for plain TypeScript JSON columns

## Status Summary

Done. PR 92 replaces PR 85 with a reserved `sqlfu_types` view that maps logical
type names to `storage` and plain TypeScript `ts_type` strings, plus typed JSON
query/table output, JSON text storage, parsed result casts, docs, runtime
coverage, and generated fixtures. Validator-schema generation and type reference
resolution remain out of scope.

## Summary Ask

Redo PR 85 with a smaller metadata format. A reserved `sqlfu_types` view can
declare logical JSON type names by selecting a logical name, storage strategy,
and plain TypeScript type expression:

```sql
create view sqlfu_types as
select
  'json_slack_payload' as name,
  'json' as storage,
  '{
    action: "message" | "reaction";
    content: string
  }' as ts_type;

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

- `sqlfu_types.ts_type` values are plain TypeScript type strings, not JSON, Arktype,
  Zod, Valibot, imports, references, or aliases.
- The first slice handles logical type names that start with `json_` and rows
  whose `storage` is `json`.
- Typegen should use the `ts_type` value as the generated TypeScript type string
  after trimming and deindenting the SQL string literal.
- The generated runtime should still store JSON as text using the existing
  `JSON.stringify` path for inputs.
- Output parsing should cast parsed JSON with the extracted type:
  `JSON.parse(row.payload) as SlackPayloadType`.
- `sqlfu_types` is reserved metadata and should not produce normal generated
  table row exports.
- Missing metadata keeps the existing JSON behavior: `json` columns stay
  `unknown`.
- Invalid metadata should fail generation with an error naming the bad
  `sqlfu_types` row/column.

## Non-goals

- Do not generate validator schemas from the TypeScript type string.
- Do not resolve type references, imports, aliases, or external files.
- Do not redesign the metadata format in this PR.
- Do not replace the existing JSON logical-type storage behavior.

## Checklist

- [x] Commit this task specification before implementation. _Committed first as `d462ef7` before typegen changes._
- [x] Read `sqlfu_types` metadata while loading schema. _`loadSqlfuTypes` reads the reserved view before normal relation loading._
- [x] Decode plain TypeScript type strings from the metadata view. _`normalizePlainTsType` trims and deindents `ts_type` values and rejects empty values._
- [x] Apply metadata-backed JSON types to table rows, query inputs, and query outputs. _`LogicalTypeInfo` flows through `loadRelationColumns` and `refineFieldFromColumn`._
- [x] Emit `JSON.parse(...) as TheType` for typed JSON result columns. _Generated row decoding now casts parsed JSON values with the extracted TypeScript type._
- [x] Exclude `sqlfu_types` from normal generated table output. _`loadSchema` skips the reserved table after reading its metadata._
- [x] Add readable fixture coverage for generated query/table output. _`packages/sqlfu/test/generate/fixtures/logical-types.md` snapshots plain and validator wrapper output plus the tables file._
- [x] Add runtime coverage for JSON text storage and typed parsed reads. _`test/generate/runtime.test.ts` covers raw JSON text storage, parsed reads, catalog metadata, old-table rejection, and unsupported storage errors._
- [x] Update typegen docs with the narrowed metadata format. _`packages/sqlfu/docs/typegen.md` documents plain TypeScript `ts_type` strings and the non-validator contract._
- [x] Open the replacement PR as draft, close PR 85, and update this task with PR details. _Opened draft PR 92 and closed PR 85 with a replacement note._
- [x] Run focused tests and typecheck. _See verification log below._
- [x] Move this task to `tasks/complete/` once the implementation is done. _Moved to `tasks/complete/2026-05-05-sqlfu-types-plain-defaults.md`._

## Implementation Notes

- PR 85 proved the broad shape but used strict JSON defaults and validator
  schema generation. This replacement should avoid that complexity.
- The existing `json` logical type already gives the right storage behavior:
  inputs go through `JSON.stringify` and selected outputs go through
  `JSON.parse`. The implementation should enrich that path with a per-column
  TypeScript type string instead of creating a parallel runtime.

### 2026-05-05 Log

- Added `sqlfu_types` extraction as a reserved metadata view. Metadata row names
  must start with `json_`; `storage` must be `json` in this slice.
- Swapped the original table/default-value metadata design to a view-based
  design so the key/value rows survive schema materialization without abusing
  SQLite column defaults.
- Kept `ts_type` intentionally simple: the SQL string value is trimmed,
  deindented, and emitted as the generated TypeScript type.
- Reused JSON driver behavior for metadata-backed columns, including
  `JSON.stringify` inputs and parsed result rows.
- Cast typed JSON result fields after parsing so the generated surface no
  longer falls back to `unknown`.
- Validator-enabled wrappers still emit runtime schemas as `unknown` for these
  plain TypeScript `ts_type` strings, but their exported `Params`/`Result` types keep the
  extracted TypeScript type and cast at the validation boundary.
- Verification:
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts -t "sqlfu_types"`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -t "logical-types" -u`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -t "logical-types"`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts`
