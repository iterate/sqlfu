import {bindSql} from '../core/sql.js';
import type {AsyncExecutor, QueryResult, ResultRow, SqlQuery} from '../core/types.js';

export interface BetterSqlite3RunResult {
  readonly changes?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface BetterSqlite3StatementLike<TRow extends ResultRow = ResultRow> {
  readonly reader: boolean;
  all(...params: readonly unknown[]): readonly TRow[];
  run(...params: readonly unknown[]): BetterSqlite3RunResult;
}

export interface BetterSqlite3DatabaseLike {
  prepare<TRow extends ResultRow = ResultRow>(query: string): BetterSqlite3StatementLike<TRow>;
}

export interface BetterSqlite3Database extends AsyncExecutor {
  readonly sql: ReturnType<typeof bindSql>;
  readonly database: BetterSqlite3DatabaseLike;
}

export function createBetterSqlite3Database(database: BetterSqlite3DatabaseLike): BetterSqlite3Database {
  const executor: AsyncExecutor = {
    async query<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<QueryResult<TRow>> {
      const statement = database.prepare<TRow>(query.sql);
      if (statement.reader) {
        return {
          rows: statement.all(...query.args),
          rowsAffected: 0,
          lastInsertRowid: null,
        };
      }

      const result = statement.run(...query.args);
      return {
        rows: [],
        rowsAffected: result.changes ?? 0,
        lastInsertRowid: result.lastInsertRowid ?? null,
      };
    },
  };

  return {
    ...executor,
    database,
    sql: bindSql(executor),
  };
}
