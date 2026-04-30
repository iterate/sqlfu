---
status: complete
size: medium
branch: affinity-types
base: nightly/2026-04-30
date: 2026-04-30
---

# SQLite affinity-backed JSON logical type

## 2026-04-30 Status Summary

Done. The first slice recognizes columns declared as `json`, emits `unknown`
for their generated TypeScript surface, stringifies JSON write parameters, parses
selected JSON result columns, records `driverEncoding: "json"` in the query
catalog, and documents the narrow behavior. The `sqlfu_types` metadata-table
idea remains deferred.

## Assumptions

- SQLite accepts unknown declared type names, so `create table webhooks(type text, payload json)` is valid schema SQL and can be inspected from the typegen scratch database.
- The initial logical type should be named exactly `json`, case-insensitive, and should come from the column's declared type rather than from comments or side metadata.
- Generated TypeScript should prefer `unknown` for JSON value shape until sqlfu has a proper user-extensibility story for per-column refinements.
- JSON values should be represented in SQLite as JSON text by the generated wrappers. If a driver returns a `Uint8Array` for a JSON column, the wrapper can decode it before parsing.
- Runtime parsing/stringifying should live in generated code or tiny exported helpers only if that is cleaner than duplicating logic. Avoid broad adapter changes unless the existing code makes them the natural single point.
- Existing validator modes should keep working; for the first slice, validator schemas may treat JSON as `unknown` while wrapper plumbing still handles stringify/parse.

## Non-goals

- Do not implement the proposed `sqlfu_types` table or arbitrary logical-type registry in this task.
- Do not infer a precise TypeScript payload shape from JSON contents, default values, check constraints, or JSON schema comments.
- Do not attempt broad SQLite affinity modeling for every declared type. Limit the behavior to the `json` logical type unless the local implementation needs a tiny general hook.
- Do not change runtime behavior for columns declared as ordinary `text` or `blob`.

## Checklist

- [x] Add a readable failing generate/runtime spec for `create table webhooks(type text, payload json)` demonstrating JSON input stringification and read parsing. _Covered by `packages/sqlfu/test/generate/runtime.test.ts` with generated-code, catalog, raw-storage, and read-wrapper assertions._
- [x] Teach schema/typegen metadata to preserve the declared `json` logical type separately from ordinary text/blob columns. _Added an internal `logicalType: "json"` marker from `PRAGMA table_xinfo` in `packages/sqlfu/src/typegen/index.ts`._
- [x] Emit JSON-friendly TypeScript types for table rows, query params/data, query results, query catalog, and validator schemas. _JSON columns now refine generated fields to `unknown`; the query catalog records JSON driver encoding._
- [x] Encode generated wrapper arguments for JSON columns with `JSON.stringify` before passing them to drivers. _Implemented in the shared `toDriverValue` path, including expanded object fields._
- [x] Decode generated wrapper result rows for JSON columns with `JSON.parse` before returning or validating them. _Generated plain and validator wrappers now decode JSON result fields before returning/parsing rows._
- [x] Update docs to replace the current "Typed JSON params are not supported yet" limitation with the narrow supported behavior and deferred typed-shape scope. _Updated `packages/sqlfu/docs/typegen.md`._
- [x] Run focused tests and typecheck for the typegen package. _Ran focused runtime spec, full sqlfu test suite, and `pnpm --filter sqlfu typecheck`._
- [x] Move this task to `tasks/complete/` once the branch implementation is done and the PR body is updated. _Moved to `tasks/complete/2026-04-30-affinity-types.md`; PR body updated after implementation commit._

## Implementation Notes

- Primary integration point appears to be `packages/sqlfu/src/typegen/index.ts`, where `loadSchema`, `refineDescriptor`, `buildQueryArgs`, `buildGeneratedImplementation`, and validator wrapper generation already centralize the typegen-to-runtime path.
- Existing runtime specs in `packages/sqlfu/test/generate/runtime.test.ts` are the best fit for proving actual wrapper behavior against a real SQLite database.
- `packages/sqlfu/docs/typegen.md` currently documents typed JSON params as unsupported; this should be revised only for the small `json` declared-type behavior landed here.
- The far-fetched `sqlfu_types` table idea remains useful future scope, but it should wait for the broader typegen extensibility work.

### 2026-04-30 Log

- Added runtime coverage for `webhooks(payload json)` proving:
  - generated params/results/table rows use `unknown`;
  - `recordWebhook` stores JSON text;
  - `listWebhooks` returns the parsed object;
  - query catalog marks the JSON argument with `driverEncoding: "json"`.
- Added a tolerant descriptor refinement path for simple `insert ... values (...)`
  and `update ... set column = :param` write shapes. Unsupported shapes skip
  refinement instead of failing typegen.
- Generated row decoding is local to wrappers with JSON result columns and works
  before validator result parsing.
- Verification:
  - `pnpm --filter sqlfu test --run test/generate/runtime.test.ts -t "json declared-type"`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu test --run`
- Deferred:
  - precise JSON payload shapes;
  - `sqlfu_types` or a general logical-type registry;
  - broad SQLite affinity modeling beyond the exact declared type name `json`.
