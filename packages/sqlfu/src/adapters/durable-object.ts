import {bindSql} from '../core/sql.js';
import type {AsyncExecutor, QueryResult, ResultRow, SqlQuery} from '../core/types.js';

export interface DurableObjectSqlStorageCursorLike<TRow extends ResultRow = ResultRow> {
  toArray(): readonly TRow[];
  readonly rowsWritten?: number;
}

export interface DurableObjectSqlStorageLike {
  exec<TRow extends ResultRow = ResultRow>(
    query: string,
    ...bindings: readonly unknown[]
  ): DurableObjectSqlStorageCursorLike<TRow>;
}

export interface DurableObjectDatabase extends AsyncExecutor {
  readonly sql: ReturnType<typeof bindSql>;
  readonly storage: DurableObjectSqlStorageLike;
}

export function createDurableObjectDatabase(storage: DurableObjectSqlStorageLike): DurableObjectDatabase {
  const executor: AsyncExecutor = {
    async query<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<QueryResult<TRow>> {
      const cursor = storage.exec<TRow>(query.sql, ...query.args);
      return {
        rows: cursor.toArray(),
        rowsAffected: cursor.rowsWritten ?? 0,
        lastInsertRowid: null,
      };
    },
  };

  return {
    ...executor,
    storage,
    sql: bindSql(executor),
  };
}
