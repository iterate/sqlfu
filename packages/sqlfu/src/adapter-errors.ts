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
 *   (and rejected on `run`, which returns no rows for a mapper to shape).
 *   Mappers run outside the error wrapper: a throwing mapper is the user's
 *   own code failing, not a driver error, so it surfaces raw.
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
    all<TRow extends ResultRow = ResultRow>(query: SqlQuery): TRow[] {
      let rows: TRow[];
      try {
        rows = client.all<TRow>(query);
      } catch (error) {
        throw mapQuery(error, query);
      }
      return mapSqlQueryRows(query, rows);
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
      const rows = wrapIterationErrors(
        () => client.iterate<TRow>(query),
        (error) => mapQuery(error, query),
      );
      if (!mapper) {
        yield* rows;
        return;
      }
      for (const row of rows) {
        yield mapper(row) as TRow;
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
    async all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<TRow[]> {
      let rows: TRow[];
      try {
        rows = await client.all<TRow>(query);
      } catch (error) {
        throw mapQuery(error, query);
      }
      return mapSqlQueryRows(query, rows);
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
      const rows = wrapAsyncIterationErrors(
        () => client.iterate<TRow>(query),
        (error) => mapQuery(error, query),
      );
      if (!mapper) {
        yield* rows;
        return;
      }
      for await (const row of rows) {
        yield mapper(row) as TRow;
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

/**
 * Delegate to a driver iterable with its errors normalized, so callers can
 * apply query mappers per row *outside* this wrapper — a throwing mapper must
 * surface raw, not disguised as a driver error.
 */
function* wrapIterationErrors<TRow>(rows: () => Iterable<TRow>, wrap: (error: unknown) => Error): Generator<TRow> {
  try {
    yield* rows();
  } catch (error) {
    throw wrap(error);
  }
}

async function* wrapAsyncIterationErrors<TRow>(
  rows: () => AsyncIterable<TRow>,
  wrap: (error: unknown) => Error,
): AsyncGenerator<TRow> {
  try {
    yield* rows();
  } catch (error) {
    throw wrap(error);
  }
}
