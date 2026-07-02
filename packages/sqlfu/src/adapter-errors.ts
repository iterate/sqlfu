import {mapSqliteDriverError} from './errors.js';
import {assertRowlessQueryHasNoMapper, bindAsyncSql, bindSyncSql, mapSqlQueryRows, readSqlQueryMapper} from './sql.js';
import type {AsyncClient, PreparedStatement, ResultRow, SqlQuery, SyncClient, SyncPreparedStatement} from './types.js';

/**
 * Wrap a `SyncClient` to enforce the shared adapter boundary contract, applied
 * once at adapter-factory exit rather than per call (mirrors
 * `instrumentClient` structurally):
 *
 * - every error from `all` / `run` / `raw` / `iterate` is normalized via
 *   `mapSqliteDriverError`, with `system` read from the client's own field so
 *   adapters don't have to pass it twice
 * - `.map(...)` mappers attached to queries are applied to returned rows
 *   (and rejected on `run`, which returns no rows for a mapper to shape)
 *
 * Transactions re-wrap the inner client so queries inside a tx get the same
 * contract as queries outside it.
 */
export function wrapSyncClientErrors<TDriver>(client: SyncClient<TDriver>): SyncClient<TDriver> {
  const mapQuery = (error: unknown, query: SqlQuery) => mapSqliteDriverError(error, {query, system: client.system});

  const wrapped: Omit<SyncClient<TDriver>, 'sql'> & {sql: SyncClient<TDriver>['sql']} = {
    driver: client.driver,
    system: client.system,
    sync: true,
    all(query) {
      try {
        return mapSqlQueryRows(query, client.all(query));
      } catch (error) {
        throw mapQuery(error, query);
      }
    },
    run(query) {
      assertRowlessQueryHasNoMapper(query);
      try {
        return client.run(query);
      } catch (error) {
        throw mapQuery(error, query);
      }
    },
    raw(sql) {
      try {
        return client.raw(sql);
      } catch (error) {
        throw mapQuery(error, {sql, args: []});
      }
    },
    *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery): Iterable<TRow> {
      const mapper = readSqlQueryMapper(query);
      try {
        for (const row of client.iterate<TRow>(query)) {
          yield (mapper ? mapper(row) : row) as TRow;
        }
      } catch (error) {
        throw mapQuery(error, query);
      }
    },
    prepare<TRow extends ResultRow = ResultRow>(sql: string): SyncPreparedStatement<TRow> {
      let stmt: SyncPreparedStatement<TRow>;
      try {
        stmt = client.prepare<TRow>(sql);
      } catch (error) {
        throw mapQuery(error, {sql, args: []});
      }
      return {
        all(params) {
          try {
            return stmt.all(params);
          } catch (error) {
            throw mapQuery(error, {sql, args: []});
          }
        },
        run(params) {
          try {
            return stmt.run(params);
          } catch (error) {
            throw mapQuery(error, {sql, args: []});
          }
        },
        *iterate(params) {
          try {
            yield* stmt.iterate(params);
          } catch (error) {
            throw mapQuery(error, {sql, args: []});
          }
        },
        [Symbol.dispose]() {
          stmt[Symbol.dispose]();
        },
      };
    },
    transaction: (<TResult>(fn: (tx: SyncClient<TDriver>) => TResult) =>
      client.transaction((tx: SyncClient<TDriver>) =>
        fn(wrapSyncClientErrors(tx)),
      )) as SyncClient<TDriver>['transaction'],
    sql: undefined as unknown as SyncClient<TDriver>['sql'],
  };
  wrapped.sql = bindSyncSql(wrapped);
  return wrapped;
}

export function wrapAsyncClientErrors<TDriver>(client: AsyncClient<TDriver>): AsyncClient<TDriver> {
  const mapQuery = (error: unknown, query: SqlQuery) => mapSqliteDriverError(error, {query, system: client.system});

  const wrapped: Omit<AsyncClient<TDriver>, 'sql'> & {sql: AsyncClient<TDriver>['sql']} = {
    driver: client.driver,
    system: client.system,
    sync: false,
    async all(query) {
      try {
        return mapSqlQueryRows(query, await client.all(query));
      } catch (error) {
        throw mapQuery(error, query);
      }
    },
    async run(query) {
      assertRowlessQueryHasNoMapper(query);
      try {
        return await client.run(query);
      } catch (error) {
        throw mapQuery(error, query);
      }
    },
    async raw(sql) {
      try {
        return await client.raw(sql);
      } catch (error) {
        throw mapQuery(error, {sql, args: []});
      }
    },
    async *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery): AsyncIterable<TRow> {
      const mapper = readSqlQueryMapper(query);
      try {
        for await (const row of client.iterate<TRow>(query)) {
          yield (mapper ? mapper(row) : row) as TRow;
        }
      } catch (error) {
        throw mapQuery(error, query);
      }
    },
    prepare<TRow extends ResultRow = ResultRow>(sql: string): PreparedStatement<TRow> {
      let stmt: PreparedStatement<TRow>;
      try {
        stmt = client.prepare<TRow>(sql);
      } catch (error) {
        throw mapQuery(error, {sql, args: []});
      }
      return {
        async all(params) {
          try {
            return await stmt.all(params);
          } catch (error) {
            throw mapQuery(error, {sql, args: []});
          }
        },
        async run(params) {
          try {
            return await stmt.run(params);
          } catch (error) {
            throw mapQuery(error, {sql, args: []});
          }
        },
        async *iterate(params) {
          try {
            yield* stmt.iterate(params);
          } catch (error) {
            throw mapQuery(error, {sql, args: []});
          }
        },
        async [Symbol.asyncDispose]() {
          await stmt[Symbol.asyncDispose]();
        },
      };
    },
    transaction: (fn) => client.transaction((tx) => fn(wrapAsyncClientErrors(tx))),
    sql: undefined as unknown as AsyncClient<TDriver>['sql'],
  };
  wrapped.sql = bindAsyncSql(wrapped);
  return wrapped;
}
