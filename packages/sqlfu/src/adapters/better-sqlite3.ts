import {bindSyncSql} from '../core/sql.js';
import type {ResultRow, SqlQuery, SyncExecutor, SyncSqlClient} from '../core/types.js';

export interface BetterSqlite3RunResult {
  readonly changes?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface BetterSqlite3StatementLike<TRow extends ResultRow = ResultRow> {
  readonly reader: boolean;
  all(...params: readonly unknown[]): TRow[];
  run(...params: readonly unknown[]): BetterSqlite3RunResult;
}

export interface BetterSqlite3DatabaseLike {
  prepare<TRow extends ResultRow = ResultRow>(query: string): BetterSqlite3StatementLike<TRow>;
}

export interface BetterSqlite3Client extends SyncSqlClient {
  readonly database: BetterSqlite3DatabaseLike;
}

export function createBetterSqlite3Client(database: BetterSqlite3DatabaseLike): BetterSqlite3Client {
  const executor: SyncExecutor = {
    query<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const statement = database.prepare<TRow>(query.sql);
      if (statement.reader) {
        return statement.all(...query.args);
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

export const createBetterSqlite3Database = createBetterSqlite3Client;
