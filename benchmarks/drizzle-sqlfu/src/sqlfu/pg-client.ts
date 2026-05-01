// Adapted from drizzle-team/drizzle-benchmarks. This local copy keeps the benchmark shape comparable and adds a sqlfu target for side-by-side runs.
import {createHash} from 'crypto';
import type pg from 'pg';
import type {
  AsyncClient,
  PreparedStatement,
  PreparedStatementParams,
  QueryArg,
  ResultRow,
  RunResult,
  SqlQuery,
} from '../../../../packages/sqlfu/src/types';

export function createSqlfuPgClient(pool: pg.Pool): AsyncClient<pg.Pool> {
  const client: AsyncClient<pg.Pool> = {
    driver: pool,
    system: 'postgresql',
    sync: false,
    async all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<TRow[]> {
      const result = await pool.query({
        text: query.sql,
        values: [...query.args],
        name: query.name,
      });
      return result.rows as TRow[];
    },
    async run(query: SqlQuery): Promise<RunResult> {
      const result = await pool.query({
        text: query.sql,
        values: [...query.args],
        name: query.name,
      });
      return {rowsAffected: result.rowCount || 0};
    },
    async raw(sql: string): Promise<RunResult> {
      const result = await pool.query(sql);
      return {rowsAffected: result.rowCount || 0};
    },
    async *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery): AsyncIterable<TRow> {
      const rows = await client.all<TRow>(query);
      yield* rows;
    },
    prepare<TRow extends ResultRow = ResultRow>(sql: string): PreparedStatement<TRow> {
      const name = `sqlfu_${createHash('sha256').update(sql).digest('hex').slice(0, 16)}`;
      return {
        all(params) {
          return client.all<TRow>({sql, args: bindParams(params), name});
        },
        run(params) {
          return client.run({sql, args: bindParams(params), name});
        },
        async *iterate(params) {
          const rows = await client.all<TRow>({sql, args: bindParams(params), name});
          yield* rows;
        },
        async [Symbol.asyncDispose]() {},
      };
    },
    transaction() {
      throw new Error('sqlfu drizzle benchmark pg client does not implement transactions.');
    },
    sql: undefined as unknown as AsyncClient<pg.Pool>['sql'],
  };

  return client;
}

function bindParams(params: PreparedStatementParams | undefined): QueryArg[] {
  if (!params) {
    return [];
  }
  if (Array.isArray(params)) {
    return params;
  }
  return Object.values(params) as QueryArg[];
}
