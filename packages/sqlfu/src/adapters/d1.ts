import {bindAsyncSql} from '../core/sql.js';
import type {AsyncClient, ResultRow, SqlQuery} from '../core/types.js';

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = ResultRow>(): Promise<{results: T[]}>;
  first<T = ResultRow>(columnName?: string): Promise<T | null>;
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

export function createD1Client(database: D1DatabaseLike): AsyncClient<D1DatabaseLike> {
  const all: AsyncClient<D1DatabaseLike>['all'] = async <TRow extends ResultRow = ResultRow>(sqlQuery: SqlQuery) => {
    const result = await database.prepare(sqlQuery.sql).bind(...sqlQuery.args).all<TRow>();
    return result.results;
  };
  const run: AsyncClient<D1DatabaseLike>['run'] = async (sqlQuery: SqlQuery) => {
    const statement = database.prepare(sqlQuery.sql).bind(...sqlQuery.args);
    const result = await statement.run();
    return {
      rowsAffected: result.meta?.changes,
      lastInsertRowid: result.meta?.last_row_id,
    };
  };
  const iterate: AsyncClient<D1DatabaseLike>['iterate'] = async function* <TRow extends ResultRow = ResultRow>(sqlQuery: SqlQuery) {
    for (const row of await all<TRow>(sqlQuery)) {
      yield row;
    }
  };
  const d1Client = {
    driver: database,
    all,
    run,
    iterate,
    sql: undefined as unknown as AsyncClient<D1DatabaseLike>['sql'],
  } satisfies AsyncClient<D1DatabaseLike>;

  d1Client.sql = bindAsyncSql(d1Client);

  return d1Client;
}

export const createD1Database = createD1Client;
