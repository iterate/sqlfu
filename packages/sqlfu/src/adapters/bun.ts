import {bindSyncSql} from '../core/sql.js';
import type {ResultRow, SqlQuery, SyncClient} from '../core/types.js';

export interface BunSqliteStatementLike<TRow extends ResultRow = ResultRow> {
  all(...params: readonly unknown[]): TRow[];
  iterate(...params: readonly unknown[]): IterableIterator<TRow>;
}

export interface BunSqliteDatabaseLike {
  query<TRow extends ResultRow = ResultRow>(query: string): BunSqliteStatementLike<TRow>;
  run(query: string, params?: readonly unknown[]): {
    readonly changes?: number;
    readonly lastInsertRowid?: string | number | bigint | null;
  };
}

export function createBunClient(database: BunSqliteDatabaseLike): SyncClient<BunSqliteDatabaseLike> {
  const client = {
    driver: database,
    all<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      return database.query<TRow>(query.sql).all(...query.args);
    },
    run(query: SqlQuery) {
      const result = database.run(query.sql, [...query.args]);
      return {
        rowsAffected: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      };
    },
    *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      yield* database.query<TRow>(query.sql).iterate(...query.args);
    },
    sql: undefined as unknown as SyncClient<BunSqliteDatabaseLike>['sql'],
  } satisfies SyncClient<BunSqliteDatabaseLike>;

  client.sql = bindSyncSql(client);

  return client;
}

export const createBunDatabase = createBunClient;
