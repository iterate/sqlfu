import fs from 'node:fs';
import path from 'node:path';

import type {ESLint, Linter, Rule} from 'eslint';
import type * as ESTree from 'estree';

/**
 * sqlfu's ESLint plugin.
 *
 * Zero runtime dependencies — the compiled output only imports `node:fs`
 * and `node:path`. `eslint` and `estree` types are pulled in as devDep
 * type-only imports, which TypeScript erases during compilation.
 *
 * Consumers wire it in their flat config:
 *
 *   import sqlfu from 'sqlfu/eslint';
 *   export default [{plugins: {sqlfu}, rules: {'sqlfu/no-unnamed-inline-sql': 'error'}}];
 *
 * Or via the preset:
 *
 *   import sqlfu from 'sqlfu/eslint';
 *   export default [sqlfu.configs.recommended];
 */

const CLIENT_METHODS = new Set(['all', 'run', 'iterate']);

/**
 * Normalize SQL for identity comparison. Dedents, trims, collapses internal
 * whitespace, and lowercases keywords so cosmetic edits don't break equality.
 *
 * Duplicated from packages/sqlfu/src/core/util.ts deliberately — the lint
 * rule is shipped as a zero-dep module, so it can't reach into the rest of
 * sqlfu at runtime.
 */
function normalizeSqlForMatch(sql: string): string {
  const lines = sql.split('\n');
  const indents = lines.filter((line) => line.trim().length > 0).map((line) => line.match(/^[\t ]*/)?.[0].length || 0);
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
  const dedented = lines.map((line) => line.slice(minIndent)).join('\n');
  return dedented.trim().replace(/\s+/g, ' ').toLowerCase();
}

interface LoadedQuery {
  absolutePath: string;
  relativePath: string;
  functionName: string;
  normalized: string;
}

interface LoadQueriesOptions {
  queriesDir?: string;
}

interface Cache {
  projectRoot: string;
  queriesDir: string;
  queries: LoadedQuery[];
  mtimeMs: number;
}

const caches = new Map<string, Cache>();

function loadQueriesForFile(fromFile: string, options: LoadQueriesOptions): LoadedQuery[] | null {
  const projectRoot = findProjectRoot(fromFile);
  if (!projectRoot) return null;

  const queriesDir = options.queriesDir
    ? path.resolve(projectRoot, options.queriesDir)
    : resolveQueriesDir(projectRoot);

  if (!queriesDir || !fs.existsSync(queriesDir)) return null;

  const cacheKey = `${projectRoot}::${queriesDir}`;
  const mtimeMs = directoryMtime(queriesDir);
  const cached = caches.get(cacheKey);
  if (cached && cached.mtimeMs === mtimeMs) return cached.queries;

  const queries = walkSqlFiles(queriesDir).map((absolutePath): LoadedQuery => {
    const relative = path.relative(queriesDir, absolutePath).replace(/\\/g, '/');
    const name = relative.replace(/\.sql$/, '');
    return {
      absolutePath,
      relativePath: relative,
      functionName: toCamelCase(name),
      normalized: normalizeSqlForMatch(fs.readFileSync(absolutePath, 'utf8')),
    };
  });

  caches.set(cacheKey, {projectRoot, queriesDir, queries, mtimeMs});
  return queries;
}

function findProjectRoot(fromFile: string): string | null {
  let dir = path.dirname(path.resolve(fromFile));
  const root = path.parse(dir).root;
  while (true) {
    for (const name of ['sqlfu.config.ts', 'sqlfu.config.mjs', 'sqlfu.config.js', 'sqlfu.config.cjs']) {
      if (fs.existsSync(path.join(dir, name))) return dir;
    }
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

function resolveQueriesDir(projectRoot: string): string | null {
  for (const name of ['sqlfu.config.ts', 'sqlfu.config.mjs', 'sqlfu.config.js', 'sqlfu.config.cjs']) {
    const configPath = path.join(projectRoot, name);
    if (!fs.existsSync(configPath)) continue;
    // Cheap text parse — executing the config synchronously would need a
    // bundler/worker, and the typical shape is `queries: './sql'`.
    const text = fs.readFileSync(configPath, 'utf8');
    const match = text.match(/queries\s*:\s*['"]([^'"]+)['"]/);
    if (match) {
      const value = match[1];
      const base = value.replace(/\/\*\*?.*$/, '').replace(/\/[^/]*\*[^/]*$/, '');
      return path.resolve(projectRoot, base || '.');
    }
  }
  const fallback = path.join(projectRoot, 'sql');
  return fs.existsSync(fallback) ? fallback : null;
}

function walkSqlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSqlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.sql')) {
      out.push(full);
    }
  }
  return out;
}

function directoryMtime(dir: string): number {
  let latest = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    try {
      const stat = fs.statSync(current);
      if (stat.mtimeMs > latest) latest = stat.mtimeMs;
      if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(current)) stack.push(path.join(current, entry));
      }
    } catch {
      // dir might have been removed mid-walk — ignore
    }
  }
  return latest;
}

function toCamelCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
    .join('');
}

/**
 * Clear the in-process query cache. Exposed for tests only.
 */
export function resetQueryCache(): void {
  caches.clear();
}

/**
 * Flags inline SQL template literals that duplicate a checked-in .sql file.
 *
 * Point: sqlfu's model is "your filename is your query's identity". An inline
 * string that happens to match a named file is a regression — the caller loses
 * the generated types, the name, and the observability tie.
 *
 * Fires on:
 *   client.all(`select * from users`)
 *   client.run(`select * from users`)
 *   client.iterate(`select * from users`)
 *   client.sql`select * from users`
 *
 * Only when the template has no `${}` interpolations, and only when the
 * normalized SQL matches a file under the project's queries directory.
 */
const noUnnamedInlineSql: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'flag inline SQL template literals that duplicate a named .sql file; use the generated query wrapper instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          queriesDir: {type: 'string'},
          clientIdentifierPattern: {type: 'string'},
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useNamed:
        "inline SQL matches '{{relativePath}}'. Import '{{functionName}}' from the generated wrapper so the query keeps its name, types, and observability metadata.",
    },
  },
  create(context) {
    const options = (context.options[0] || {}) as {
      queriesDir?: string;
      clientIdentifierPattern?: string;
    };
    const clientPattern = options.clientIdentifierPattern
      ? new RegExp(options.clientIdentifierPattern, 'u')
      : /^(client|db|sqlfu|.*Client)$/u;

    const filename = context.filename || context.getFilename();
    if (!filename || filename === '<input>' || filename === '<text>') {
      // Without a real filename we can't locate the project root.
      return {};
    }

    const queries = loadQueriesForFile(filename, {queriesDir: options.queriesDir});
    if (!queries || queries.length === 0) return {};

    const index = new Map(queries.map((query) => [query.normalized, query]));

    function report(template: ESTree.TemplateLiteral) {
      if (template.expressions.length > 0) return; // parameterized — out of scope
      const raw = template.quasis.map((q: ESTree.TemplateElement) => q.value.cooked || q.value.raw).join('');
      const normalized = normalizeSqlForMatch(raw);
      const match = index.get(normalized);
      if (!match) return;
      context.report({
        node: template,
        messageId: 'useNamed',
        data: {
          relativePath: match.relativePath,
          functionName: match.functionName,
        },
      });
    }

    function isClientIdentifier(node: ESTree.Node | null | undefined): boolean {
      if (!node) return false;
      if (node.type !== 'Identifier') return false;
      return clientPattern.test(node.name);
    }

    return {
      // client.all(`...`) / client.run(`...`) / client.iterate(`...`)
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed) return;
        if (callee.property.type !== 'Identifier') return;
        if (!CLIENT_METHODS.has(callee.property.name)) return;
        if (!isClientIdentifier(callee.object)) return;
        const arg = node.arguments[0];
        if (!arg || arg.type !== 'TemplateLiteral') return;
        report(arg);
      },
      // client.sql`...`
      TaggedTemplateExpression(node) {
        const tag = node.tag;
        if (tag.type !== 'MemberExpression' || tag.computed) return;
        if (tag.property.type !== 'Identifier' || tag.property.name !== 'sql') return;
        if (!isClientIdentifier(tag.object)) return;
        report(node.quasi);
      },
    };
  },
};

const plugin: ESLint.Plugin = {
  meta: {
    name: 'sqlfu',
  },
  rules: {
    'no-unnamed-inline-sql': noUnnamedInlineSql,
  },
};

/**
 * Flat-config preset that enables every rule in this plugin at `error`.
 *
 *   import sqlfu from 'sqlfu/eslint';
 *   export default [sqlfu.configs.recommended];
 */
const recommended: Linter.Config = {
  plugins: {sqlfu: plugin},
  rules: {
    'sqlfu/no-unnamed-inline-sql': 'error',
  },
};

const exported: ESLint.Plugin & {configs: {recommended: Linter.Config}} = Object.assign(plugin, {
  configs: {recommended},
});

export default exported;
