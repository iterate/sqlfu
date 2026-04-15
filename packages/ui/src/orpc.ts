import {os} from '@orpc/server';
import {z} from 'zod';

import type {QueryCatalog, SqlfuProjectConfig} from 'sqlfu/experimental';
import type {
  MigrationResultantSchemaResponse,
  QueryFileMutationResponse,
  QueryExecutionResponse,
  SaveSqlResponse,
  SchemaAuthoritiesResponse,
  SchemaCheckResponse,
  SqlAnalysisResponse,
  SqlRunnerResponse,
  StudioSchemaResponse,
  TableRowKey,
  TableRowsResponse,
} from './shared.js';

export type UiRouterContext = {
  config: SqlfuProjectConfig;
};

const rowRecordSchema = z.record(z.string(), z.unknown());
const tableRowKeySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('primaryKey'),
    values: z.record(z.string(), z.unknown()),
  }),
  z.object({
    kind: z.literal('new'),
    value: z.string(),
  }),
  z.object({
    kind: z.literal('rowid'),
    value: z.number(),
  }),
]) satisfies z.ZodType<TableRowKey>;

export function createUiRouter(handlers: {
  getSchema(dbPath: string): Promise<StudioSchemaResponse>;
  loadCatalog(config: SqlfuProjectConfig): Promise<QueryCatalog>;
  getSchemaCheck(config: SqlfuProjectConfig): Promise<SchemaCheckResponse>;
  getSchemaAuthorities(config: SqlfuProjectConfig): Promise<SchemaAuthoritiesResponse>;
  getMigrationResultantSchema(config: SqlfuProjectConfig, input: {source: 'migrations' | 'history'; id: string}): Promise<MigrationResultantSchemaResponse>;
  listTableRows(dbPath: string, relationName: string, page: number): Promise<TableRowsResponse>;
  saveTableRows(
    dbPath: string,
    relationName: string,
    input: {
      page: number;
      originalRows: unknown[];
      rows: unknown[];
      rowKeys: TableRowKey[];
    },
  ): Promise<TableRowsResponse>;
  deleteTableRow(
    dbPath: string,
    relationName: string,
    input: {
      page: number;
      originalRow: unknown;
      rowKey: TableRowKey | undefined;
    },
  ): Promise<TableRowsResponse>;
  runSql(config: SqlfuProjectConfig, input: {sql: string; params: unknown}): Promise<SqlRunnerResponse>;
  analyzeSql(config: SqlfuProjectConfig, input: {sql: string}): Promise<SqlAnalysisResponse>;
  saveSqlQuery(config: SqlfuProjectConfig, input: {sql: string; name: string}): Promise<SaveSqlResponse>;
  runSchemaCommand(config: SqlfuProjectConfig, input: {command: string}): Promise<{ok: true}>;
  saveDefinitionsSql(config: SqlfuProjectConfig, input: {sql: string}): Promise<{ok: true}>;
  executeCatalogQuery(
    config: SqlfuProjectConfig,
    queryId: string,
    input: {
      data?: Record<string, unknown>;
      params?: Record<string, unknown>;
    },
  ): Promise<QueryExecutionResponse>;
  updateQueryFile(config: SqlfuProjectConfig, queryId: string, input: {sql: string}): Promise<QueryFileMutationResponse>;
  renameQueryFile(config: SqlfuProjectConfig, queryId: string, input: {name: string}): Promise<QueryFileMutationResponse>;
  deleteQueryFile(config: SqlfuProjectConfig, queryId: string): Promise<QueryFileMutationResponse>;
}) {
  const base = os.$context<UiRouterContext>();

  return {
    schema: {
      get: base.handler(({context}) => handlers.getSchema(context.config.db)),
      check: base.handler(({context}) => handlers.getSchemaCheck(context.config)),
      authorities: {
        get: base.handler(({context}) => handlers.getSchemaAuthorities(context.config)),
        resultantSchema: base
          .input(z.object({
            source: z.enum(['migrations', 'history']),
            id: z.string(),
          }))
          .handler(({context, input}) => handlers.getMigrationResultantSchema(context.config, input)),
      },
      command: base
        .input(z.object({
          command: z.string(),
        }))
        .handler(({context, input}) => handlers.runSchemaCommand(context.config, input)),
      definitions: base
        .input(z.object({
          sql: z.string(),
        }))
        .handler(({context, input}) => handlers.saveDefinitionsSql(context.config, input)),
    },
    catalog: base.handler(({context}) => handlers.loadCatalog(context.config)),
    table: {
      list: base
        .input(z.object({
          relationName: z.string(),
          page: z.number().int(),
        }))
        .handler(({context, input}) => handlers.listTableRows(context.config.db, input.relationName, input.page)),
      save: base
        .input(z.object({
          relationName: z.string(),
          page: z.number().int(),
          originalRows: z.array(rowRecordSchema),
          rows: z.array(rowRecordSchema),
          rowKeys: z.array(tableRowKeySchema),
        }))
        .handler(({context, input}) => handlers.saveTableRows(context.config.db, input.relationName, input)),
      delete: base
        .input(z.object({
          relationName: z.string(),
          page: z.number().int(),
          originalRow: rowRecordSchema,
          rowKey: tableRowKeySchema,
        }))
        .handler(({context, input}) => handlers.deleteTableRow(context.config.db, input.relationName, input)),
    },
    sql: {
      run: base
        .input(z.object({
          sql: z.string(),
          params: z.unknown().optional(),
        }))
        .handler(({context, input}) => handlers.runSql(context.config, {
          sql: input.sql,
          params: input.params,
        })),
      analyze: base
        .input(z.object({
          sql: z.string(),
        }))
        .handler(({context, input}) => handlers.analyzeSql(context.config, input)),
      save: base
        .input(z.object({
          sql: z.string(),
          name: z.string(),
        }))
        .handler(({context, input}) => handlers.saveSqlQuery(context.config, input)),
    },
    query: {
      execute: base
        .input(z.object({
          queryId: z.string(),
          data: z.record(z.string(), z.unknown()).optional(),
          params: z.record(z.string(), z.unknown()).optional(),
        }))
        .handler(({context, input}) => handlers.executeCatalogQuery(context.config, input.queryId, {
          data: input.data,
          params: input.params,
        })),
      update: base
        .input(z.object({
          queryId: z.string(),
          sql: z.string(),
        }))
        .handler(({context, input}) => handlers.updateQueryFile(context.config, input.queryId, {
          sql: input.sql,
        })),
      rename: base
        .input(z.object({
          queryId: z.string(),
          name: z.string(),
        }))
        .handler(({context, input}) => handlers.renameQueryFile(context.config, input.queryId, {
          name: input.name,
        })),
      delete: base
        .input(z.object({
          queryId: z.string(),
        }))
        .handler(({context, input}) => handlers.deleteQueryFile(context.config, input.queryId)),
    },
  };
}

export type UiRouter = ReturnType<typeof createUiRouter>;
