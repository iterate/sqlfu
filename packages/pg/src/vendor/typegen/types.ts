// @ts-nocheck — vendored from @pgkit/typegen; relaxed strict mode lives in src/vendor/tsconfig.json. See LICENSE.
//
// Vendored subset of @pgkit/typegen/src/types.ts. Only the types the
// AST + nullability pipeline (`query/column-info.ts`,
// `query/analyze-select-statement.ts`, `query/parse.ts`) consumes are
// preserved here. The full pgkit type set covers extracting queries
// from .ts/.sql files, code generation, and CLI options — none of
// which we vendor.

export interface ExtractedQuery {
  /** Path to file containing the query, relative to cwd */
  file: string
  /** Line number within file, 1-indexed */
  line: number
  /** Context of variables that this query appears inside. Used for naming */
  context: string[]
  /** Full source code of file containing query */
  source: string
  /** Query SQL */
  sql: string
  /** Query SQL template parts. e.g. `['select * from users where name = ', ' and dob < ', '']` */
  template: string[]
  /** Optional comment on the query */
  comment?: string
}

export interface ParsedColumn {
  table?: string
  name: string
}

export interface DescribedQuery extends ExtractedQuery {
  fields: QueryField[]
  parameters: QueryParameter[]
}

export interface QueryField {
  name: string
  /** The pg regtype (e.g. `integer`, `text`, `numeric(10,2)`). */
  regtype: string
  /** The TS type derived from the regtype. */
  typescript: string
}

export interface QueryParameter {
  name: string
  regtype: string
  typescript: string
}

export interface AnalysedQuery extends ExtractedQuery {
  suggestedTags: string[]
  fields: AnalysedQueryField[]
  parameters: QueryParameter[]
}

export interface AnalysedQueryField extends QueryField {
  nullability: 'not_null' | 'assumed_not_null' | 'nullable' | 'nullable_via_join' | 'unknown'
  column: {schema: string; table: string; name: string} | undefined
  comment: string | undefined
}
