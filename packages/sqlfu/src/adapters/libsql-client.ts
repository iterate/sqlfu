import {bindSql} from '../core/sql.js';
import type {AsyncExecutor, QueryResult, ResultRow, SqlQuery} from '../core/types.js';

export interface LibsqlStatementLike {
  readonly sql: string;
  readonly args?: readonly unknown[];
}

export interface LibsqlExecuteResultLike<TRow extends ResultRow = ResultRow> {
  readonly rows: readonly TRow[];
  readonly rowsAffected?: number;
  readonly lastInsertRowid?: string | number | bigint | null;
}

export interface LibsqlClientLike {
  execute<TRow extends ResultRow = ResultRow>(
    statement: string | LibsqlStatementLike,
  ): Promise<LibsqlExecuteResultLike<TRow>>;
}

export interface LibsqlDatabase extends AsyncExecutor {
  readonly sql: ReturnType<typeof bindSql>;
  readonly client: LibsqlClientLike;
}

export function createLibsqlDatabase(client: LibsqlClientLike): LibsqlDatabase {
  const executor: AsyncExecutor = {
    async query<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<QueryResult<TRow>> {
      const result = await client.execute<TRow>(toStatement(query));
      return {
        rows: result.rows,
        rowsAffected: result.rowsAffected ?? 0,
        lastInsertRowid: result.lastInsertRowid ?? null,
      };
    },
  };

  return {
    ...executor,
    client,
    sql: bindSql(executor),
  };
}

function toStatement(query: SqlQuery): LibsqlStatementLike {
  return {
    sql: query.sql,
    args: [...query.args],
  };
}
