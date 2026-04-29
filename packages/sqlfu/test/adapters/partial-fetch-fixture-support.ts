export const partialFetchFixtureSupportSource = `
import {createSqlfuUiPartialFetch} from './runtime/ui/browser.js';
import {sqlReturnsRows} from './runtime/sqlite-text.js';

export function createSqlitePartialFetchForFixture(input) {
  const project = createProject({
    projectName: input.projectName,
    db: input.db,
    definitionsSql: input.definitionsSql,
  });

  return createSqlfuUiPartialFetch({
    assets: input.assets,
    project,
    host: createHost({
      project,
      catalog: input.catalog,
      openClient: input.openClient,
    }),
  });
}

function createProject(input) {
  const projectName = sanitizeProjectName(input.projectName);
  const projectRoot = \`/\${projectName}\`;
  return {
    initialized: true,
    projectRoot,
    config: {
      projectRoot,
      db: input.db,
      definitions: \`\${projectRoot}/definitions.sql\`,
      migrations: {
        path: \`\${projectRoot}/migrations\`,
        prefix: 'iso',
        preset: 'sqlfu',
      },
      queries: \`\${projectRoot}/sql\`,
      generate: {
        validator: null,
        prettyErrors: true,
        sync: false,
        importExtension: '.js',
        authority: 'live_schema',
      },
    },
    definitionsSql: input.definitionsSql || '',
  };
}

function createHost(input) {
  const fs = createMemoryFs({
    [input.project.config.definitions]: input.project.definitionsSql,
  });
  const catalog = input.catalog || {generatedAt: new Date(0).toISOString(), queries: []};

  return {
    fs,
    async openDb() {
      return {
        client: input.openClient(),
        async [Symbol.asyncDispose]() {},
      };
    },
    async openScratchDb() {
      throw new Error('test partial fetch fixture does not provide scratch databases');
    },
    execAdHocSql,
    async initializeProject(projectInput) {
      await fs.writeFile(\`\${projectInput.projectRoot}/sqlfu.config.ts\`, projectInput.configContents);
    },
    async digest(content) {
      return digest(content);
    },
    now: () => new Date(),
    uuid: () => globalThis.crypto.randomUUID(),
    logger: console,
    catalog: {
      async load() {
        return catalog;
      },
      async refresh() {},
      async analyzeSql() {
        return {};
      },
    },
  };
}

async function execAdHocSql(client, sql, params) {
  const stmt = client.prepare(sql);
  try {
    if (sqlReturnsRows(sql)) {
      return {
        mode: 'rows',
        rows: await stmt.all(params),
      };
    }
    return {
      mode: 'metadata',
      metadata: await stmt.run(params),
    };
  } finally {
    await disposeStatement(stmt);
  }
}

async function disposeStatement(stmt) {
  if (stmt[Symbol.asyncDispose]) {
    await stmt[Symbol.asyncDispose]();
    return;
  }
  stmt[Symbol.dispose]?.();
}

function createMemoryFs(initialFiles) {
  const files = new Map(Object.entries(initialFiles).map(([filePath, content]) => [normalizePath(filePath), content]));

  return {
    async readFile(filePath) {
      const normalized = normalizePath(filePath);
      if (!files.has(normalized)) {
        const error = new Error(\`\${normalized} not found\`);
        error.code = 'ENOENT';
        throw error;
      }
      return files.get(normalized);
    },
    async writeFile(filePath, contents) {
      files.set(normalizePath(filePath), contents);
    },
    async readdir(dirPath) {
      const prefix = normalizeDirectoryPath(dirPath);
      const entries = new Set();
      for (const filePath of files.keys()) {
        if (!filePath.startsWith(prefix)) {
          continue;
        }
        const [entry] = filePath.slice(prefix.length).split('/');
        if (entry) {
          entries.add(entry);
        }
      }
      return [...entries].sort();
    },
    async mkdir() {},
    async rm(filePath) {
      files.delete(normalizePath(filePath));
    },
    async rename(from, to) {
      const normalizedFrom = normalizePath(from);
      if (!files.has(normalizedFrom)) {
        const error = new Error(\`\${normalizedFrom} not found\`);
        error.code = 'ENOENT';
        throw error;
      }
      const content = files.get(normalizedFrom);
      files.delete(normalizedFrom);
      files.set(normalizePath(to), content);
    },
    async exists(filePath) {
      const normalized = normalizePath(filePath);
      if (files.has(normalized)) {
        return true;
      }
      const prefix = normalizeDirectoryPath(normalized);
      return [...files.keys()].some((candidate) => candidate.startsWith(prefix));
    },
  };
}

function normalizePath(filePath) {
  const withSlash = filePath.startsWith('/') ? filePath : \`/\${filePath}\`;
  return withSlash.replace(/\\/+/g, '/');
}

function normalizeDirectoryPath(dirPath) {
  const normalized = normalizePath(dirPath);
  return normalized.endsWith('/') ? normalized : \`\${normalized}/\`;
}

function sanitizeProjectName(projectName) {
  const sanitized = projectName.trim().replace(/^\\/+|\\/+$/g, '');
  if (!sanitized || !/^[a-z0-9-]+$/u.test(sanitized)) {
    throw new Error(\`Invalid sqlfu UI project name: \${projectName}\`);
  }
  return sanitized;
}

async function digest(content) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
`;
