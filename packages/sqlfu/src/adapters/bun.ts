import {bindSyncSql} from '../core/sql.js';
import type {ResultRow, SqlQuery, SyncExecutor, SyncSqlClient} from '../core/types.js';

export interface BunSqliteRunResult {
  readonly changes?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface BunSqliteStatementLike<TRow extends ResultRow = ResultRow> {
  all(...params: readonly unknown[]): TRow[];
}

export interface BunSqliteDatabaseLike {
  query<TRow extends ResultRow = ResultRow>(query: string): BunSqliteStatementLike<TRow>;
  run(query: string, params?: readonly unknown[]): BunSqliteRunResult;
}

export interface BunClient extends SyncSqlClient {
  readonly database: BunSqliteDatabaseLike;
}

export function createBunClient(database: BunSqliteDatabaseLike): BunClient {
  const executor: SyncExecutor = {
    query<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      if (returnsRows(query.sql)) {
        return database.query<TRow>(query.sql).all(...query.args);
      }

      const result = database.run(query.sql, [...query.args]);
      return Object.assign([], {
        rowsAffected: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      });
    },
  };

  return {
    ...executor,
    database,
    sql: bindSyncSql(executor),
  };
}

export const createBunDatabase = createBunClient;

function returnsRows(query: string): boolean {
  const firstKeyword = query.trimStart().match(/^[a-z]+/iu)?.[0]?.toLowerCase();
  return (
    firstKeyword === 'select' ||
    firstKeyword === 'pragma' ||
    firstKeyword === 'explain' ||
    firstKeyword === 'values' ||
    firstKeyword === 'with'
  );
}
