/*
 * Dialect interface — the seam between the main `sqlfu` package's
 * dialect-neutral logic (CLI flow, schema diff orchestration, migration
 * runner, formatter) and dialect-specific implementations.
 *
 * The default `sqliteDialect` exported here is a thin aggregator over the
 * existing sqlite-specific functions in this package. A separate
 * `@sqlfu/pg` package will export `pgDialect` satisfying the same shape; the
 * main package never imports pg code.
 *
 * Step one of the pg roadmap (this PR) covers the methods below. The typegen
 * pipeline (materialize schema → introspect → analyze queries) is currently
 * tangled with sqlite-specific private helpers in `typegen/index.ts` and will
 * be lifted onto the Dialect in step two, when the pg implementation drives
 * the abstraction. See packages/sqlfu/tasks/pg.md for the rationale.
 */
import {formatSql, type FormatSqlOptions} from './formatter.js';
import type {SqlfuHost} from './host.js';
import {diffBaselineSqlToDesiredSql} from './schemadiff/sqlite/index.js';
import {quoteIdentifier as sqliteQuoteIdentifier} from './schemadiff/sqlite/identifiers.js';
import type {AsyncClient} from './types.js';

export type DiffSchemaInput = {
  baselineSql: string;
  desiredSql: string;
  allowDestructive: boolean;
};

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
};

const sqliteSqlfuMigrationTableDdl = (tableName: string) =>
  `create table if not exists ${tableName} (\n  name text primary key check (name not like '%.sql'),\n  checksum text not null,\n  applied_at text not null\n);`;

export const sqliteDialect: Dialect = {
  name: 'sqlite',
  diffSchema: diffBaselineSqlToDesiredSql,
  formatSql,
  quoteIdentifier: sqliteQuoteIdentifier,
  defaultMigrationTableDdl: sqliteSqlfuMigrationTableDdl,
  // withMigrationLock omitted — sqlite serializes writers at the file level
};
