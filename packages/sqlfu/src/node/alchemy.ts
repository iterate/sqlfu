const miniflareD1DatabaseObjectKey = 'miniflare-D1DatabaseObject';

type NodeBuffer = typeof import('node:buffer');
type NodeCrypto = typeof import('node:crypto');
type NodeFs = typeof import('node:fs');
type NodePath = typeof import('node:path');

interface NodeBuiltins {
  Buffer: NodeBuffer['Buffer'];
  crypto: NodeCrypto;
  fs: NodeFs;
  path: NodePath;
}

let cachedNodeBuiltins: NodeBuiltins | undefined;

export interface FindMiniflareD1PathOptions {
  miniflareV3Root?: string;
  cwd?: string;
}

export function findMiniflareD1Path(slug: string, options?: FindMiniflareD1PathOptions): string {
  const node = nodeBuiltins();
  const resolvedOptions = options || {};
  const searchStart = node.path.resolve(resolvedOptions.cwd || process.cwd());
  const miniflareV3Root = resolvedOptions.miniflareV3Root || findAlchemyMiniflareV3Root(searchStart, node);
  if (!miniflareV3Root) {
    throw new Error(
      `No Alchemy Miniflare v3 root found from ${searchStart}. Pass {miniflareV3Root} or run from inside an Alchemy project.`,
    );
  }

  return node.path.join(
    miniflareV3Root,
    'd1',
    miniflareD1DatabaseObjectKey,
    `${miniflareD1DatabaseObjectId(slug, node)}.sqlite`,
  );
}

function findAlchemyMiniflareV3Root(startDir: string, node: NodeBuiltins): string | undefined {
  let currentDir = startDir;

  while (true) {
    const candidate = node.path.join(currentDir, '.alchemy', 'miniflare', 'v3');
    if (isDirectory(candidate, node)) {
      return candidate;
    }

    const parentDir = node.path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function isDirectory(value: string, node: NodeBuiltins): boolean {
  try {
    return node.fs.statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function miniflareD1DatabaseObjectId(slug: string, node: NodeBuiltins): string {
  const key = node.crypto.createHash('sha256').update(miniflareD1DatabaseObjectKey).digest();
  const nameHmac = node.crypto.createHmac('sha256', key).update(slug).digest().subarray(0, 16);
  const hmac = node.crypto.createHmac('sha256', key).update(nameHmac).digest().subarray(0, 16);
  return node.Buffer.concat([nameHmac, hmac]).toString('hex');
}

function nodeBuiltins(): NodeBuiltins {
  if (cachedNodeBuiltins) {
    return cachedNodeBuiltins;
  }

  if (typeof process === 'undefined' || typeof process.getBuiltinModule !== 'function') {
    throw new Error('findMiniflareD1Path requires a Node.js runtime with process.getBuiltinModule().');
  }

  cachedNodeBuiltins = {
    Buffer: process.getBuiltinModule('node:buffer').Buffer,
    crypto: process.getBuiltinModule('node:crypto') as NodeCrypto,
    fs: process.getBuiltinModule('node:fs') as NodeFs,
    path: process.getBuiltinModule('node:path') as NodePath,
  };
  return cachedNodeBuiltins;
}
