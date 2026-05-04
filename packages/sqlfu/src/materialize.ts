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
import {sha256} from './vendor/sha256.js';

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
  return materializeWithCache(host, definitionsSql, options);
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
  const sourceSql = migrations.map((migration) => terminateStatement(migration.content)).join('\n');
  return materializeWithCache(host, sourceSql, options);
}

// Process-local cache for materialised schema SQL. Same dialect + same input
// SQL + same exclusions → same output, so we can short-circuit the
// scratch-DB roundtrip on repeat calls.
//
// Big practical win for the UI: every page render re-runs `analyzeDatabase`,
// which materialises `definitions.sql` and the migration list. Across renders
// those inputs almost always have the same content hash, so the cache turns
// ~1.7s of pg `CREATE/DROP DATABASE` work into a Map lookup.
//
// Correctness: the cache key is content-derived (sha256 of the source SQL),
// so any edit to definitions.sql or any migration file flips the key and
// produces a fresh materialisation. Failed materialisations evict
// themselves so we don't pin a transient error.
const materializeCache = new Map<string, Promise<string>>();
const MATERIALIZE_CACHE_LIMIT = 32;

async function materializeWithCache(
  host: SqlfuHost,
  sourceSql: string,
  options: MaterializeSchemaOptions,
): Promise<string> {
  const key = `${options.dialect.name}\0${(options.excludedTables ?? []).join(',')}\0${hashContent(sourceSql)}`;
  const existing = materializeCache.get(key);
  if (existing) {
    // LRU-style refresh: re-insert so this entry isn't the next one evicted.
    materializeCache.delete(key);
    materializeCache.set(key, existing);
    return existing;
  }
  const promise = options.dialect.materializeSchemaSql(host, {
    sourceSql,
    excludedTables: options.excludedTables,
  });
  if (materializeCache.size >= MATERIALIZE_CACHE_LIMIT) {
    const oldest = materializeCache.keys().next().value;
    if (oldest !== undefined) materializeCache.delete(oldest);
  }
  materializeCache.set(key, promise);
  promise.catch(() => {
    // Don't poison the cache with a transient failure — drop the slot so a
    // retry can populate it fresh.
    if (materializeCache.get(key) === promise) materializeCache.delete(key);
  });
  return promise;
}

function hashContent(content: string): string {
  const bytes = sha256(new TextEncoder().encode(content));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
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
