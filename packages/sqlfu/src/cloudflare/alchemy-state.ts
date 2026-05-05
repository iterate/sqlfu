type NodeFs = typeof import('node:fs');
type NodePath = typeof import('node:path');

interface NodeBuiltins {
  fs: NodeFs;
  path: NodePath;
}

let cachedNodeBuiltins: NodeBuiltins | undefined;

export interface ReadAlchemyD1StateOptions {
  stack: string;
  stage: string;
  fqn: string;
  alchemyDir?: string;
  cwd?: string;
}

export interface AlchemyD1State {
  databaseId: string;
  databaseName: string;
  accountId: string;
  jurisdiction?: string;
  migrationsDir?: string;
  migrationsTable?: string;
  [key: string]: unknown;
}

const ALCHEMY_DIR_NAME = '.alchemy';
const D1_RESOURCE_TYPE = 'Cloudflare.D1Database';

export function readAlchemyD1State(options: ReadAlchemyD1StateOptions): AlchemyD1State {
  const node = nodeBuiltins();
  const searchStart = node.path.resolve(options.cwd || process.cwd());
  const alchemyDir = options.alchemyDir ? node.path.resolve(options.alchemyDir) : findAlchemyDir(searchStart, node);

  if (!alchemyDir) {
    throw new Error(
      `No .alchemy directory found from ${searchStart}. Pass {alchemyDir} or run from inside a project with an .alchemy/ persist directory.`,
    );
  }

  const stateFile = node.path.join(alchemyDir, 'state', options.stack, options.stage, `${encodeFqn(options.fqn)}.json`);

  let raw: string;
  try {
    raw = node.fs.readFileSync(stateFile, 'utf8');
  } catch (error) {
    throw new Error(
      `Alchemy state file not found at ${stateFile}. Has \`alchemy deploy\` (or \`alchemy dev\`) run for stack=${options.stack} stage=${options.stage}? Cause: ${(error as Error).message}`,
    );
  }

  let parsed: {type?: string; attr?: Record<string, unknown>};
  try {
    parsed = JSON.parse(raw) as {type?: string; attr?: Record<string, unknown>};
  } catch (error) {
    throw new Error(`Alchemy state file at ${stateFile} is not valid JSON: ${(error as Error).message}`);
  }

  if (parsed.type !== D1_RESOURCE_TYPE) {
    throw new Error(
      `Alchemy state file at ${stateFile} is for resource type ${parsed.type ?? '(missing)'}, expected ${D1_RESOURCE_TYPE}.`,
    );
  }

  const attr = parsed.attr || {};
  const databaseId = attr.databaseId;
  const databaseName = attr.databaseName;
  const accountId = attr.accountId;

  if (typeof databaseId !== 'string' || typeof databaseName !== 'string' || typeof accountId !== 'string') {
    throw new Error(
      `Alchemy state file at ${stateFile} is missing required attr fields (databaseId, databaseName, accountId). Attr: ${JSON.stringify(attr)}`,
    );
  }

  return {...attr, databaseId, databaseName, accountId};
}

function findAlchemyDir(startDir: string, node: NodeBuiltins): string | undefined {
  // We look for `.alchemy/state/` (the v2 persist root) rather than any
  // `.alchemy/` — a bare `.alchemy/` could be left by alchemy v1 or
  // unrelated tooling, and we don't want auto-discovery to silently
  // pick up `~/.alchemy/` or similar.
  let currentDir = startDir;
  while (true) {
    const alchemyDir = node.path.join(currentDir, ALCHEMY_DIR_NAME);
    const stateDir = node.path.join(alchemyDir, 'state');
    try {
      if (node.fs.statSync(stateDir).isDirectory()) return alchemyDir;
    } catch {
      // not a directory or doesn't exist — keep walking
    }

    const parentDir = node.path.dirname(currentDir);
    if (parentDir === currentDir) return undefined;
    currentDir = parentDir;
  }
}

function encodeFqn(fqn: string): string {
  return fqn.replaceAll('/', '__');
}

function nodeBuiltins(): NodeBuiltins {
  if (cachedNodeBuiltins) return cachedNodeBuiltins;

  if (typeof process === 'undefined' || typeof process.getBuiltinModule !== 'function') {
    throw new Error('readAlchemyD1State requires a Node.js runtime with process.getBuiltinModule().');
  }

  cachedNodeBuiltins = {
    fs: process.getBuiltinModule('node:fs') as NodeFs,
    path: process.getBuiltinModule('node:path') as NodePath,
  };
  return cachedNodeBuiltins;
}
