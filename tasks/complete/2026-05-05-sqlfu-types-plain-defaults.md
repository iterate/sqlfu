---
status: complete
size: medium
branch: sqlfu-types-plain-defaults
base: arktype-validator
pr: 92
date: 2026-05-05
---

# `sqlfu_types` plain TypeScript defaults for JSON columns

## Status Summary

Done. PR 92 replaces PR 85 with plain TypeScript defaults on `sqlfu_types`,
typed JSON query/table output, JSON text storage, parsed result casts, docs,
runtime coverage, and a generated fixture. Validator-schema generation and type
reference resolution remain out of scope.

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

- [x] Commit this task specification before implementation. _Committed first as `d462ef7` before typegen changes._
- [x] Read `sqlfu_types` metadata while loading schema. _`loadSqlfuTypes` reads the reserved table before normal relation loading._
- [x] Decode plain TypeScript type defaults from SQLite default values. _`parseSqliteStringDefault` decodes quoted SQLite defaults and rejects missing/empty defaults._
- [x] Apply metadata-backed JSON types to table rows, query inputs, and query outputs. _`LogicalTypeInfo` flows through `loadRelationColumns` and `refineFieldFromColumn`._
- [x] Emit `JSON.parse(...) as TheType` for typed JSON result columns. _Generated row decoding now casts parsed JSON values with the extracted TypeScript type._
- [x] Exclude `sqlfu_types` from normal generated table output. _`loadSchema` skips the reserved table after reading its metadata._
- [x] Add readable fixture coverage for generated query/table output. _`packages/sqlfu/test/generate/fixtures/logical-types.md` snapshots plain and validator wrapper output plus the tables file._
- [x] Add runtime coverage for JSON text storage and typed parsed reads. _`test/generate/runtime.test.ts` covers raw JSON text storage, parsed reads, catalog metadata, and missing default errors._
- [x] Update typegen docs with the narrowed metadata format. _`packages/sqlfu/docs/typegen.md` documents plain TypeScript defaults and the non-validator contract._
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

- Added `sqlfu_types` extraction as a reserved metadata table. Metadata column
  names must start with `json_` and use TEXT affinity.
- Kept defaults intentionally simple: the decoded SQL string literal is emitted
  directly as the generated TypeScript type.
- Reused JSON driver behavior for metadata-backed columns, including
  `JSON.stringify` inputs and parsed result rows.
- Cast typed JSON result fields after parsing so the generated surface no
  longer falls back to `unknown`.
- Validator-enabled wrappers still emit runtime schemas as `unknown` for these
  plain TypeScript defaults, but their exported `Params`/`Result` types keep the
  extracted TypeScript type and cast at the validation boundary.
- Verification:
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts -t "sqlfu_types"`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -t "logical-types" -u`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts -t "logical-types"`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts`
  - `pnpm --filter sqlfu test --run test/generate/fixtures.test.ts`
