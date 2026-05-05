/**
 * Experimental Effect interop for existing sqlfu clients.
 *
 * `sqlfu/effect` wraps the normal `Client` surface in Effect values. It does
 * not make sqlfu internally Effect-native, and it does not add generated-query
 * overloads. The wrapper is useful when the rest of an application already
 * composes work with Effect and wants sqlfu query failures in the Effect failure
 * channel as `SqlfuError`.
 *
 * @module sqlfu/effect
 * @experimental
 */

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import {mapSqliteDriverError, type SqlfuError} from './errors.js';
import type {
  Client,
  PreparedStatement,
  PreparedStatementParams,
  ResultRow,
  RunResult,
  SqlQuery,
  SyncPreparedStatement,
} from './types.js';

/**
 * Prepared statement wrapper returned by {@link EffectClient.prepare}.
 *
 * @experimental
 */
export interface EffectPreparedStatement<TRow extends ResultRow = ResultRow> {
  all(params?: PreparedStatementParams): Effect.Effect<TRow[], SqlfuError>;
  run(params?: PreparedStatementParams): Effect.Effect<RunResult, SqlfuError>;
}

/**
 * Effect-returning view of a normal sqlfu {@link Client}.
 *
 * The adapter preserves the underlying client's sync/async nature:
 * sync clients can be run with `Effect.runSync`, and async clients should be
 * run with `Effect.runPromise`.
 *
 * @experimental
 */
export interface EffectClient<TDriver = unknown> {
  driver: TDriver;
  system: string;
  sync: boolean;
  all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Effect.Effect<TRow[], SqlfuError>;
  run(query: SqlQuery): Effect.Effect<RunResult, SqlfuError>;
  raw(sql: string): Effect.Effect<RunResult, SqlfuError>;
  prepare<TRow extends ResultRow = ResultRow>(sql: string): Effect.Effect<EffectPreparedStatement<TRow>, SqlfuError>;
}

/**
 * Wrap a normal sqlfu client so query methods return Effect values.
 *
 * Driver failures are normalized through sqlfu's existing `SqlfuError`
 * classification before they enter the Effect failure channel. This mapping is
 * idempotent, so clients created by sqlfu's built-in adapters keep the same
 * error objects they would have thrown through the non-Effect API.
 *
 * @experimental
 */
export function toEffectClient<TDriver>(client: Client<TDriver>): EffectClient<TDriver> {
  return {
    driver: client.driver,
    system: client.system,
    sync: client.sync,
    all: (query) => runClientOperation(client, query, () => client.all(query)),
    run: (query) => runClientOperation(client, query, () => client.run(query)),
    raw: (sql) => runClientOperation(client, {sql, args: []}, () => client.raw(sql)),
    prepare<TRow extends ResultRow = ResultRow>(sql: string) {
      return runClientOperation<SyncPreparedStatement<TRow> | PreparedStatement<TRow>>(client, {sql, args: []}, () =>
        client.prepare<TRow>(sql),
      ).pipe(Effect.map((statement) => toEffectPreparedStatement(client.sync, client.system, sql, statement)));
    },
  };
}

/**
 * Effect Context tag for providing an {@link EffectClient} through a Layer.
 *
 * @experimental
 */
export class SqlfuClient extends Context.Tag('sqlfu/SqlfuClient')<SqlfuClient, EffectClient>() {
  static make() {
    return SqlfuClient;
  }

  static fromClient<TDriver>(client: Client<TDriver>): EffectClient<TDriver> {
    return toEffectClient(client);
  }

  static layer<TDriver>(client: Client<TDriver>) {
    return Layer.succeed(SqlfuClient, toEffectClient(client));
  }
}

function runClientOperation<TResult>(
  client: Client,
  query: SqlQuery,
  run: () => TResult | Promise<TResult>,
): Effect.Effect<TResult, SqlfuError> {
  return runOperation(client.sync, client.system, query, run);
}

function toEffectPreparedStatement<TRow extends ResultRow>(
  sync: boolean,
  system: string,
  sql: string,
  statement: SyncPreparedStatement<TRow> | PreparedStatement<TRow>,
): EffectPreparedStatement<TRow> {
  return {
    all: (params) => runOperation(sync, system, preparedQuery(sql, params), () => statement.all(params)),
    run: (params) => runOperation(sync, system, preparedQuery(sql, params), () => statement.run(params)),
  };
}

function runOperation<TResult>(
  sync: boolean,
  system: string,
  query: SqlQuery,
  run: () => TResult | Promise<TResult>,
): Effect.Effect<TResult, SqlfuError> {
  if (sync) {
    return Effect.try({
      try: () => run() as TResult,
      catch: (error) => mapSqliteDriverError(error, {query, system}),
    });
  }

  return Effect.tryPromise({
    try: () => Promise.resolve(run()),
    catch: (error) => mapSqliteDriverError(error, {query, system}),
  });
}

function preparedQuery(sql: string, params: PreparedStatementParams | undefined): SqlQuery {
  return {
    sql,
    args: Array.isArray(params) ? params : [],
  };
}
