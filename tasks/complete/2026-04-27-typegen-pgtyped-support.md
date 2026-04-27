---
status: done
size: large
---

# PgTyped-style typegen annotations and parameter expansion

## Status (for humans)

Implementation complete on `typegen-pgtyped-support`. `sqlfu generate` now keeps unannotated single-query files working, supports annotated multi-query `.sql` files, expands PgTyped-style scalar/object/object-array params at runtime, emits validator schemas for expanded params, and records annotated query entries in the catalog. Focused typegen tests and typecheck pass.

## What

`sqlfu generate` currently treats each `*.sql` file as exactly one generated query whose function name comes from the relative file path. Beef that up with two PgTyped-inspired features:

- multiple queries in one `.sql` file, each preceded by an annotation comment with `@name`
- parameter expansion metadata in the same annotation block, using `@param name -> ...`

Example target input:

```sql
/** @name listPosts */
select id, slug from posts order by id;

/*
  @name listPostsByIds
  @param ids -> (...)
*/
select id, slug from posts where id in :ids;

/*
  @name insertPosts
  @param posts -> ((slug, title)...)
*/
insert into posts (slug, title) values :posts returning id, slug, title;
```

The generated module should stay anchored to the source file path:

```ts
// sql/.generated/posts.sql.ts
export const listPosts = /* ... */;
export const listPostsByIds = /* ... */;
export const insertPosts = /* ... */;
```

## Scope

- [x] Parse PgTyped-style annotation comments from query `.sql` files. Support `/* @name foo */`, `/** @name foo */`, and multiline block comments with `@name` plus `@param` tags. _Implemented in `parseQueryAnnotations` / `parseParameterExpansions` in `packages/sqlfu/src/typegen/index.ts`._
- [x] Split annotated files into one query entry per annotation. Each annotated query is the SQL statement following its annotation. Require an annotation before each query when a file contains multiple queries. _`loadQueryDocuments` now produces `QueryDocument` / `QuerySource` records before analyzer dispatch._
- [x] Preserve the current behavior for a single unannotated `.sql` file: derive the generated function name from the file path and emit one wrapper exactly as today. _Unannotated files keep the original `toCamelCase(relativePath)` path and single-wrapper renderer._
- [x] Generate one `.generated/<relative-path>.sql.ts` module per source `.sql` file. Annotated multi-query files export all named query wrappers from that module, and `.generated/index.ts` continues to export the source module once. _`renderQueryDocument` combines multiple wrapper bodies with unique local constants._
- [x] Make query names come from `@name` for annotated queries. Reject duplicate query names inside the generated output set with a clear error. _Annotation names preserve valid TS identifiers like `myQueryName`; duplicate generated names fail in `assertUniqueQueryFunctionNames`._
- [x] Add parameter expansion support for scalar arrays: `@param ids -> (...)` rewrites `:ids` into a runtime placeholder list and types the param as an array of the inferred scalar type. _Covered by `listPostsByIds` fixture/runtime assertions._
- [x] Add object-pick expansion support: `@param user -> (name, email)` rewrites `:user` into placeholders for the listed fields and types the param as an object with those fields. _Covered by `insertPost` fixture/runtime assertions._
- [x] Add array-of-object expansion support: `@param users -> ((name, email)...)` rewrites `:users` into repeated row tuples and types the param as an array of objects. _Covered by `insertPosts` fixture/runtime assertions._
- [x] Make expanded params work in generated runtime wrappers, query factories, validator wrappers, query catalog entries, and `.sql` constants. _Runtime test checks generated execution and catalog shape; fixture covers zod schema emission for expanded params._
- [x] Add readable fixture coverage under `packages/sqlfu/test/generate/fixtures/` for multi-query files, scalar array expansion, object pick expansion, and array-of-object expansion. _Added `packages/sqlfu/test/generate/fixtures/pgtyped-annotations.md`._
- [x] Run focused typegen tests and typecheck before calling the task done. _Ran `pnpm --filter sqlfu exec vitest run test/generate`, `pnpm --filter sqlfu exec vitest run test/generate/runtime.test.ts`, `pnpm --filter sqlfu exec vitest run test/generate/fixtures.test.ts --update`, and `pnpm --filter sqlfu typecheck`._

## Assumptions and decisions

- SQLite stays the concrete target. PgTyped's `$1` examples translate to sqlfu's existing `?` placeholders.
- This task intentionally does not implement PgTyped's nullability suffixes (`:param!`, output aliases like `"name?"` / `"name!"`). Those are related but separate semantics.
- The annotation parser should live in sqlfu's typegen layer, not inside the vendored TypeSQL tree. Keep vendored changes mechanical where possible.
- Expansion happens before analysis so the vendored analyzer sees valid SQLite with concrete placeholders/tuples. The generator still preserves the original SQL file content in the catalog for UI display.
- Runtime expansion should reject empty arrays with an actionable error instead of emitting invalid `in ()` or `values` SQL.
- If a source file has any annotation, all executable statements in it should be annotated. Mixed annotated/unannotated multi-statement files are an error.
- Query names should be valid generated TypeScript identifiers after the existing camel-casing/naming pass. If an annotation cannot produce a usable export name, fail generation clearly.

## PgTyped references

- Annotated SQL files: https://pgtyped.dev/docs/sql-file
- Parameter expansions: https://pgtyped.dev/docs/sql-file#parameter-expansions

## Implementation notes

- Current entry point: `packages/sqlfu/src/typegen/index.ts`.
- Current query source model: `QueryFile` is one file = one query. This likely wants an internal `QueryDocument` / `QuerySource` split so file-level generated modules can contain multiple query wrappers while analysis still runs over individual query statements.
- Current wrapper renderers take `relativePath` and derive `functionName` with `toCamelCase(relativePath)`. Annotated queries need to pass an explicit function name through the render path.
- Current catalog ids are file-relative paths. Multi-query files need stable per-query ids, probably `<relative-path>#<functionName>`, while `sqlFile` remains the actual source file.

## Implementation log

- Added a file/query split in the typegen layer: `QueryDocument` keeps the source module identity, while `QuerySource` is the analyzer unit. This keeps output files anchored to source files even when a source file contains multiple named queries.
- Kept the vendored TypeSQL tree unchanged. Expansion metadata is parsed and normalized before analysis; object/object-array expansions use representative named placeholders such as `:post__slug` so the analyzer can still infer SQLite column types.
- Scalar array expansion intentionally cooperates with vendored TypeSQL's existing list-param inference. If TypeSQL has already inferred `number[]`, sqlfu does not double-wrap it into `number[][]`.
- Added runtime SQL generation only for array-shaped expansions. Object-pick expansions stay static (`values (?, ?)`), while scalar/object arrays build a runtime SQL string and reject empty arrays before calling the client.
- Added a runtime test for the real generated module behavior and catalog shape, plus fixture snapshots for generated TS and zod validator schemas.
