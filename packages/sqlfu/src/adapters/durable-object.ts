import {bindSyncSql} from '../core/sql.js';
import type {ResultRow, SqlQuery, SyncExecutor, SyncSqlClient} from '../core/types.js';

export interface DurableObjectSqlStorageCursorLike<TRow extends ResultRow = ResultRow> {
  toArray(): TRow[];
  readonly rowsWritten?: number;
}

export interface DurableObjectSqlStorageLike {
  exec<TRow extends ResultRow = ResultRow>(
    query: string,
    ...bindings: readonly unknown[]
  ): DurableObjectSqlStorageCursorLike<TRow>;
}

export interface DurableObjectClient extends SyncSqlClient {
  readonly storage: DurableObjectSqlStorageLike;
}

export function createDurableObjectClient(storage: DurableObjectSqlStorageLike): DurableObjectClient {
  const executor: SyncExecutor = {
    query<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const cursor = storage.exec<TRow>(query.sql, ...query.args);
      return cursor.toArray();
    },
  };

  return {
    ...executor,
    storage,
    sql: bindSyncSql(executor),
  };
}

export const createDurableObjectDatabase = createDurableObjectClient;
