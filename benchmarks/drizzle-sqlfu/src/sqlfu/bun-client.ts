// Adapted from drizzle-team/drizzle-benchmarks. This local copy keeps the benchmark shape comparable and adds sqlfu targets for side-by-side runs.
import {createHash} from 'crypto';
import type {SQL} from 'bun';
import type {
  AsyncClient,
  PreparedStatement,
  PreparedStatementParams,
  QueryArg,
  ResultRow,
  RunResult,
  SqlQuery,
} from '../../../../packages/sqlfu/src/types';

export function createSqlfuBunClient(sql: SQL): AsyncClient<SQL> {
  const client: AsyncClient<SQL> = {
    driver: sql,
    system: 'postgresql',
    sync: false,
    async all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<TRow[]> {
      return (await sql.unsafe(query.sql, [...query.args])) as TRow[];
    },
    async run(query: SqlQuery): Promise<RunResult> {
      const result = (await sql.unsafe(query.sql, [...query.args])) as unknown;
      return {rowsAffected: Number((result as {count?: number}).count || 0)};
    },
    async raw(query: string): Promise<RunResult> {
      const result = (await sql.unsafe(query)) as unknown;
      return {rowsAffected: Number((result as {count?: number}).count || 0)};
    },
    async *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery): AsyncIterable<TRow> {
      const rows = await client.all<TRow>(query);
      yield* rows;
    },
    prepare<TRow extends ResultRow = ResultRow>(query: string): PreparedStatement<TRow> {
      const name = `sqlfu_${createHash('sha256').update(query).digest('hex').slice(0, 16)}`;
      return {
        all(params) {
          return client.all<TRow>({sql: query, args: bindParams(params), name});
        },
        run(params) {
          return client.run({sql: query, args: bindParams(params), name});
        },
        async *iterate(params) {
          const rows = await client.all<TRow>({sql: query, args: bindParams(params), name});
          yield* rows;
        },
        async [Symbol.asyncDispose]() {},
      };
    },
    transaction() {
      throw new Error('sqlfu drizzle benchmark Bun SQL client does not implement transactions.');
    },
    sql: undefined as unknown as AsyncClient<SQL>['sql'],
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
