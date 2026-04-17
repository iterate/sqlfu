/*
 * SQLite-specific schemadiff entrypoint.
 * This file wires together SQLite inspection, planning, and scratch-database execution, and is the main seam for future dialect entrypoints.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

import {createBunClient, createNodeSqliteClient} from '../../client.js';
import {splitSqlStatements} from '../../core/sqlite.js';
import type {Client} from '../../core/types.js';
import {inspectSqliteSchema} from './inspect.js';
import {planSchemaDiff} from './plan.js';
import type {DisposableClient, SqliteInspectedDatabase} from './types.js';

export async function diffBaselineSqlToDesiredSqlNative(
  config: {projectRoot: string; tempDir?: string},
  input: {
    baselineSql: string;
    desiredSql: string;
    allowDestructive: boolean;
  },
): Promise<string[]> {
  assertNoUnsupportedSqlText(input.baselineSql, 'baselineSql');
  assertNoUnsupportedSqlText(input.desiredSql, 'desiredSql');

  await using baseline = await createScratchDatabase(config, 'baseline');
  await using desired = await createScratchDatabase(config, 'desired');

  if (input.baselineSql.trim()) {
    await applySchemaSql(baseline.client, input.baselineSql);
  }

  if (input.desiredSql.trim()) {
    await applySchemaSql(desired.client, input.desiredSql);
  }

  const [baselineSchema, desiredSchema] = await Promise.all([
    inspectSqliteSchema(baseline.client),
    inspectSqliteSchema(desired.client),
  ]);

  return planSchemaDiff({
    baseline: baselineSchema,
    desired: desiredSchema,
    allowDestructive: input.allowDestructive,
  });
}

export async function inspectSqliteSchemaSql(
  config: {projectRoot: string; tempDir?: string},
  sql: string,
): Promise<SqliteInspectedDatabase> {
  await using database = await createScratchDatabase(config, 'inspect');
  if (sql.trim()) {
    await applySchemaSql(database.client, sql);
  }
  return await inspectSqliteSchema(database.client);
}

export {inspectSqliteSchema};

export function schemasEqual(left: SqliteInspectedDatabase, right: SqliteInspectedDatabase): boolean {
  return stableStringify(toComparableSchema(left)) === stableStringify(toComparableSchema(right));
}

async function createScratchDatabase(
  config: {projectRoot: string; tempDir?: string},
  slug: string,
): Promise<DisposableClient> {
  const tempRoot = config.tempDir || path.join(config.projectRoot, '.sqlfu', 'schemadiff-native');
  await fs.mkdir(tempRoot, {recursive: true});
  const dbPath = path.join(tempRoot, `${slug}-${randomUUID()}.db`);

  if ('Bun' in globalThis) {
    const {Database} = await import('bun:sqlite' as never);
    const database = new Database(dbPath);
    return {
      client: createBunClient(database as Parameters<typeof createBunClient>[0]),
      async [Symbol.asyncDispose]() {
        database.close();
        await cleanupDbFiles(dbPath);
      },
    };
  }

  const {DatabaseSync} = await import('node:sqlite');
  const database = new DatabaseSync(dbPath);
  return {
    client: createNodeSqliteClient(database as Parameters<typeof createNodeSqliteClient>[0]),
    async [Symbol.asyncDispose]() {
      database.close();
      await cleanupDbFiles(dbPath);
    },
  };
}

async function cleanupDbFiles(dbPath: string) {
  await Promise.allSettled([
    fs.rm(dbPath, {force: true}),
    fs.rm(`${dbPath}-shm`, {force: true}),
    fs.rm(`${dbPath}-wal`, {force: true}),
  ]);
}

function assertNoUnsupportedSqlText(sql: string, source: 'baselineSql' | 'desiredSql'): void {
  const normalizedSql = sql.toLowerCase();
  if (/\bcreate\s+virtual\s+table\b/u.test(normalizedSql)) {
    throw new Error(
      `sqlite virtual tables are not supported by the native schema diff engine yet: found virtual table sql in ${source}`,
    );
  }
}

async function applySchemaSql(client: Client, sql: string): Promise<void> {
  const statements = splitSqlStatements(sql);
  const orderedStatements = [
    ...statements.filter((statement) => isCreateTableStatement(statement)),
    ...statements.filter((statement) => isCreateIndexStatement(statement)),
    ...statements.filter((statement) => isCreateViewStatement(statement)),
    ...statements.filter(
      (statement) =>
        !isCreateTableStatement(statement) && !isCreateIndexStatement(statement) && !isCreateViewStatement(statement),
    ),
  ];

  for (const statement of orderedStatements) {
    await client.raw(statement);
  }
}

function isCreateTableStatement(statement: string): boolean {
  return /^\s*create\s+table\b/iu.test(statement);
}

function isCreateIndexStatement(statement: string): boolean {
  return /^\s*create\s+(?:unique\s+)?index\b/iu.test(statement);
}

function isCreateViewStatement(statement: string): boolean {
  return /^\s*create\s+view\b/iu.test(statement);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, currentValue: unknown) => {
    if (Array.isArray(currentValue) || currentValue == null || typeof currentValue !== 'object') {
      return currentValue;
    }
    return Object.fromEntries(
      Object.entries(currentValue as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)),
    );
  });
}

function toComparableSchema(schema: SqliteInspectedDatabase) {
  return {
    tables: Object.fromEntries(
      Object.entries(schema.tables)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([tableName, table]) => [
          tableName,
          {
            name: table.name,
            columns: table.columns,
            primaryKey: table.primaryKey,
            uniqueConstraints: table.uniqueConstraints,
            foreignKeys: table.foreignKeys,
            indexes: Object.fromEntries(
              Object.entries(table.indexes)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([indexName, index]) => [
                  indexName,
                  {
                    name: index.name,
                    unique: index.unique,
                    origin: index.origin,
                    columns: index.columns,
                    where: index.where,
                  },
                ]),
            ),
          },
        ]),
    ),
    views: Object.fromEntries(
      Object.entries(schema.views)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([viewName, view]) => [
          viewName,
          {
            name: view.name,
            definition: view.definition,
          },
        ]),
    ),
    triggers: Object.fromEntries(
      Object.entries(schema.triggers)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([triggerName, trigger]) => [
          triggerName,
          {
            name: trigger.name,
            onName: trigger.onName,
            normalizedSql: trigger.normalizedSql,
          },
        ]),
    ),
  };
}
