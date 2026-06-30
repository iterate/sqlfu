import {applyMigrations, type Migration} from './migrations/index.js';
import {readSqlQueryMapper} from './sql.js';
import type {
  AsyncClient,
  Client,
  PreparedStatementParams,
  QueryMetadata,
  QueryResultMode,
  ResultRow,
  RunResult,
  SqlQueryNoArgs,
  SqlTypedQueryNoArgs,
  SyncClient,
} from './types.js';

export type InlineConfigQueryType = {
  parameters?: PreparedStatementParams;
  result?: ResultRow;
};

export type InlineConfigMigration = {
  name: string;
  content: SqlQueryNoArgs;
};

export type InlineConfigQuery<TType extends InlineConfigQueryType = InlineConfigQueryType> =
  | SqlTypedQueryNoArgs<TType>
  | SqlQueryNoArgs;

export type InlineConfigDefinition<TQueries extends Record<string, InlineConfigQuery>> = {
  definitions: SqlQueryNoArgs;
  migrations?: InlineConfigMigration[];
  queries: TQueries;
};

type InlineQueryTypePayload<TQuery> = TQuery extends {__sqlfuType?: infer TType} ? TType : {};

type InlineQueryParameters<TQuery> =
  InlineQueryTypePayload<TQuery> extends {parameters: infer TParameters}
    ? [parameters: TParameters]
    : unknown extends InlineQueryTypePayload<TQuery>
      ? [parameters?: Record<string, unknown>]
      : [];

type InlineQueryResult<TQuery> =
  InlineQueryTypePayload<TQuery> extends {result: infer TResult} ? TResult : QueryMetadata;

type InlineQueryMode<TQuery> = TQuery extends {mode: infer TMode} ? TMode : 'metadata';

type InlineQueryReturn<TClient extends Client, TQuery> = TClient extends SyncClient
  ? InlineSyncQueryReturn<TQuery>
  : Promise<InlineSyncQueryReturn<TQuery>>;

type InlineSyncQueryReturn<TQuery> =
  InlineQueryMode<TQuery> extends 'many'
    ? InlineQueryResult<TQuery>[]
    : InlineQueryMode<TQuery> extends 'nullableOne'
      ? InlineQueryResult<TQuery> | null
      : InlineQueryMode<TQuery> extends 'one'
        ? InlineQueryResult<TQuery>
        : RunResult;

type InlineConfigBound<TQueries extends Record<string, InlineConfigQuery>, TClient extends Client> = {
  [TName in keyof TQueries]: (
    ...args: InlineQueryParameters<TQueries[TName]>
  ) => InlineQueryReturn<TClient, TQueries[TName]>;
} & {
  migrate(): TClient extends SyncClient ? void : Promise<void>;
};

type InlineRuntimeQueryResult = RunResult | ResultRow | ResultRow[] | null;

export type InlineConfigFactory<TQueries extends Record<string, InlineConfigQuery>> = {
  <TClient extends Client>(client: TClient): InlineConfigBound<TQueries, TClient>;
  $type: InlineConfigBound<TQueries, Client>;
  config: InlineConfigDefinition<TQueries>;
};

export function defineInlineConfig<const TQueries extends Record<string, InlineConfigQuery>>(
  definition: InlineConfigDefinition<TQueries>,
): InlineConfigFactory<TQueries> {
  const factory = (<TClient extends Client>(client: TClient) => {
    const bound: Record<string, unknown> = {
      migrate() {
        return applyMigrations(client, {
          migrations: inlineMigrations(definition.migrations || []),
          preset: 'sqlfu',
        }) as TClient extends SyncClient ? void : Promise<void>;
      },
    };

    for (const [name, query] of Object.entries(definition.queries)) {
      bound[name] = bindInlineQuery(client, query);
    }

    return bound as InlineConfigBound<TQueries, TClient>;
  }) as InlineConfigFactory<TQueries>;

  factory.$type = {} as InlineConfigBound<TQueries, Client>;
  factory.config = definition;
  return factory;
}

function inlineMigrations(migrations: InlineConfigMigration[]): Migration[] {
  return migrations.map((migration) => {
    if (migration.content.args.length > 0) {
      throw new Error(`Inline migration ${JSON.stringify(migration.name)} cannot use template interpolations.`);
    }
    return {
      path: `${migration.name}.sql`,
      content: migration.content.sql,
    };
  });
}

/**
 * Mode and shape validation depend only on the static query definition, so
 * they run once at bind time and the per-call closure only executes — this
 * runs on every query inside a durable object's single-threaded event loop.
 * Validation errors still surface on first call rather than at bind, so an
 * ungenerated module can still construct its durable object.
 */
function bindInlineQuery(
  client: Client,
  query: InlineConfigQuery,
): (params?: PreparedStatementParams) => InlineRuntimeQueryResult | Promise<InlineRuntimeQueryResult> {
  try {
    const mode = readInlineQueryMode(query);
    if (query.args.length > 0) {
      throw new Error('Inline queries cannot use template interpolations.');
    }
    const mapper = readSqlQueryMapper(query);
    return client.sync
      ? (params) => runInlineSyncQuery(client as SyncClient, query.sql, mode, params, mapper)
      : (params) => runInlineAsyncQuery(client as AsyncClient, query.sql, mode, params, mapper);
  } catch (error) {
    return () => {
      throw error;
    };
  }
}

function runInlineSyncQuery(
  client: SyncClient,
  sql: string,
  mode: QueryResultMode,
  params: PreparedStatementParams | undefined,
  mapper: ((result: ResultRow) => ResultRow) | undefined,
): InlineRuntimeQueryResult {
  using stmt = client.prepare(sql);
  if (mode === 'metadata') return stmt.run(params);
  return inlineRowsResult(stmt.all(params), mode, mapper);
}

async function runInlineAsyncQuery(
  client: AsyncClient,
  sql: string,
  mode: QueryResultMode,
  params: PreparedStatementParams | undefined,
  mapper: ((result: ResultRow) => ResultRow) | undefined,
): Promise<InlineRuntimeQueryResult> {
  const stmt = client.prepare(sql);
  try {
    if (mode === 'metadata') return await stmt.run(params);
    return inlineRowsResult(await stmt.all(params), mode, mapper);
  } finally {
    await stmt[Symbol.asyncDispose]();
  }
}

function readInlineQueryMode(query: InlineConfigQuery): QueryResultMode {
  const mode: unknown = 'mode' in query ? query.mode : undefined;
  if (isQueryResultMode(mode)) {
    return mode;
  }
  if (!mode) {
    throw new Error('Inline query is missing generated mode. Run sqlfu generate before binding inline defineConfig().');
  }
  throw new Error(`Inline query has unsupported generated mode ${JSON.stringify(mode)}.`);
}

function isQueryResultMode(value: unknown): value is QueryResultMode {
  return value === 'many' || value === 'nullableOne' || value === 'one' || value === 'metadata';
}

function inlineRowsResult(
  rows: ResultRow[],
  mode: QueryResultMode,
  mapper: ((result: ResultRow) => ResultRow) | undefined,
): ResultRow | ResultRow[] | null {
  if (mode === 'many') return mapper ? rows.map(mapper) : rows;
  if (mode === 'nullableOne') {
    const row = rows[0];
    if (!row) return null;
    return mapper ? mapper(row) : row;
  }
  if (mode === 'one') {
    const row = rows[0]!;
    return mapper ? mapper(row) : row;
  }
  throw new Error(`Inline query mode ${JSON.stringify(mode)} cannot return rows.`);
}
