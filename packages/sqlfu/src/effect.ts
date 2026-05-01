import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

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
  all(params?: PreparedStatementParams): Effect.Effect<TRow[], unknown>;
  run(params?: PreparedStatementParams): Effect.Effect<RunResult, unknown>;
}

export interface EffectClient<TDriver = unknown> {
  driver: TDriver;
  system: string;
  sync: boolean;
  all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Effect.Effect<TRow[], unknown>;
  run(query: SqlQuery): Effect.Effect<RunResult, unknown>;
  raw(sql: string): Effect.Effect<RunResult, unknown>;
  prepare<TRow extends ResultRow = ResultRow>(sql: string): Effect.Effect<EffectPreparedStatement<TRow>, unknown>;
}

export function toEffectClient<TDriver>(client: Client<TDriver>): EffectClient<TDriver> {
  return {
    driver: client.driver,
    system: client.system,
    sync: client.sync,
    all: (query) => runClientOperation(client, () => client.all(query)),
    run: (query) => runClientOperation(client, () => client.run(query)),
    raw: (sql) => runClientOperation(client, () => client.raw(sql)),
    prepare<TRow extends ResultRow = ResultRow>(sql: string) {
      return runClientOperation<SyncPreparedStatement<TRow> | PreparedStatement<TRow>>(client, () =>
        client.prepare<TRow>(sql),
      ).pipe(Effect.map((statement) => toEffectPreparedStatement(client.sync, statement)));
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
  run: () => TResult | Promise<TResult>,
): Effect.Effect<TResult, unknown> {
  return runOperation(client.sync, run);
}

function toEffectPreparedStatement<TRow extends ResultRow>(
  sync: boolean,
  statement: SyncPreparedStatement<TRow> | PreparedStatement<TRow>,
): EffectPreparedStatement<TRow> {
  return {
    all: (params) => runOperation(sync, () => statement.all(params)),
    run: (params) => runOperation(sync, () => statement.run(params)),
  };
}

function runOperation<TResult>(sync: boolean, run: () => TResult | Promise<TResult>): Effect.Effect<TResult, unknown> {
  if (sync) {
    return Effect.try({
      try: () => run() as TResult,
      catch: (error) => error,
    });
  }

  return Effect.tryPromise({
    try: () => Promise.resolve(run()),
    catch: (error) => error,
  });
}
