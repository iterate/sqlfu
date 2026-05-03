// Helpers that materialise a schema from some source (definitions.sql, a
// migrations list, the migration history recorded in a live DB) into a scratch
// DB and return the resulting schema SQL. Now thin wrappers over the
// dialect's `materializeSchemaSql` method — each dialect picks its own
// scratch primitive (sqlite: `host.openScratchDb`; pg: `CREATE DATABASE` on
// a configured admin URL).

import type {Dialect} from './dialect.js';
import type {SqlfuHost} from './host.js';
import {joinPath} from './paths.js';
import type {SqlfuProjectConfig} from './types.js';
import type {Migration} from './migrations/index.js';

export type MaterializeSchemaOptions = {
  /**
   * Tables to strip from the extracted schema. The schema-drift callers in
   * api.ts pass `['sqlfu_migrations']` so bookkeeping noise doesn't affect
   * comparison; typegen leaves this empty so the user's schema is reflected
   * verbatim.
   */
  excludedTables?: string[];
  /** Dialect responsible for materializing + extracting. */
  dialect: Dialect;
};

export async function materializeDefinitionsSchemaFor(
  host: SqlfuHost,
  definitionsSql: string,
  options: MaterializeSchemaOptions,
): Promise<string> {
  return options.dialect.materializeSchemaSql(host, {
    sourceSql: definitionsSql,
    excludedTables: options.excludedTables,
  });
}

export async function materializeMigrationsSchemaFor(
  host: SqlfuHost,
  migrations: Migration[],
  options: MaterializeSchemaOptions,
): Promise<string> {
  // Concatenate migration contents and apply as one DDL blob. The resulting
  // schema is what callers want; the bookkeeping table (`sqlfu_migrations` /
  // `d1_migrations`) is not created here because we bypass `applyMigrations`.
  // That's deliberate — for materialization-for-extraction, the bookkeeping
  // is noise.
  //
  // Each migration's content gets a trailing `;\n` so adjacent migrations
  // don't merge into a single (invalid) statement. Migrations may or may
  // not include their own trailing semicolon — both shapes are common in
  // user-authored .sql files.
  return options.dialect.materializeSchemaSql(host, {
    sourceSql: migrations.map((migration) => terminateStatement(migration.content)).join('\n'),
    excludedTables: options.excludedTables,
  });
}

function terminateStatement(sql: string): string {
  const trimmed = sql.trim();
  if (!trimmed) return '';
  return trimmed.endsWith(';') ? sql : `${sql};\n`;
}

export async function readMigrationFiles(host: SqlfuHost, config: SqlfuProjectConfig): Promise<Migration[]> {
  if (!config.migrations) return [];
  const migrationsDir = config.migrations.path;

  let fileNames: string[];
  try {
    fileNames = (await host.fs.readdir(migrationsDir))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const migrations: Migration[] = [];
  for (const fileName of fileNames) {
    const filePath = joinPath(migrationsDir, fileName);
    const content = await host.fs.readFile(filePath);
    migrations.push({path: filePath, content});
  }
  return migrations;
}
