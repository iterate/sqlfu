import {bindSyncSql} from '../core/sql.js';
import type {ResultRow, SqlQuery, SyncExecutor, SyncSqlClient} from '../core/types.js';

export interface LibsqlSyncRunResult {
  readonly changes?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface LibsqlSyncStatementLike {
  readonly reader: boolean;
  all(...params: readonly unknown[]): unknown[];
  run(...params: readonly unknown[]): LibsqlSyncRunResult;
}

export interface LibsqlSyncDatabaseLike {
  prepare(query: string): LibsqlSyncStatementLike;
}

export interface LibsqlSyncClient extends SyncSqlClient {
  readonly database: LibsqlSyncDatabaseLike;
}

export function createLibsqlSyncClient(database: LibsqlSyncDatabaseLike): LibsqlSyncClient {
  const executor: SyncExecutor = {
    query<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const statement = database.prepare(query.sql);
      if (statement.reader) {
        return statement.all(...query.args) as TRow[];
      }

      const result = statement.run(...query.args);
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

export const createLibsqlSyncDatabase = createLibsqlSyncClient;
