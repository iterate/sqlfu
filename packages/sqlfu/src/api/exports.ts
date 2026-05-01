import process from 'node:process';

import {createSqlfuApi as createCoreSqlfuApi} from './core.js';
import type {
  AppliedOptions,
  BaselineOptions,
  CheckOptions,
  ConfigOptions,
  DraftOptions,
  FindOptions,
  GotoOptions,
  InitOptions,
  MigrateOptions,
  PendingOptions,
  SyncOptions,
} from './core.js';
import {formatSql} from '../formatter.js';
import {createNodeHost} from '../node/host.js';
import {loadProjectStateFrom, loadProjectStateFromConfigPath} from '../node/config.js';
import {stopProcessesListeningOnPort} from '../node/port-process.js';
import {generateQueryTypesForConfig} from '../typegen/index.js';
import {startSqlfuServer, type StartSqlfuServerOptions} from '../ui/server.js';
import {resolveSqlfuUi} from '../ui/resolve-sqlfu-ui.js';
import packageJson from '../../package.json' with {type: 'json'};

export {createSqlfuApi} from './core.js';
export type {Confirm, SqlfuApi} from './core.js';

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

export async function init(input: InitOptions & NodeApiOptions): Promise<string> {
  return (await createNodeSqlfuApi(input)).init(input);
}

export async function config(input: ConfigOptions & NodeApiOptions = {}) {
  return (await createNodeSqlfuApi(input)).config();
}

export async function sync(input: SyncOptions & NodeApiOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).sync(input);
}

export async function draft(input: DraftOptions & NodeApiOptions) {
  return (await createNodeSqlfuApi(input)).draft(input);
}

export async function migrate(input: MigrateOptions & NodeApiOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).migrate(input);
}

export async function pending(input: PendingOptions & NodeApiOptions = {}) {
  return (await createNodeSqlfuApi(input)).pending();
}

export async function applied(input: AppliedOptions & NodeApiOptions = {}) {
  return (await createNodeSqlfuApi(input)).applied();
}

export async function find(input: FindOptions & NodeApiOptions) {
  return (await createNodeSqlfuApi(input)).find(input);
}

export async function baseline(input: BaselineOptions & NodeApiOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).baseline(input);
}

export async function goto(input: GotoOptions & NodeApiOptions): Promise<void> {
  await (await createNodeSqlfuApi(input)).goto(input);
}

export async function check(input: CheckOptions & NodeApiOptions = {}) {
  return (await createNodeSqlfuApi(input)).check();
}

export async function generate(input: GenerateOptions = {}) {
  const {config, host} = await loadNodeSqlfuContext(input);
  return generateQueryTypesForConfig(config, host);
}

export function format(sql: string) {
  return formatSql(sql);
}

export async function serve(input: ServeOptions = {}) {
  const project = await loadNodeProjectState(input);
  const params: StartSqlfuServerOptions = {port: input.port, configPath: project.configPath};
  if (input.ui) {
    const ui = await resolveSqlfuUi({sqlfuVersion: packageJson.version});
    return startSqlfuServer({...params, ui});
  }
  return startSqlfuServer(params);
}

export async function kill(input: KillOptions = {}) {
  return stopProcessesListeningOnPort(input.port || 56081);
}

async function createNodeSqlfuApi(input: NodeApiOptions) {
  const host = await createNodeHost();
  const projectRoot = input.projectRoot || process.cwd();
  return createCoreSqlfuApi({
    projectRoot,
    configPath: input.configPath,
    loadProjectState: () => loadNodeProjectState({projectRoot, configPath: input.configPath}),
    host,
  });
}

async function loadNodeSqlfuContext(input: NodeApiOptions) {
  const host = await createNodeHost();
  const project = await loadNodeProjectState(input);
  if (!project.initialized) {
    if (project.configPath) {
      throw new Error(`No sqlfu config found at ${project.configPath}. Run 'sqlfu init' first.`);
    }
    throw new Error(`No sqlfu config found in ${project.projectRoot}. Run 'sqlfu init' first.`);
  }
  return {config: project.config, host};
}

async function loadNodeProjectState(input: NodeApiOptions) {
  const projectRoot = input.projectRoot || process.cwd();
  if (input.configPath) {
    return loadProjectStateFromConfigPath(input.configPath, projectRoot);
  }
  return loadProjectStateFrom(projectRoot);
}
