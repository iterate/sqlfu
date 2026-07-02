import {
  applyBaselineSql,
  applyDraftSql,
  applyGotoSql,
  applyMigrateSql,
  applySyncSql,
  analyzeDatabase,
  autoAcceptConfirm,
  formatCheckFailure,
  loadContextConfig,
  materializeDefinitionsSchemaForContext,
  materializeMigrationsSchemaForContext,
  compareSchemasForContext,
  migrationsPresetOf,
  readMigrationsFromContext,
  runInitCommand,
  type SqlfuCommandContext,
} from './internal.js';
import type {InitPreviewFormat} from '../init-preview.js';
import type {LoadedSqlfuProject} from '../config.js';
import type {SqlfuHost} from '../host.js';
import {migrationName, readMigrationHistory} from '../migrations/index.js';
import type {SqlfuProjectConfig} from '../types.js';

export type Confirm = (params: {
  title: string;
  body: string;
  bodyType?: 'markdown' | 'sql' | 'typescript';
  editable?: boolean;
}) => string | null | Promise<string | null>;
export {autoAcceptConfirm};

export type CreateSqlfuApiInput = {
  projectRoot?: string;
  configPath?: string;
  config?: SqlfuProjectConfig;
  loadProjectState?: () => Promise<LoadedSqlfuProject>;
  initPreviewFormat?: InitPreviewFormat;
  host: SqlfuHost;
};

export type InitOptions = {
  confirm: Confirm;
};

export type ConfigOptions = object;

export type SyncOptions = {
  confirm: Confirm;
};

export type DraftOptions = {
  name?: string;
  confirm: Confirm;
};

export type MigrateOptions = {
  confirm: Confirm;
};

export type PendingOptions = object;

export type AppliedOptions = object;

export type FindOptions = {
  text: string;
};

export type BaselineOptions = {
  target: string;
  confirm: Confirm;
};

export type GotoOptions = {
  target: string;
  confirm: Confirm;
};

export type CheckOptions = object;

export interface SqlfuApi {
  init(input: InitOptions): Promise<string>;
  config(input?: ConfigOptions): Promise<SqlfuProjectConfig>;
  sync(input: SyncOptions): Promise<void>;
  draft(input: DraftOptions): Promise<{path: string} | null>;
  migrate(input: MigrateOptions): Promise<void>;
  pending(input?: PendingOptions): Promise<string[]>;
  applied(input?: AppliedOptions): Promise<string[]>;
  find(input: FindOptions): Promise<{name: string; applied: boolean}[]>;
  baseline(input: BaselineOptions): Promise<void>;
  goto(input: GotoOptions): Promise<void>;
  check(input?: CheckOptions): Promise<void>;
  checkMigrationsMatchDefinitions(input?: CheckOptions): Promise<void>;
}

export function createSqlfuApi(input: CreateSqlfuApiInput): SqlfuApi {
  const context = createCommandContext(input);

  return {
    async init({confirm}) {
      return runInitCommand(context, confirm);
    },

    async config() {
      return (await loadContextConfig(context)).config;
    },

    async sync({confirm}) {
      await applySyncSql(await loadContextConfig(context), confirm);
    },

    async draft(input) {
      return applyDraftSql(await loadContextConfig(context), {name: input.name}, input.confirm);
    },

    async migrate({confirm}) {
      await applyMigrateSql(await loadContextConfig(context), confirm);
    },

    async pending() {
      const initializedContext = await loadContextConfig(context);
      const migrations = await readMigrationsFromContext(initializedContext);
      await using database = await initializedContext.host.openDb(initializedContext.config);
      const applied = await readMigrationHistory(database.client, {preset: migrationsPresetOf(initializedContext), dialect: initializedContext.config.dialect});
      const appliedNames = new Set(applied.map((migration) => migration.name));
      return migrations.map((migration) => migrationName(migration)).filter((name) => !appliedNames.has(name));
    },

    async applied() {
      const initializedContext = await loadContextConfig(context);
      await using database = await initializedContext.host.openDb(initializedContext.config);
      const applied = await readMigrationHistory(database.client, {preset: migrationsPresetOf(initializedContext), dialect: initializedContext.config.dialect});
      return applied.map((migration) => migration.name);
    },

    async find({text}) {
      const initializedContext = await loadContextConfig(context);
      const migrations = await readMigrationsFromContext(initializedContext);
      await using database = await initializedContext.host.openDb(initializedContext.config);
      const applied = await readMigrationHistory(database.client, {preset: migrationsPresetOf(initializedContext), dialect: initializedContext.config.dialect});
      const appliedNames = new Set(applied.map((migration) => migration.name));
      return migrations
        .map((migration) => migrationName(migration))
        .filter((name) => name.includes(text))
        .map((name) => ({
          name,
          applied: appliedNames.has(name),
        }));
    },

    async baseline(input) {
      await applyBaselineSql(await loadContextConfig(context), {target: input.target}, input.confirm);
    },

    async goto(input) {
      await applyGotoSql(await loadContextConfig(context), {target: input.target}, input.confirm);
    },

    async check() {
      const analysis = await analyzeDatabase(await loadContextConfig(context));
      if (analysis.mismatches.length > 0) {
        throw new Error(formatCheckFailure(analysis));
      }
    },

    async checkMigrationsMatchDefinitions() {
      const sqlfuContext = await loadContextConfig(context);
      const [definitionsSql, migrations] = await Promise.all([
        sqlfuContext.host.fs.readFile(sqlfuContext.config.definitions),
        readMigrationsFromContext(sqlfuContext),
      ]);
      const [definitionsSchema, migrationsSchema] = await Promise.all([
        materializeDefinitionsSchemaForContext(sqlfuContext, definitionsSql),
        materializeMigrationsSchemaForContext(sqlfuContext, migrations),
      ]);
      if ((await compareSchemasForContext(sqlfuContext, definitionsSchema, migrationsSchema)).isDifferent) {
        throw new Error('replayed migrations do not match definitions.sql');
      }
    },
  };
}

function createCommandContext(input: CreateSqlfuApiInput): SqlfuCommandContext {
  const projectRoot = input.projectRoot || input.config?.projectRoot;
  if (!projectRoot) {
    throw new Error('createSqlfuApi requires projectRoot when config is not provided.');
  }

  return {
    projectRoot,
    configPath: input.configPath,
    config: input.config,
    loadProjectState: input.loadProjectState,
    initPreviewFormat: input.initPreviewFormat,
    host: input.host,
  };
}
