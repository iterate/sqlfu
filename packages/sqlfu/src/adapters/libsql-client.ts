import {bindAsyncSql} from '../core/sql.js';
import type {AsyncExecutor, AsyncSqlClient, ResultRow, SqlQuery} from '../core/types.js';

export interface LibsqlStatementLike {
  readonly sql: string;
  readonly args?: readonly unknown[];
}

export interface LibsqlExecuteResultLike<TRow extends ResultRow = ResultRow> {
  readonly rows: TRow[];
  readonly rowsAffected?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface LibsqlClientLike {
  execute<TRow extends ResultRow = ResultRow>(
    statement: string | LibsqlStatementLike,
  ): Promise<LibsqlExecuteResultLike<TRow>>;
}

export interface LibsqlClient extends AsyncSqlClient {
  readonly client: LibsqlClientLike;
}

export function createLibsqlClient(client: LibsqlClientLike): LibsqlClient {
  const executor: AsyncExecutor = {
    async query<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const result = await client.execute<TRow>(toStatement(query));
      return Array.from(result.rows);
    },
  };

  return {
    ...executor,
    client,
    sql: bindAsyncSql(executor),
  };
}

export const createLibsqlDatabase = createLibsqlClient;

function toStatement(query: SqlQuery): LibsqlStatementLike {
  return {
    sql: query.sql,
    args: [...query.args],
  };
}
