import {bindSql} from '../core/sql.js';
import type {AsyncExecutor, QueryResult, ResultRow, SqlQuery} from '../core/types.js';

export interface BunSqliteRunResult {
  readonly changes?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface BunSqliteStatementLike<TRow extends ResultRow = ResultRow> {
  all(...params: readonly unknown[]): readonly TRow[];
}

export interface BunSqliteDatabaseLike {
  query<TRow extends ResultRow = ResultRow>(query: string): BunSqliteStatementLike<TRow>;
  run(query: string, params?: readonly unknown[]): BunSqliteRunResult;
}

export interface BunDatabase extends AsyncExecutor {
  readonly sql: ReturnType<typeof bindSql>;
  readonly database: BunSqliteDatabaseLike;
}

export function createBunDatabase(database: BunSqliteDatabaseLike): BunDatabase {
  const executor: AsyncExecutor = {
    async query<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<QueryResult<TRow>> {
      if (returnsRows(query.sql)) {
        return {
          rows: database.query<TRow>(query.sql).all(...query.args),
          rowsAffected: 0,
          lastInsertRowid: null,
        };
      }

      const result = database.run(query.sql, [...query.args]);
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
