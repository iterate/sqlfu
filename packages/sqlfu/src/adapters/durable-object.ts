import {wrapSyncClientErrors} from '../adapter-errors.js';
import {bindSyncSql} from '../sql.js';
import {rawSqlWithSqlSplittingSync} from '../sqlite-text.js';
import type {ResultRow, SqlQuery, SyncClient} from '../types.js';

export interface DurableObjectSqlStorageLike {
  exec<TRow extends ResultRow = ResultRow>(
    query: string,
    ...bindings: unknown[]
  ): {
    toArray(): TRow[];
    rowsWritten?: number;
  };
}

export type DurableObjectTransactionSync = <TResult>(callback: () => TResult) => TResult;

export interface DurableObjectClientInput {
  sql: DurableObjectSqlStorageLike;
  transactionSync?: DurableObjectTransactionSync;
}

export interface DurableObjectStorageLike extends DurableObjectClientInput {
  transactionSync: DurableObjectTransactionSync;
}

export function createDurableObjectClient<TStorage extends DurableObjectClientInput>(
  storage: TStorage,
): SyncClient<TStorage> {
  const sqlStorage = getSqlStorage(storage);
  const transactionSync = getTransactionSync(storage);
  const client: Omit<SyncClient<TStorage>, 'sql'> & {
    sql: SyncClient<TStorage>['sql'];
  } = {
    driver: storage,
    system: 'sqlite',
    sync: true,
    all<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      return sqlStorage.exec<TRow>(query.sql, ...query.args).toArray();
    },
    run(query: SqlQuery) {
      const cursor = sqlStorage.exec(query.sql, ...query.args);
      return {
        rowsAffected: cursor.rowsWritten,
      };
    },
    raw(sql: string) {
      return rawSqlWithSqlSplittingSync((singleQuery) => {
        const cursor = sqlStorage.exec(singleQuery.sql, ...singleQuery.args);
        return {
          rowsAffected: cursor.rowsWritten,
        };
      }, sql);
    },
    *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      const rows = sqlStorage.exec<TRow>(query.sql, ...query.args).toArray();
      yield* rows;
    },
    transaction<TResult>(fn: (tx: SyncClient<TStorage>) => TResult | Promise<TResult>) {
      // Durable Objects reject transaction-control SQL. When callers pass full
      // ctx.storage we can use the storage-native synchronous transaction API.
      // Passing {sql: ctx.storage.sql} is still supported for query-only
      // clients, but sqlfu cannot call transactionSync from that narrower
      // handle.
      if (!transactionSync) {
        return fn(client);
      }

      return transactionSync(() => {
        const result = fn(client);
        if (isPromiseLike(result)) {
          throw new Error(
            'Durable Object transactions must be synchronous. Pass a synchronous callback or run async work outside client.transaction().',
          );
        }
        return result;
      });
    },
    sql: undefined as unknown as SyncClient<TStorage>['sql'],
  } satisfies SyncClient<TStorage>;

  client.sql = bindSyncSql(client);

  return wrapSyncClientErrors(client);
}

export const createDurableObjectDatabase = createDurableObjectClient;

function getSqlStorage(storage: DurableObjectClientInput): DurableObjectSqlStorageLike {
  if (isObject(storage) && 'sql' in storage) {
    return storage.sql as DurableObjectSqlStorageLike;
  }
  throw new Error(
    'createDurableObjectClient expects ctx.storage or {sql, transactionSync}; pass ctx.storage.sql as {sql}.',
  );
}

function getTransactionSync(storage: DurableObjectClientInput): DurableObjectStorageLike['transactionSync'] | null {
  if (typeof storage.transactionSync === 'function') {
    return storage.transactionSync.bind(storage);
  }
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPromiseLike<TResult>(value: TResult | Promise<TResult>): value is Promise<TResult> {
  return typeof value === 'object' && value !== null && 'then' in value;
}
