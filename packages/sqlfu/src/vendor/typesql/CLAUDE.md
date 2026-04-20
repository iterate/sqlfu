# Vendored TypeSQL Notes

This directory is a near-copy of `https://github.com/wsporto/typesql` `src/`, initially vendored from commit `f0356201d41f3f317824968a3f1c7a90fbafdc99`.

Keep changes here mechanical where possible. Prefer preserving upstream structure over "cleaning it up" for local style.

Local changes that are expected:
- ESM-compatible relative import suffixes
- `cli.ts` exports `compile` and `loadVendoredConfig`, and does not auto-run when imported
- attribution comments on touched files
- local imports to `src/vendor/small-utils.ts`
- vendored support code may live alongside this tree under `src/vendor/*`
- `sqlfu.ts` exports `analyzeSqliteQueriesWithClient` so browser callers can run
  analysis against an already-open sqlite client (e.g. sqlite-wasm in demo mode)
- `sqlite-query-analyzer/traverse.ts` — `traverse_delete_stmt` guards the optional
  where-clause expr before calling `traverse_expr`. Upstream crashes on
  `delete from <t>;` with no where clause (null-deref on `expr.function_name()`).
- `sqlite-query-analyzer/traverse.ts` — `traverse_Sql_stmtContext` recognizes DDL /
  connection-control statements (`create_table_stmt`, `create_index_stmt`,
  `create_view_stmt`, `create_trigger_stmt`, `create_virtual_table_stmt`,
  `alter_table_stmt`, `drop_stmt`, `pragma_stmt`, `vacuum_stmt`, `reindex_stmt`,
  `analyze_stmt`, `attach_stmt`, `detach_stmt`, `begin_stmt`, `commit_stmt`,
  `rollback_stmt`, `savepoint_stmt`, `release_stmt`) and returns a `DdlResult`
  descriptor with empty `parameters`, `constraints`, and `returningColumns`.
  Upstream throws `'traverse_Sql_stmtContext'` for anything that isn't
  select/insert/update/delete. The `'Ddl'` queryType variant is plumbed through
  `shared-analyzer/traverse.ts` (`TraverseResult2`, new `DdlResult` member),
  `sqlite-query-analyzer/parser.ts` (`createSchemaDefinition` Ddl branch),
  `codegen/sqlite.ts` (`createTsDescriptor` / `mapColumns` both return empty
  arrays for Ddl), and `types.ts` (`QueryType` adds `'Ddl'`).

When updating from upstream:
- copy upstream `src/` over this directory again rather than editing file-by-file
- reapply only the local compatibility changes above
- keep sqlfu-specific behavior outside this folder when possible
- verify with `pnpm --filter sqlfu test --run test/generate.test.ts`, `pnpm --filter sqlfu typecheck`, and `pnpm --filter sqlfu build`
