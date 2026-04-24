import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';

import type {AsyncClient, DisposableAsyncClient, QueryArg, ResultRow, SqlfuProjectConfig, SqlQuery} from '../types.js';
import {bindAsyncSql} from '../sql.js';
import {rawSqlWithSqlSplittingAsync, surroundWithBeginCommitRollbackAsync} from '../sqlite-text.js';
import type {QueryCatalog} from '../typegen/query-catalog.js';
import {initializeProject} from './config.js';
import {analyzeAdHocSqlForConfig, generateQueryTypesForConfig} from '../typegen/index.js';
import type {SqlAnalysisResponse} from '../ui/shared.js';
import {isInternalUnsupportedSqlAnalysisError, toSqlEditorDiagnostic} from '../sql-editor-diagnostic.js';
import type {AdHocSqlParams, AdHocSqlResult, HostCatalog, HostFs, SqlfuHost} from '../host.js';

type NodeSqliteModule = {DatabaseSync: typeof DatabaseSync};

let cachedNodeSqliteModule: Promise<NodeSqliteModule> | undefined;

async function loadNodeSqliteModule(): Promise<NodeSqliteModule> {
  if (cachedNodeSqliteModule) return cachedNodeSqliteModule;

  cachedNodeSqliteModule = (async () => {
    const originalEmitWarning = process.emitWarning.bind(process);
    process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
      if (isNodeSqliteExperimentalWarning(warning, args)) return;
      return Reflect.apply(originalEmitWarning, process, [warning, ...args]);
    }) as typeof process.emitWarning;

    try {
      return await import('node:sqlite');
    } finally {
      process.emitWarning = originalEmitWarning;
    }
  })();

  return cachedNodeSqliteModule;
}

function isNodeSqliteExperimentalWarning(warning: string | Error, args: unknown[]) {
  const message = typeof warning === 'string' ? warning : warning.message;
  const type = typeof warning === 'string' ? (typeof args[0] === 'string' ? args[0] : '') : warning.name;
  return type === 'ExperimentalWarning' && message.includes('SQLite is an experimental feature');
}

/**
 * Open whatever `config.db` points to — a local sqlite file if it's a string,
 * or a user-provided factory if it's a function. The factory is invoked on every
 * call; users memoize inside the factory if they want to share an expensive
 * resource across sqlfu commands.
 *
 * Throws a named, actionable error when `db` is undefined — projects on
 * `generate.authority: 'desired_schema'` can run `sqlfu generate` without a
 * DB, but anything that reads/writes the real database needs one.
 */
export async function openConfigDb(db: SqlfuProjectConfig['db']): Promise<DisposableAsyncClient> {
  if (db == null) {
    throw new Error(
      'sqlfu: this command needs a database, but `db` is not set in sqlfu.config.ts. ' +
        'Add `db: "./app.sqlite"` (local sqlite) or `db: () => openMyRemoteClient()` (factory) and rerun.',
    );
  }
  if (typeof db === 'function') return await db();
  return openLocalSqliteFile(db);
}

/**
 * Open a local sqlite file and return a `DisposableAsyncClient` wrapping a
 * `node:sqlite` connection. The same primitive the string form of `config.db`
 * uses under the hood — exported so users can opt into the factory form while
 * keeping a local file.
 *
 * ```ts
 * defineConfig({
 *   db: () => openLocalSqliteFile('./app.sqlite'),
 *   // ...
 * });
 * ```
 */
export async function openLocalSqliteFile(dbPath: string): Promise<DisposableAsyncClient> {
  const {DatabaseSync} = await loadNodeSqliteModule();
  await fs.mkdir(path.dirname(dbPath), {recursive: true});
  const database = new DatabaseSync(dbPath);
  return {
    client: createAsyncNodeSqliteClient(database),
    async [Symbol.asyncDispose]() {
      database.close();
    },
  };
}

export async function createNodeHost(): Promise<SqlfuHost> {
  const {DatabaseSync} = await loadNodeSqliteModule();
  const scratchRoot = path.join(os.tmpdir(), 'sqlfu-scratch');

  const host: SqlfuHost = {
    fs: nodeFs,
    openDb: (config) => openConfigDb(config.db),
    execAdHocSql: async (client, sql, params): Promise<AdHocSqlResult> => {
      // Go through the sqlfu Client API uniformly — do NOT reach into
      // `client.driver`. The previous driver-reach-through worked for
      // sync drivers but silently dropped Promise-returning `.all()` calls
      // on async drivers (D1, libsql, Turso), which in turn got invoked
      // after the enclosing `await using` had already disposed the
      // underlying resource (ERR_DISPOSED crash on miniflare). The Client
      // API normalizes both shapes so one implementation fits both.
      //
      // The Client API only accepts positional args, so named-param
      // objects are rewritten to positional here via a tiny SQLite
      // tokenizer. Once `client.prepare(sql)` lands (see
      // tasks/client-prepare.md), this function goes away — the adapter's
      // native prepared-statement handle can take named params directly.
      //
      // Read vs. write is classified by the first SQL keyword rather than
      // by try/catch-on-`all()`: drivers disagree on whether `.all()`
      // throws for writes (node:sqlite returns `[]`, better-sqlite3
      // throws), so the old heuristic silently mis-categorized writes on
      // some drivers.
      const {sql: positionalSql, args} = rewriteNamedParamsToPositional(sql, params);
      if (sqlReturnsRows(positionalSql)) {
        const rows = await client.all({sql: positionalSql, args, name: 'execAdHocSql'});
        return {mode: 'rows', rows};
      }
      const result = await client.run({sql: positionalSql, args, name: 'execAdHocSql'});
      return {
        mode: 'metadata',
        metadata: {
          rowsAffected: result.rowsAffected,
          lastInsertRowid: result.lastInsertRowid,
        },
      };
    },
    openScratchDb: async (slug) => {
      await fs.mkdir(scratchRoot, {recursive: true});
      const dbPath = path.join(scratchRoot, `${slug}-${randomUUID()}.db`);
      const database = new DatabaseSync(dbPath);
      return {
        client: createAsyncNodeSqliteClient(database),
        async [Symbol.asyncDispose]() {
          database.close();
          await Promise.allSettled([
            fs.rm(dbPath, {force: true}),
            fs.rm(`${dbPath}-shm`, {force: true}),
            fs.rm(`${dbPath}-wal`, {force: true}),
          ]);
        },
      };
    },
    initializeProject: (input) => initializeProject(input),
    digest: async (content) => createHash('sha256').update(content).digest('hex'),
    now: () => new Date(),
    uuid: () => randomUUID(),
    logger: console,
    // Assigned below so catalog methods can close over the fully-constructed host.
    catalog: null as unknown as HostCatalog,
  };
  host.catalog = createNodeCatalog(host);
  return host;
}

function createNodeCatalog(host: SqlfuHost): HostCatalog {
  return {
    async load(config): Promise<QueryCatalog> {
      // Catalog load is best-effort: the UI's schema page calls this on every render, and the
      // user has a separate "Schema Check" surface that shows real schema errors. If typegen
      // can't build a catalog right now (broken definitions.sql, unreadable migrations, etc.),
      // serve the last good catalog — or an empty one if none exists yet — instead of
      // throwing. The CLI path (`sqlfu generate`) still throws, because there the user asked
      // explicitly for types.
      try {
        await generateQueryTypesForConfig(config, host);
      } catch (error) {
        console.warn(`sqlfu/ui: catalog regeneration skipped — ${String(error)}`);
      }
      const catalogPath = path.join(config.projectRoot, '.sqlfu', 'query-catalog.json');
      try {
        return JSON.parse(await fs.readFile(catalogPath, 'utf8')) as QueryCatalog;
      } catch {
        return {generatedAt: new Date(0).toISOString(), queries: []};
      }
    },
    async refresh(config) {
      try {
        await generateQueryTypesForConfig(config, host);
      } catch (error) {
        console.warn(`sqlfu/ui: catalog regeneration skipped — ${String(error)}`);
      }
    },
    async analyzeSql(config, sql) {
      if (!sql.trim()) return {};
      try {
        const analysis = await analyzeAdHocSqlForConfig(config, host, sql);
        return {
          paramsSchema: analysis.paramsSchema,
          diagnostics: [],
        };
      } catch (error) {
        if (isInternalUnsupportedSqlAnalysisError(error)) return {};
        return {
          diagnostics: [toSqlEditorDiagnostic(sql, error)],
        };
      }
    },
  };
}

const nodeFs: HostFs = {
  async readFile(filePath) {
    return fs.readFile(filePath, 'utf8');
  },
  async writeFile(filePath, contents) {
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, contents);
  },
  async readdir(dirPath) {
    return fs.readdir(dirPath);
  },
  async mkdir(dirPath) {
    await fs.mkdir(dirPath, {recursive: true});
  },
  async rm(filePath, options) {
    await fs.rm(filePath, {force: options?.force ?? false});
  },
  async rename(from, to) {
    await fs.rename(from, to);
  },
  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },
};


type NodeSqliteDatabase = InstanceType<typeof DatabaseSync>;

/**
 * Returns true for statements that produce a result set — `select`, `with`,
 * `pragma`, `explain`, `values`, and any of the write variants with a
 * `returning` clause. Used by `execAdHocSql` to pick between `client.all` and
 * `client.run`. Strips leading comments/whitespace so a commented query is
 * classified by its actual first keyword.
 */
function sqlReturnsRows(sql: string): boolean {
  const stripped = sql.replace(/^(?:\s+|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/u, '');
  if (/^(select|with|pragma|explain|values)\b/iu.test(stripped)) return true;
  return /\breturning\b/iu.test(sql);
}

/**
 * Ad-hoc SQL from the UI's query runner can use named params (`:name`,
 * `$name`, `@name`). The sqlfu Client API is positional-only, so this rewrites
 * the SQL to `?` placeholders and returns the args in appearance order. A
 * minimal tokenizer skips string literals and comments so colons/dollars inside
 * quoted strings aren't mistaken for placeholders.
 *
 * This lives here (not in a shared util) because the UI's SQL runner is the
 * only path that accepts non-positional params. Once `client.prepare(sql)`
 * exposes a native handle with driver-level named-param support, this helper
 * disappears and execAdHocSql goes through that instead.
 */
function rewriteNamedParamsToPositional(
  sql: string,
  params: AdHocSqlParams,
): {sql: string; args: QueryArg[]} {
  if (params == null) return {sql, args: []};
  if (Array.isArray(params)) return {sql, args: params as QueryArg[]};

  const named = params as Record<string, unknown>;
  const order: string[] = [];
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i]!;
    if (ch === "'" || ch === '"') {
      const quote = ch;
      const start = i;
      i += 1;
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      out += sql.slice(start, i);
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      const eol = sql.indexOf('\n', i);
      const end = eol === -1 ? sql.length : eol;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const close = sql.indexOf('*/', i + 2);
      const end = close === -1 ? sql.length : close + 2;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (ch === ':' || ch === '$' || ch === '@') {
      const rest = sql.slice(i + 1);
      const match = /^[a-zA-Z_][a-zA-Z0-9_]*/u.exec(rest);
      if (match) {
        order.push(match[0]);
        out += '?';
        i += 1 + match[0].length;
        continue;
      }
    }
    out += ch;
    i += 1;
  }

  const args = order.map((name) => {
    if (!Object.prototype.hasOwnProperty.call(named, name)) {
      throw new Error(`SQL runner: missing value for named parameter "${name}".`);
    }
    return named[name] as QueryArg;
  });
  return {sql: out, args};
}

export function createAsyncNodeSqliteClient(database: NodeSqliteDatabase): AsyncClient<NodeSqliteDatabase> {
  const client: AsyncClient<NodeSqliteDatabase> = {
    driver: database,
    system: 'sqlite',
    sync: false,
    async all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Promise<TRow[]> {
      return database.prepare(query.sql).all(...(query.args as never[])) as TRow[];
    },
    async run(query: SqlQuery) {
      const result = database.prepare(query.sql).run(...(query.args as never[]));
      return {
        rowsAffected: result.changes == null ? undefined : Number(result.changes),
        lastInsertRowid: result.lastInsertRowid as string | number | bigint | null,
      };
    },
    async raw(sql: string) {
      return rawSqlWithSqlSplittingAsync(async (singleQuery) => {
        const result = database.prepare(singleQuery.sql).run(...(singleQuery.args as never[]));
        return {
          rowsAffected: result.changes == null ? undefined : Number(result.changes),
          lastInsertRowid: result.lastInsertRowid as string | number | bigint | null,
        };
      }, sql);
    },
    iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery): AsyncIterable<TRow> {
      async function* gen() {
        for (const row of database.prepare(query.sql).iterate(...(query.args as never[]))) {
          yield row as TRow;
        }
      }
      return gen();
    },
    transaction: async <TResult>(fn: (tx: AsyncClient<NodeSqliteDatabase>) => Promise<TResult> | TResult) => {
      return surroundWithBeginCommitRollbackAsync(client, fn);
    },
    sql: undefined as unknown as AsyncClient<NodeSqliteDatabase>['sql'],
  };

  (client as {sql: AsyncClient<NodeSqliteDatabase>['sql']}).sql = bindAsyncSql(client);
  return client;
}
