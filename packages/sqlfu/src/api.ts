import fs from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

import {os} from '@orpc/server';
import {z} from 'zod';

import type {Client, SqlfuProjectConfig} from './core/types.js';
import {createNodeSqliteClient, generateRandomName} from './client.js';
import {extractSchema, runSqlStatements} from './core/sqlite.js';
import {applyMigrations, type Migration} from './migrations/index.js';
import {diffSchemaSql} from './schemadiff/index.js';
import {generateQueryTypes} from './typegen/index.js';

const base = os.$context<SqlfuRouterContext>();

export const router = {
  generate: base
    .meta({
      description: `Generate TypeScript functions for all queries in the sql/ directory.`,
    })
    .handler(async () => {
      await generateQueryTypes();
      return 'Generated schema-derived database and TypeSQL outputs.';
    }),

  config: base.handler(async ({context}) => {
    return context.config;
  }),

  sync: base
    .meta({
      description: `Update the current database to match definitions.sql. Note: this should only be used for local development. For production databases, use 'sqlfu migrate' instead. ` +
      `This command fails if semantic or destructive changes are required. You can run 'sqlfu draft' to create an initial draft for a migration file with the necessary changes.`
    })
    .handler(async ({context}) => {
      const definitionsSql = await fs.readFile(context.config.definitionsPath, 'utf8');
      await using database = await openMainDevDatabase(context.config.db);
      const baselineSql = await extractSchema(database.client);
      try {
        const diffLines = await diffSchemaSql({
          projectRoot: context.config.projectRoot,
          baselineSql,
          desiredSql: definitionsSql,
        });
        await runSqlStatements(database.client, diffLines.join('\n'));
      } catch (error) {
        throw new Error(
          [
            'sync could not apply definitions.sql safely to the current database.',
            'Create or update a draft migration and test it with `sqlfu migrate --include-draft`.',
            '',
            `Cause: ${summarizeSqlite3defError(error)}`,
          ].join('\n'),
        );
      }
    }),

  draft: base
    .meta({
      description: `Create or update the draft migration. The SQL content of the draft migration is determined by the diff between the result of the finalized migrations, and the state described by definitions.sql.`,
    })
    .input(
      z.object({
        name: z.string().min(1).describe('The name of the draft migration to create or update. If omitted a random name is generated.'),
        bumpTimestamp: z.boolean().describe('If an existing draft exists, bump its timestamp - useful to make sure it is lexically last.'),
        rewrite: z.boolean().describe('If set, this wipes out the existing draft and creates a new one from scratch based on definitions.sql.'),
      }).partial().optional()
    )
    .handler(async ({context, input}) => {
      const runtime = createRuntime(context);
      let migrations = await runtime.readMigrations();
      const definitionsSql = await runtime.readDefinitionsSql();
      const draftMigrations = migrations.filter((migration) => migration.status === 'draft');

      if (draftMigrations.length > 1) {
        throw new Error('multiple draft migrations exist');
      }

      let currentDraft = draftMigrations[0];
      if (currentDraft && migrations.at(-1)?.path !== currentDraft.path) {
        if (!input?.bumpTimestamp) {
          throw new Error('draft migration must be lexically last; rerun with bumpTimestamp: true');
        }

        const fileName = path.basename(currentDraft.path);
        const bumpedFileName = `${getMigrationPrefix(runtime.now())}_${fileName.replace(/^[^_]+_/u, '')}`;
        await fs.rename(currentDraft.path, path.join(context.config.migrationsDir, bumpedFileName));
        migrations = await runtime.readMigrations();
        const bumpedDraft = migrations.find((migration) => migration.status === 'draft');
        if (!bumpedDraft) {
          throw new Error('draft migration disappeared after bumpTimestamp');
        }
        currentDraft = bumpedDraft;
      }

      if (currentDraft && input?.rewrite) {
        await fs.writeFile(currentDraft.path, '-- status: draft\n');
        migrations = await runtime.readMigrations();
        const rewrittenDraft = migrations.find((migration) => migration.status === 'draft');
        if (!rewrittenDraft) {
          throw new Error('draft migration disappeared after rewrite');
        }
        currentDraft = rewrittenDraft;
      }

      const baselineSql = currentDraft ? await materializeMigrationsSchema(runtime.config, migrations) : '';
      const diffLines = await diffSchemaSql({
        projectRoot: runtime.config.projectRoot,
        baselineSql,
        desiredSql: definitionsSql,
      });

      if (currentDraft) {
        if (diffLines.length) {
          await fs.writeFile(currentDraft.path, appendMigrationContents(currentDraft.content, diffLines));
        }

        return;
      }

      const fileName = `${getMigrationPrefix(runtime.now())}_${slugify(input?.name ?? generateRandomName())}.sql`;
      const body = diffLines.length === 0 ? definitionsSql.trim() : diffLines.join('\n').trim();

      await fs.mkdir(context.config.migrationsDir, {recursive: true});
      await fs.writeFile(path.join(context.config.migrationsDir, fileName), `-- status: draft\n${body}\n`);
    }),

  migrate: base
    .meta({
      description: `Apply migrations. This is the primary command for production databases. This will fail if a draft migration exists, unless --include-draft is used.`,
    })
    .input(
      z.object({
        includeDraft: z.boolean().describe('If set, the draft migration will be applied in addition to the finalized migrations. If not set and a draft migration exists, the command will fail.'),
      }).partial().optional()
    )
    .handler(async ({context, input}) => {
      const runtime = createRuntime(context);
      const migrations = await runtime.readMigrations();

      await runChecks(runtime, checkDraftCount, checkDraftIsLast, input?.includeDraft ? () => [] : checkNoDraft);

      await applyMigrationsToDatabase(
        runtime.config.db,
        input?.includeDraft ? migrations : migrations.filter((migration) => migration.status === 'final'),
      );
    }),

  finalize: base
    .meta({
      description: `Mark the draft migration as final`,
    })
    .handler(async ({context}) => {
      const runtime = createRuntime(context);
      const migrations = await runtime.readMigrations();
      const draftMigrations = migrations.filter((migration) => migration.status === 'draft');

      await runChecks(runtime, checkDraftCount);
      if (draftMigrations.length === 0) throw new Error('no draft migration exists to finalize');

      const draft = draftMigrations[0]!;
      const definitionsSql = await runtime.readDefinitionsSql();
      const [definitionsSchema, migrationsSchema] = await Promise.all([
        materializeDefinitionsSchema(runtime.config, definitionsSql),
        materializeMigrationsSchema(runtime.config, migrations),
      ]);

      if (definitionsSchema !== migrationsSchema) {
        throw new Error('draft migration does not match definitions.sql');
      }

      await fs.writeFile(draft.path, draft.content.replace(/^--\s*status:\s*draft\b/iu, '-- status: final'));
    }),

  check: {
    all: base
      .meta({
        default: true,
        description: `Run all checks. This can be run in CI to ensure no draft migrations exist, all migrations are valid, and that definitions.sql and the migrations match up.`,
      })
      .handler(async ({context}) => {
        await runChecks(
          createRuntime(context),
          checkDraftCount,
          checkMigrationMetadata,
          checkDraftIsLast,
          checkMigrationsMatchDefinitions,
          checkNoDraft,
        );
      }),
    draftCount: base.handler(async ({context}) => {
      await runChecks(createRuntime(context), checkDraftCount);
    }),
    migrationMetadata: base.handler(async ({context}) => {
      await runChecks(createRuntime(context), checkMigrationMetadata);
    }),
    draftIsLast: base.handler(async ({context}) => {
      await runChecks(createRuntime(context), checkDraftIsLast);
    }),
    migrationsMatchDefinitions: base.handler(async ({context}) => {
      await runChecks(createRuntime(context), checkMigrationsMatchDefinitions);
    }),
    noDraft: base.handler(async ({context}) => {
      await runChecks(createRuntime(context), checkNoDraft);
    }),
  },
};

function createRuntime(context: SqlfuRouterContext) {
  return {
    config: context.config,
    now: () => context.now?.() ?? new Date(),
    readDefinitionsSql: () => fs.readFile(context.config.definitionsPath, 'utf8'),
    async readMigrations() {
      try {
        const fileNames = (await fs.readdir(context.config.migrationsDir))
          .filter((fileName) => fileName.endsWith('.sql'))
          .sort();

        const migrations = [];
        for (const fileName of fileNames) {
          const filePath = path.join(context.config.migrationsDir, fileName);
          const content = await fs.readFile(filePath, 'utf8');
          const status = parseMigrationStatus(content);
          migrations.push({path: filePath, content, status});
        }
        return migrations;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    },
  };
}

function parseMigrationStatus(contents: string): 'draft' | 'final' {
  const metadata = parseMigrationMetadata(contents);
  if (metadata.status === 'draft' || metadata.status === 'final') {
    return metadata.status;
  }
  throw new Error('migration metadata must include status: draft|final on the first line');
}

function parseMigrationMetadata(contents: string) {
  const firstLine = contents.split('\n', 1)[0];
  const match = firstLine.match(/^--\s*(.*)$/u);
  if (!match) {
    throw new Error('migration metadata (looking like "-- status: final") must be on the first line');
  }

  return Object.fromEntries(
    match[1]
      .split(/,\s*/u)
      .filter(Boolean)
      .map((segment) => {
        const [key, value] = segment.split(/:\s*/u, 2);
        return [key, value];
      }),
  );
}

export function getMigrationPrefix(now: Date) {
  return now.toISOString().replaceAll(':', '.');
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
    .replace(/_+/gu, '_');
}

async function materializeDefinitionsSchema(
  config: SqlfuProjectConfig,
  definitionsSql: string,
) {
  await using database = await createScratchDatabase(config, 'materialize-definitions');
  await runSqlStatements(database.client, definitionsSql);
  return extractSchema(database.client);
}

async function materializeMigrationsSchema(
  config: SqlfuProjectConfig,
  migrations: readonly {path: string}[],
) {
  await using database = await createScratchDatabase(config, 'materialize-migrations');
  await applyMigrations(database.client, {migrations: await readMigrationInputs(migrations)});
  return extractSchema(database.client);
}

async function applyMigrationsToDatabase(
  dbPath: string,
  migrations: readonly {path: string}[],
) {
  await using database = await openMainDevDatabase(dbPath);
  await applyMigrations(database.client, {migrations: await readMigrationInputs(migrations)});
}

type DisposableClient = {
  readonly client: Client;
  [Symbol.asyncDispose](): Promise<void>;
};

async function createScratchDatabase(config: SqlfuProjectConfig, slug: string): Promise<DisposableClient> {
  const dbPath = path.join(config.projectRoot, '.sqlfu', `${slug}.db`);
  await fs.mkdir(path.dirname(dbPath), {recursive: true});
  const database = new DatabaseSync(dbPath);
  return {
    client: createNodeSqliteClient(database),
    async [Symbol.asyncDispose]() {
      database.close();
      await Promise.allSettled([
        fs.rm(dbPath, {force: true}),
        fs.rm(`${dbPath}-shm`, {force: true}),
        fs.rm(`${dbPath}-wal`, {force: true}),
      ]);
    },
  };
}

async function openMainDevDatabase(dbPath: string): Promise<DisposableClient> {
  await fs.mkdir(path.dirname(dbPath), {recursive: true});
  const database = new DatabaseSync(dbPath);
  return {
    client: createNodeSqliteClient(database),
    async [Symbol.asyncDispose]() {
      database.close();
    },
  };
}

async function createCheckState(runtime: ReturnType<typeof createRuntime>): Promise<CheckState> {
  const migrations = await runtime.readMigrations();
  return {
    runtime,
    migrations,
    draftMigrations: migrations.filter((migration) => migration.status === 'draft'),
  };
}

function combineChecks(...checks: readonly CheckFunction[]): CheckFunction {
  return async (state) => {
    const problemGroups = await Promise.all(checks.map((check) => check(state)));
    return problemGroups.flat();
  };
}

async function runChecks(runtime: ReturnType<typeof createRuntime>, ...checks: readonly CheckFunction[]) {
  const state = await createCheckState(runtime);
  const check = combineChecks(...checks);
  const problems = await check(state);
  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }
}

/** checks you don't have more than one draft */
function checkDraftCount(state: CheckState): string[] {
  return state.draftMigrations.length <= 1 ? [] : ['multiple draft migrations exist'];
}

function checkMigrationMetadata(state: CheckState): string[] {
  for (const migration of state.migrations) {
      try {
        parseMigrationStatus(migration.content);
      } catch (error) {
        return [String(error)];
      }
    }
  return [];
}

function checkDraftIsLast(state: CheckState): string[] {
  return state.draftMigrations.length === 0 || state.migrations.at(-1)?.path === state.draftMigrations[0]?.path
    ? []
    : ['draft migration must be lexically last'];
}

function checkNoDraft(state: CheckState): string[] {
  return state.draftMigrations.length === 0 ? [] : ['draft migration exists'];
}

async function checkMigrationsMatchDefinitions(state: CheckState): Promise<string[]> {
  try {
    const [definitionsSchema, migrationsSchema] = await Promise.all([
      materializeDefinitionsSchema(state.runtime.config, await state.runtime.readDefinitionsSql()),
      materializeMigrationsSchema(state.runtime.config, state.migrations),
    ]);

    return definitionsSchema === migrationsSchema ? [] : ['replayed migrations do not match definitions.sql'];
  } catch (error) {
    return [`migration replay failed: ${error instanceof Error ? error.message : String(error)}`];
  }
}

function appendMigrationContents(contents: string, lines: readonly string[]) {
  const trimmed = contents.trimEnd();
  return `${trimmed}${trimmed === '-- status: draft' ? '\n' : '\n\n'}${lines.join('\n')}\n`;
}

function summarizeSqlite3defError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const line = message
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
    .at(-1) ?? message.trim();
  return line.replace(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} /u, '');
}

async function readMigrationInputs(migrations: readonly {path: string}[]) {
  return Promise.all(
    migrations.map(async (migration) => ({
      path: migration.path,
      content: await fs.readFile(migration.path, 'utf8'),
    })),
  );
}

export interface SqlfuRouterContext {
  readonly config: SqlfuProjectConfig;
  readonly now?: () => Date;
}

type MigrationStatus = 'draft' | 'final';
type ParsedMigration = Migration & {status: MigrationStatus};
interface CheckState {
  readonly runtime: ReturnType<typeof createRuntime>;
  readonly migrations: ParsedMigration[]
  readonly draftMigrations: ParsedMigration[];
}

type CheckFunction = (state: CheckState) => string[] | Promise<string[]>;
