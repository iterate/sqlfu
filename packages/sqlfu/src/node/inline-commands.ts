import path from 'node:path';

import {autoAcceptConfirm, type Confirm} from '../api/core.js';
import {getMigrationPrefix} from '../api/internal.js';
import {sqliteDialect} from '../dialect.js';
import {materializeDefinitionsSchemaFor, materializeMigrationsSchemaFor} from '../materialize.js';
import {migrationNickname} from '../naming.js';
import type {SqlfuHost} from '../host.js';
import {generateInlineSqlfuTypes, type GenerateQueryTypesResult} from '../typegen/index.js';
import {
  appendInlineMigration,
  inlineMigrationsToMigrationFiles,
  readInlineSqlfuSource,
} from './inline-source.js';

export async function generateInlineSqlfuModule(input: {
  modulePath: string;
  projectRoot: string;
  host: SqlfuHost;
}): Promise<GenerateQueryTypesResult> {
  return generateInlineSqlfuTypes(input);
}

export async function draftInlineSqlfuMigration(input: {
  modulePath: string;
  projectRoot: string;
  host: SqlfuHost;
  name?: string;
  confirm?: Confirm;
}): Promise<{path: string} | null> {
  const inline = await readInlineSqlfuSource(input.modulePath);
  if (!inline) {
    throw new Error(`No inlineSqlfu(...) call found in ${input.modulePath}.`);
  }

  const dialect = sqliteDialect();
  const [desiredSchema, baselineSchema] = await Promise.all([
    materializeDefinitionsSchemaFor(input.host, inline.definitions.sql, {dialect}),
    materializeMigrationsSchemaFor(input.host, inlineMigrationsToMigrationFiles(inline), {dialect}),
  ]);
  const diffLines = await dialect.diffSchema(input.host, {
    baselineSql: baselineSchema,
    desiredSql: desiredSchema,
    allowDestructive: true,
  });

  if (diffLines.length === 0) {
    return null;
  }

  const confirm = input.confirm || autoAcceptConfirm;
  const body = await confirm({
    title: 'Create inline migration entry?',
    body: diffLines.join('\n').trim(),
    bodyType: 'sql',
    editable: true,
  });
  if (!body?.trim()) {
    return null;
  }

  const prefix = getMigrationPrefix({
    kind: 'iso',
    now: input.host.now(),
    existing: inline.migrations.map((migration) => `${migration.name}.sql`),
  });
  const name = `${prefix}_${slugify(input.name || migrationNickname(body))}`;
  await appendInlineMigration(input.modulePath, {name, content: body});
  return {path: projectRelativePath(input.projectRoot, input.modulePath)};
}

function projectRelativePath(projectRoot: string, filePath: string) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
    .replace(/_+/gu, '_');
}
