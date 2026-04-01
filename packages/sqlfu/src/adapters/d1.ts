import {bindAsyncSql} from '../core/sql.js';
import type {AsyncExecutor, AsyncSqlClient, ResultRow, SqlQuery} from '../core/types.js';

export interface D1ResultRow extends ResultRow {
  [key: string]: unknown;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = D1ResultRow>(): Promise<{results: T[]}>;
  first<T = D1ResultRow>(columnName?: string): Promise<T | null>;
  run(): Promise<{
    success: boolean;
    meta?: {
      changes?: number;
      last_row_id?: number | string;
    };
  }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

export interface D1Client extends AsyncSqlClient {}

export function createD1Client(database: D1DatabaseLike): D1Client {
  const executor: AsyncExecutor = {
    async query<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const result = await database.prepare(query.sql).bind(...query.args).all<TRow>();
      return result.results;
    },
  };

  return {
    ...executor,
    sql: bindAsyncSql(executor),
  };
}

export const createD1Database = createD1Client;
