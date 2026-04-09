import {bindSyncSql} from '../core/sql.js';
import type {ResultRow, SqlQuery, SyncClient} from '../core/types.js';

export interface DurableObjectSqlStorageLike {
  exec<TRow extends ResultRow = ResultRow>(
    query: string,
    ...bindings: readonly unknown[]
  ): {
    toArray(): TRow[];
    readonly rowsWritten?: number;
  };
}

export function createDurableObjectClient(storage: DurableObjectSqlStorageLike): SyncClient<DurableObjectSqlStorageLike> {
  const client = {
    driver: storage,
    all<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      return storage.exec<TRow>(query.sql, ...query.args).toArray();
    },
    run(query: SqlQuery) {
      const cursor = storage.exec(query.sql, ...query.args);
      return {
        rowsAffected: cursor.rowsWritten,
      };
    },
    *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const rows = storage.exec<TRow>(query.sql, ...query.args).toArray();
      yield* rows;
    },
    sql: undefined as unknown as SyncClient<DurableObjectSqlStorageLike>['sql'],
  } satisfies SyncClient<DurableObjectSqlStorageLike>;

  client.sql = bindSyncSql(client);

  return client;
}

export const createDurableObjectDatabase = createDurableObjectClient;
