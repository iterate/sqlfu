/*
 * Dialect interface — the seam between the main `sqlfu` package's
 * dialect-neutral logic (CLI flow, schema diff orchestration, migration
 * runner, formatter, typegen) and dialect-specific implementations.
 *
 * `sqliteDialect()` is a factory matching the shape `pgDialect({...})` will
 * use for per-project config. It currently takes no parameters; it's a
 * factory rather than a const so users learn the API once and don't have to
 * remember which dialects need calling and which don't.
 *
 * **Wart: side-effect registration of sqlite typegen impls.** The strict-tier
 * import check (`scripts/check-strict-imports.ts`) bundles the runtime graph
 * of `dist/index.js` and forbids `node:*` imports — including those reached
 * via *dynamic* imports (the check follows them). The sqlite typegen helpers
 * (`materializeTypegenDatabase`, `loadSchema`) live on a node:* code path, so
 * dialect.ts cannot import them statically *or* dynamically without breaking
 * strict tier.
 *
 * Workaround: dialect.ts ships throwing stubs for the three typegen methods.
 * `typegen/index.ts` calls `registerSqliteTypegenImpls(...)` at module-load
 * to install real implementations. Every heavy entry (CLI, api, ui server)
 * imports `typegen/index.ts` somewhere in its graph, so the stubs only ever
 * fire if a strict-tier consumer somehow tries to invoke typegen — which is
 * a bug regardless. The error message points at the right next step.
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
import {extractSchema as extractSqliteSchema} from './sqlite-text.js';
import type {AsyncClient, Client, SqlfuProjectConfig} from './types.js';
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
   * Apply `sourceSql` (a single DDL string — could be definitions.sql, could
   * be concatenated migrations) to a scratch database, then extract and
   * return the resulting schema as a canonical SQL string. Disposes the
   * scratch database before returning.
   *
   * Sqlite materializes against `host.openScratchDb` (in-memory sqlite); pg
   * uses its own connection (closed-over from the dialect's factory config)
   * to `CREATE DATABASE sqlfu_<random>` and drop on completion.
   */
  materializeSchemaSql(
    host: SqlfuHost,
    input: {sourceSql: string; excludedTables?: string[]},
  ): Promise<string>;

  /**
   * Extract the canonical schema from a live client. Used by the
   * `live_schema` typegen authority and by drift checks against the user's
   * actual database. Sqlite reads from `sqlite_schema` (the `'main'` db);
   * pg reads from `pg_catalog` (the default `public` schema and any others
   * the dialect's options say to include).
   *
   * Accepts either a `SyncClient` or `AsyncClient` so callers can pass any
   * `client` regardless of driver shape; pg-flavored impls coerce to async
   * (and error on a sync client, since no pg driver is sync today).
   */
  extractSchemaFromClient(client: Client, options?: {excludedTables?: string[]}): Promise<string>;

  /**
   * Apply pre-read schema source SQL to a fresh dialect-specific scratch
   * database, returning a handle ready for typegen lookups + query
   * analysis. The caller (typegen entry point) reads the schema source —
   * via `readSchemaForAuthority` — *before* this call, so the dialect
   * doesn't need to know which authority is in play.
   *
   * Sqlite's materialized form is a temp `.sqlite` file at
   * `<projectRoot>/.sqlfu/typegen.db`; pg's is an ephemeral
   * `CREATE DATABASE`'d database. Both are disposed via
   * `Symbol.asyncDispose` on the returned handle.
   */
  materializeTypegenSchema(
    host: SqlfuHost,
    input: {projectRoot: string; sourceSql: string},
  ): Promise<MaterializedTypegenSchema>;

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

/** Real implementations registered by `typegen/index.ts` at module-load. */
type SqliteTypegenImpls = {
  materializeTypegenSchema: Dialect['materializeTypegenSchema'];
  loadSchemaForTypegen: Dialect['loadSchemaForTypegen'];
  analyzeQueries: Dialect['analyzeQueries'];
};

let sqliteTypegenImpls: SqliteTypegenImpls | null = null;

/**
 * Called by `typegen/index.ts` at module-load to install the heavy-tier
 * typegen impls onto sqlite-dialect instances. After this runs, calls to
 * `sqliteDialect()` return objects with real typegen methods. Before it
 * runs (strict-tier paths), the typegen methods on a freshly-constructed
 * dialect are throwing stubs.
 */
export function registerSqliteTypegenImpls(impls: SqliteTypegenImpls): void {
  sqliteTypegenImpls = impls;
}

function typegenStub(methodName: string): never {
  throw new Error(
    `sqliteDialect.${methodName} requires loading sqlfu's typegen module — ` +
      `it is registered via a side-effect import in 'sqlfu/typegen' (and pulled in transitively by 'sqlfu/api', 'sqlfu/cli', 'sqlfu/ui'). ` +
      `If you're hitting this from a strict-tier path (browser/edge), you shouldn't be calling typegen methods at runtime.`,
  );
}

/**
 * Build a fresh sqlite `Dialect`. Currently takes no parameters — exists as a
 * factory for API parity with `pgDialect({...})` (see `@sqlfu/pg`), so users
 * can write `defineConfig({dialect: sqliteDialect()})` or `pgDialect({...})`
 * without remembering which is a value and which is a constructor.
 */
export function sqliteDialect(): Dialect {
  return {
    name: 'sqlite',
    diffSchema: diffBaselineSqlToDesiredSql,
    formatSql,
    quoteIdentifier: sqliteQuoteIdentifier,
    defaultMigrationTableDdl: sqliteSqlfuMigrationTableDdl,
    // withMigrationLock omitted — sqlite serializes writers at the file level

    materializeSchemaSql: async (host, input) => {
      await using database = await host.openScratchDb('materialize-schema');
      if (input.sourceSql.trim()) {
        await database.client.raw(input.sourceSql);
      }
      return extractSqliteSchema(database.client, 'main', {excludedTables: [...(input.excludedTables ?? [])]});
    },
    extractSchemaFromClient: async (client, options) =>
      extractSqliteSchema(client, 'main', {excludedTables: [...(options?.excludedTables ?? [])]}),

    materializeTypegenSchema:
      sqliteTypegenImpls?.materializeTypegenSchema ?? (() => typegenStub('materializeTypegenSchema')),
    loadSchemaForTypegen:
      sqliteTypegenImpls?.loadSchemaForTypegen ?? (() => typegenStub('loadSchemaForTypegen')),
    analyzeQueries: sqliteTypegenImpls?.analyzeQueries ?? (() => typegenStub('analyzeQueries')),
  };
}

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
