import {sql as runtimeSql} from '../sql.js';
import {assertServableProject, type LoadedSqlfuProject} from '../config.js';
import type {SqlfuHost} from '../host.js';
import type {RootSqlTag, SqlfuProjectConfig} from '../types.js';
import type {Confirm} from './core.js';
import packageJson from '../../package.json' with {type: 'json'};

export type {Confirm} from './core.js';

export const sql = runtimeSql as RootSqlTag;

// Node-only project/config code is loaded lazily — via dynamic imports with
// literal specifiers, so bundlers can still follow them — keeping this entry
// cheap to import and free of eager node:* dependencies.

type NodeApiOptions = {
  configPath?: string;
  projectRoot?: string;
};

type ServeOptions = NodeApiOptions & {
  port?: number;
  ui?: boolean;
};

type KillOptions = {
  port?: number;
};

type GenerateOptions = NodeApiOptions;

type InitOptions = NodeApiOptions & {confirm: Confirm};
type ConfigOptions = NodeApiOptions;
type SyncOptions = NodeApiOptions & {confirm: Confirm};
type DraftOptions = NodeApiOptions & {name?: string; confirm: Confirm};
type MigrateOptions = NodeApiOptions & {confirm: Confirm};
type PendingOptions = NodeApiOptions;
type AppliedOptions = NodeApiOptions;
type FindOptions = NodeApiOptions & {text: string};
type BaselineOptions = NodeApiOptions & {target: string; confirm: Confirm};
type GotoOptions = NodeApiOptions & {target: string; confirm: Confirm};
type CheckOptions = NodeApiOptions;

type GenerateQueryTypesResult = {
  writtenFiles: string[];
};

export async function init(input: InitOptions): Promise<string> {
  return (await createNodeSqlfuApi(input)).init(input);
}

export async function config(input: ConfigOptions = {}): Promise<SqlfuProjectConfig> {
  return (await createNodeSqlfuApi(input)).config();
}

export async function sync(input: SyncOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).sync(input);
}

export async function draft(input: DraftOptions): Promise<{path: string} | null> {
  const {project, host} = await loadInitializedNodeProject(input);
  if ('inline' in project) {
    const {draftInlineConfigMigration} = await import('../node/inline-commands.js');
    return draftInlineConfigMigration({
      modulePath: project.inline.modulePath,
      projectRoot: project.projectRoot,
      host,
      name: input.name,
      confirm: input.confirm,
    });
  }
  const {createSqlfuApi} = await import('./core.js');
  return createSqlfuApi({
    projectRoot: project.projectRoot,
    configPath: project.configPath,
    config: project.config,
    host,
  }).draft(input);
}

export async function migrate(input: MigrateOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).migrate(input);
}

export async function pending(input: PendingOptions = {}): Promise<string[]> {
  return (await createNodeSqlfuApi(input)).pending();
}

export async function applied(input: AppliedOptions = {}): Promise<string[]> {
  return (await createNodeSqlfuApi(input)).applied();
}

export async function find(input: FindOptions): Promise<{name: string; applied: boolean}[]> {
  return (await createNodeSqlfuApi(input)).find(input);
}

export async function baseline(input: BaselineOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).baseline(input);
}

export async function goto(input: GotoOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).goto(input);
}

export async function check(input: CheckOptions = {}): Promise<void> {
  return (await createNodeSqlfuApi(input)).check();
}

export async function generate(input: GenerateOptions = {}): Promise<GenerateQueryTypesResult> {
  const {project, host} = await loadInitializedNodeProject(input);
  if ('inline' in project) {
    const {generateInlineConfigModule} = await import('../node/inline-commands.js');
    return generateInlineConfigModule({
      modulePath: project.inline.modulePath,
      projectRoot: project.projectRoot,
      host,
    });
  }
  const {generateQueryTypesForConfig} = await import('../typegen/index.js');
  return generateQueryTypesForConfig(project.config, host);
}

export async function format(sql: string, options: {language?: 'sqlite' | 'postgresql'} = {}): Promise<string> {
  const {formatSql} = await import('../formatter.js');
  return formatSql(sql, {language: options.language});
}

export async function serve(input: ServeOptions = {}) {
  const project = await loadNodeProjectState(input);
  assertServableProject(project);
  const params = {port: input.port, configPath: project.configPath};
  const {startSqlfuServer} = await import('../ui/server.js');
  if (input.ui) {
    const {resolveSqlfuUi} = await import('../ui/resolve-sqlfu-ui.js');
    const ui = await resolveSqlfuUi({sqlfuVersion: packageJson.version});
    return startSqlfuServer({...params, ui});
  }
  return startSqlfuServer(params);
}

export async function kill(input: KillOptions = {}) {
  const {stopProcessesListeningOnPort} = await import('../node/port-process.js');
  return stopProcessesListeningOnPort(input.port || 56081);
}

async function createNodeSqlfuApi(input: NodeApiOptions) {
  const {createSqlfuApi} = await import('./core.js');
  const host = await createNodeHost();
  const projectRoot = input.projectRoot || process.cwd();
  return createSqlfuApi({
    projectRoot,
    configPath: input.configPath,
    loadProjectState: () => loadNodeProjectState({projectRoot, configPath: input.configPath}),
    host,
  });
}

async function loadNodeProjectState(input: NodeApiOptions) {
  const projectRoot = input.projectRoot || process.cwd();
  const {loadProjectStateFrom, loadProjectStateFromConfigPath} = await import('../node/config.js');
  if (input.configPath) {
    return loadProjectStateFromConfigPath(input.configPath, projectRoot);
  }
  return loadProjectStateFrom(projectRoot);
}

async function loadInitializedNodeProject(
  input: NodeApiOptions,
): Promise<{project: Extract<LoadedSqlfuProject, {initialized: true}>; host: SqlfuHost}> {
  const host = await createNodeHost();
  const project = await loadNodeProjectState(input);
  if (!project.initialized) {
    if (project.configPath) {
      throw new Error(`No sqlfu config found at ${project.configPath}. Run 'sqlfu init' first.`);
    }
    throw new Error(`No sqlfu config found in ${project.projectRoot}. Run 'sqlfu init' first.`);
  }
  return {project, host};
}

async function createNodeHost() {
  const {createNodeHost} = await import('../node/host.js');
  return createNodeHost();
}
