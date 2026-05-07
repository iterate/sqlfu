/*
 * Vendored from `@pgkit/typegen` (Apache-2.0, Copyright Misha Kaletsky).
 * Source: https://github.com/mmkal/pgkit/tree/main/packages/typegen
 *
 * Sqlfu only vendors the AST + nullability inference slice. Excluded from
 * the vendor:
 *   - CLI, watcher, file extraction (sqlfu has its own typegen runner).
 *   - Inline TS file modification (sqlfu emits separate `.sql.ts` wrappers).
 *   - The psql `\gdesc` subshell path (sqlfu uses PREPARE introspection +
 *     pg17 `result_types`).
 *
 * What's preserved:
 *   - `query/parse.ts` — pgsql-ast-parser entry + a few rewriting helpers
 *     (CTE handling, `getASTModifiedToSingleSelect` for DML+RETURNING).
 *   - `query/column-info.ts` — the nullability inference engine. Uses the
 *     in-pg `analyze_select_statement_columns` function to walk
 *     view_column_usage → information_schema.columns and combine that
 *     with the AST's structural cues.
 *   - `query/analyze-select-statement.ts` — installs the analysis function
 *     in a temp schema per analysis call.
 *   - `query/parameters.ts` — `pg_prepared_statements`-based parameter
 *     introspection (also used in our own `pgAnalyzeQueries`).
 *
 * Sqlfu modifications:
 *   - `@pgkit/client` swapped for the local pgkit-compat shim (re-exported
 *     from `../schemainspect/pgkit-compat.js`). The shim's `Queryable`
 *     gained `query()` and `transaction()` to satisfy what column-info
 *     expects.
 *   - `utils/memoize.ts` rewritten to a per-client WeakMap (sqlfu's
 *     AsyncClient doesn't expose `connectionString()`).
 *   - All vendored files carry `@ts-nocheck` so the project's strict mode
 *     doesn't fight pgkit's looser types. The vendor builds under its own
 *     tsconfig (strict: false).
 *
 * Apache-2.0 license preserved in `./LICENSE`.
 */
export {getColumnInfo, analyzeAST} from './query/column-info.js'
export {createAnalyzeSelectStatementColumnsFunction} from './query/analyze-select-statement.js'
export {getParameterTypes} from './query/parameters.js'
export type {AnalysedQuery, AnalysedQueryField, DescribedQuery, QueryField, QueryParameter} from './types.js'
