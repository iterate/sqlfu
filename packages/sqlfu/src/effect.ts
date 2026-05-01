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

export interface EffectPreparedStatement<TRow extends ResultRow = ResultRow> {
  all(params?: PreparedStatementParams): Effect.Effect<TRow[], SqlfuError>;
  run(params?: PreparedStatementParams): Effect.Effect<RunResult, SqlfuError>;
}

export interface EffectClient<TDriver = unknown> {
  driver: TDriver;
  system: string;
  sync: boolean;
  all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Effect.Effect<TRow[], SqlfuError>;
  run(query: SqlQuery): Effect.Effect<RunResult, SqlfuError>;
  raw(sql: string): Effect.Effect<RunResult, SqlfuError>;
  prepare<TRow extends ResultRow = ResultRow>(sql: string): Effect.Effect<EffectPreparedStatement<TRow>, SqlfuError>;
}

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
