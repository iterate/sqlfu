/*
 * Dialect interface — the seam between the main `sqlfu` package's
 * dialect-neutral logic (CLI flow, schema diff orchestration, migration
 * runner, formatter, typegen) and dialect-specific implementations.
 *
 * The default `sqliteDialect` exported here is a thin aggregator over the
 * existing sqlite-specific functions in this package. A separate
 * `@sqlfu/pg` package will export `pgDialect` satisfying the same shape; the
 * main package never imports pg code.
 *
 * **Wart: side-effect registration of sqlite typegen impls.** The strict-tier
 * import check (`scripts/check-strict-imports.ts`) bundles the runtime graph
 * of `dist/index.js` and forbids `node:*` imports — including those reached
 * via *dynamic* imports (the check follows them). The sqlite typegen helpers
 * (`materializeTypegenDatabase`, `loadSchema`) live on a node:* code path, so
 * dialect.ts cannot import them statically *or* dynamically without breaking
 * strict tier.
 *
 * Workaround: dialect.ts ships `sqliteDialect` with throwing stubs for the
 * three typegen methods. `typegen/index.ts` mutates them at module-load to
 * the real implementations. Every heavy entry (CLI, api, ui server) imports
 * `typegen/index.ts` somewhere in its graph, so the stubs only ever fire if
 * a strict-tier consumer somehow tries to invoke typegen — which is a bug
 * regardless. The error message points at the right next step.
 *
 * Cleaner alternatives we considered:
 *   1. Move `sqliteDialect` itself to a heavy entry. Breaks `defineConfig`
 *      defaulting in the strict-tier `config.ts` (which needs to reference
 *      the value, not just the type).
 *   2. Make typegen methods optional (`typegen?: {...}`). Forces every
 *      caller to nullish-check, hurts the dialect's "uniform contract" UX.
 *   3. Strict check that *doesn't* follow dynamic imports. Loosens an
 *      existing guarantee for a single feature.
 *
 * The side-effect registration was the smallest hammer.
 */
import {formatSql, type FormatSqlOptions} from './formatter.js';
import type {SqlfuHost} from './host.js';
import {diffBaselineSqlToDesiredSql} from './schemadiff/sqlite/index.js';
import {quoteIdentifier as sqliteQuoteIdentifier} from './schemadiff/sqlite/identifiers.js';
import type {AsyncClient, SqlfuProjectConfig} from './types.js';
import type {VendoredQueryAnalysis, VendoredQueryInput} from './typegen/analyze-vendored-typesql.js';

export type DiffSchemaInput = {
  baselineSql: string;
  desiredSql: string;
  allowDestructive: boolean;
};

/**
 * Dialect-neutral input for query analysis. Re-exports the existing
 * vendored-typesql input shape — `{sqlPath, sqlContent}` is portable.
 */
export type QueryAnalysisInput = VendoredQueryInput;

/**
 * Dialect-neutral output for query analysis (column types, parameter shapes,
 * query kind). Both the sqlite path (typesql) and the pg path (pgkit-derived)
 * produce values of this shape; downstream rendering is dialect-agnostic.
 */
export type QueryAnalysis = VendoredQueryAnalysis;

/**
 * Per-column type info as consumed by the typegen rendering pipeline. Both
 * dialects produce values of this shape.
 */
export type DialectColumnInfo = {
  name: string;
  tsType: string;
  notNull: boolean;
};

/**
 * Per-relation type info — table or view, with a column map and the original
 * `CREATE` SQL (used by view-shape inference for sqlite). Dialect-neutral
 * data, sqlite & pg both produce.
 */
export type RelationInfo = {
  kind: 'table' | 'view';
  name: string;
  columns: ReadonlyMap<string, DialectColumnInfo>;
  sql?: string;
};

/**
 * Opaque handle representing a materialized schema ready for typegen lookups +
 * analysis. Each dialect knows its own concrete shape; the value MUST only be
 * passed back to methods on the same dialect that produced it. Values are
 * `AsyncDisposable` so callers use `await using` to release dialect-owned
 * resources (pg temp schemas, transient sqlite files, open connections, etc.).
 */
export interface MaterializedTypegenSchema extends AsyncDisposable {
  /** Identifies the producing dialect. Used as a runtime sanity check. */
  readonly dialect: string;
}

export type Dialect = {
  /** Stable identifier; e.g. `'sqlite'`, `'postgresql'`. */
  name: string;

  /**
   * Compute the ordered list of statements that takes a database from the
   * `baselineSql` shape to the `desiredSql` shape. SQL strings in, SQL
   * strings out — the dialect's internal representation of a schema does not
   * cross this boundary.
   */
  diffSchema(host: SqlfuHost, input: DiffSchemaInput): Promise<string[]>;

  /** Pretty-print a single SQL string in the dialect's native style. */
  formatSql(sql: string, options?: FormatSqlOptions): string;

  /** Quote an identifier (table/column/index name) per the dialect's rules. */
  quoteIdentifier(name: string): string;

  /**
   * The migration-bookkeeping table DDL for the default `'sqlfu'` migrations
   * preset. Dialect-locked presets (e.g. `'d1'`) bypass this and provide their
   * own DDL inline; we don't try to make those portable.
   */
  defaultMigrationTableDdl(tableName: string): string;

  /**
   * Optional: wrap migration application in a dialect-native lock. SQLite is
   * single-writer at the file level so the default `sqliteDialect` omits this;
   * postgres uses `pg_advisory_xact_lock`.
   */
  withMigrationLock?<T>(client: AsyncClient, fn: () => Promise<T>): Promise<T>;

  /**
   * Materialize the project's schema (per `config.generate.authority`) into a
   * dialect-specific form ready for typegen lookups + query analysis. Returned
   * handle is opaque to the caller and disposed via `Symbol.asyncDispose`.
   *
   * Sqlite's materialized form is a temp `.sqlite` file at
   * `<projectRoot>/.sqlfu/typegen.db`; pg's is a temp schema in a connected pg
   * server.
   */
  materializeTypegenSchema(host: SqlfuHost, config: SqlfuProjectConfig): Promise<MaterializedTypegenSchema>;

  /** Extract relation (table/view) shapes from the materialized schema. */
  loadSchemaForTypegen(materialized: MaterializedTypegenSchema): Promise<ReadonlyMap<string, RelationInfo>>;

  /**
   * Analyze a batch of queries against the materialized schema, producing
   * column/parameter type info for each one.
   */
  analyzeQueries(
    materialized: MaterializedTypegenSchema,
    queries: QueryAnalysisInput[],
  ): Promise<QueryAnalysis[]>;
};

const sqliteSqlfuMigrationTableDdl = (tableName: string) =>
  `create table if not exists ${tableName} (\n  name text primary key check (name not like '%.sql'),\n  checksum text not null,\n  applied_at text not null\n);`;

function typegenStub(methodName: string): never {
  throw new Error(
    `sqliteDialect.${methodName} requires loading sqlfu's typegen module — ` +
      `it is registered via a side-effect import in 'sqlfu/typegen' (and pulled in transitively by 'sqlfu/api', 'sqlfu/cli', 'sqlfu/ui'). ` +
      `If you're hitting this from a strict-tier path (browser/edge), you shouldn't be calling typegen methods at runtime.`,
  );
}

export const sqliteDialect: Dialect = {
  name: 'sqlite',
  diffSchema: diffBaselineSqlToDesiredSql,
  formatSql,
  quoteIdentifier: sqliteQuoteIdentifier,
  defaultMigrationTableDdl: sqliteSqlfuMigrationTableDdl,
  // withMigrationLock omitted — sqlite serializes writers at the file level

  // The three typegen methods below are stubs; `typegen/index.ts` mutates
  // them to real implementations at module-load. See file header.
  materializeTypegenSchema: () => typegenStub('materializeTypegenSchema'),
  loadSchemaForTypegen: () => typegenStub('loadSchemaForTypegen'),
  analyzeQueries: () => typegenStub('analyzeQueries'),
};

/**
 * Asserts a `MaterializedTypegenSchema` was produced by the sqlite dialect.
 * Exposed so the registration in `typegen/index.ts` can use it without
 * duplicating the cast logic.
 */
export function assertSqliteMaterialized(materialized: MaterializedTypegenSchema): {databasePath: string} {
  if (materialized.dialect !== 'sqlite') {
    throw new Error(
      `sqliteDialect received a MaterializedTypegenSchema produced by '${materialized.dialect}' — dialect handles must not cross dialect boundaries.`,
    );
  }
  return materialized as MaterializedTypegenSchema & {databasePath: string};
}
