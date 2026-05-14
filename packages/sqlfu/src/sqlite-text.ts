import type {AsyncClient, Client, PreparedStatementParams, QueryArg, SyncClient} from './types.js';
import {normalizeSchemaSqlForExtraction} from './schemadiff/sqlite/sqltext.js';

/**
 * Returns true for statements that produce a result set. Heuristic by design;
 * union of sqlite and postgres row-returning keywords:
 *
 * - `select`, `with`, `explain`, `values` — both dialects.
 * - `pragma` — sqlite only (invalid syntax in pg; never matches a valid pg
 *   statement so over-inclusion is harmless).
 * - `show`, `table`, `fetch` — pg only (invalid syntax in sqlite; same
 *   harmless-overinclusion argument).
 * - …plus any write statement with a `returning` clause.
 *
 * Used by `execAdHocSql` to decide whether the UI should render rows or a
 * row-count summary. Strips leading comments/whitespace so a commented query
 * is classified by its actual first keyword.
 *
 * Try/catch on `.all()` is *not* a safe substitute: node:sqlite returns `[]`
 * for writes (no error to catch), and better-sqlite3 may execute partial side
 * effects before throwing — falling back to `.run()` would double-execute.
 * Keyword classification sidesteps both.
 */
export function sqlReturnsRows(sql: string): boolean {
  const stripped = sql.replace(/^(?:\s+|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/u, '');
  if (/^(select|with|pragma|explain|values|show|table|fetch)\b/iu.test(stripped)) return true;
  return /\breturning\b/iu.test(sql);
}

/**
 * Adapter-internal compatibility shim for drivers whose binding API is
 * strictly positional (D1, Durable Objects, turso-serverless, expo-sqlite).
 * Rewrites `:name` / `$name` / `@name` to `?` and returns the args in
 * appearance order so the strictly-positional driver can bind them. A minimal
 * tokenizer skips string literals and comments so colons/dollars inside
 * quoted strings aren't mistaken for placeholders.
 *
 * Adapters whose driver natively accepts `Record` bindings (better-sqlite3,
 * node:sqlite, libsql, sqlite-wasm) skip this helper and pass the params
 * straight through.
 */
export function rewriteNamedParamsToPositional(
  sql: string,
  params: PreparedStatementParams | undefined,
): {sql: string; args: QueryArg[]} {
  if (params == null) return {sql, args: []};
  if (Array.isArray(params)) return {sql, args: params as QueryArg[]};

  const named = params as Record<string, unknown>;
  const parameters = scanSqliteNamedParameters(sql);
  let out = '';
  let cursor = 0;
  for (const parameter of parameters) {
    out += sql.slice(cursor, parameter.start);
    out += '?';
    cursor = parameter.end;
  }
  out += sql.slice(cursor);

  const args = parameters.map((parameter) => {
    if (!Object.prototype.hasOwnProperty.call(named, parameter.name)) {
      throw new Error(`SQL: missing value for named parameter "${parameter.name}".`);
    }
    return named[parameter.name] as QueryArg;
  });
  return {sql: out, args};
}

export type SqliteNamedParameter = {
  parameter: string;
  name: string;
  start: number;
  end: number;
};

export function scanSqliteNamedParameters(sql: string): SqliteNamedParameter[] {
  const out: SqliteNamedParameter[] = [];
  let index = 0;
  while (index < sql.length) {
    const skippedEnd = scanSqlIgnoredRange(sql, index);
    if (skippedEnd !== null) {
      index = skippedEnd;
      continue;
    }

    const code = sql.charCodeAt(index);
    if (isNamedParameterPrefix(code) && isIdentStart(sql.charCodeAt(index + 1))) {
      const start = index;
      index += 2;
      while (index < sql.length && isIdentCont(sql.charCodeAt(index))) index += 1;
      const parameter = sql.slice(start, index);
      out.push({parameter, name: parameter.slice(1), start, end: index});
      continue;
    }
    index += 1;
  }
  return out;
}

function scanSqlIgnoredRange(sql: string, start: number): number | null {
  const code = sql.charCodeAt(start);
  if (code === 0x27 /* ' */) return scanQuotedSql(sql, start, 0x27);
  if (code === 0x22 /* " */) return scanQuotedSql(sql, start, 0x22);
  if (code === 0x60 /* ` */) return scanQuotedSql(sql, start, 0x60);
  if (code === 0x5b /* [ */) return scanBracketedSqlIdentifier(sql, start);
  if (code === 0x2d /* - */ && sql.charCodeAt(start + 1) === 0x2d /* - */) {
    return scanSqlLineComment(sql, start + 2);
  }
  if (code === 0x2f /* / */ && sql.charCodeAt(start + 1) === 0x2a /* * */) {
    return scanSqlBlockComment(sql, start + 2);
  }
  return null;
}

function scanQuotedSql(sql: string, start: number, quote: number): number {
  let index = start + 1;
  while (index < sql.length) {
    if (sql.charCodeAt(index) === quote) {
      if (sql.charCodeAt(index + 1) === quote) {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += 1;
  }
  return sql.length;
}

function scanBracketedSqlIdentifier(sql: string, start: number): number {
  let index = start + 1;
  while (index < sql.length) {
    if (sql.charCodeAt(index) === 0x5d /* ] */) return index + 1;
    index += 1;
  }
  return sql.length;
}

function scanSqlLineComment(sql: string, start: number): number {
  let index = start;
  while (index < sql.length && sql.charCodeAt(index) !== 0x0a /* \n */) index += 1;
  return index;
}

function scanSqlBlockComment(sql: string, start: number): number {
  let index = start;
  while (index < sql.length) {
    if (sql.charCodeAt(index) === 0x2a /* * */ && sql.charCodeAt(index + 1) === 0x2f /* / */) {
      return index + 2;
    }
    index += 1;
  }
  return sql.length;
}

function isIdentStart(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) || code === 0x5f;
}

function isIdentCont(code: number): boolean {
  return isIdentStart(code) || (code >= 0x30 && code <= 0x39);
}

function isNamedParameterPrefix(code: number): boolean {
  return code === 0x3a /* : */ || code === 0x40 /* @ */ || code === 0x24 /* $ */;
}

/**
 * Standard WHERE-clause fragment for user-table introspection queries. Excludes:
 * - SQLite's own internal tables (`sqlite_master`, `sqlite_sequence`, etc.).
 * - Cloudflare's reserved `_cf_*` prefix. Workerd's D1 binding emits a warning
 *   for any identifier matching this prefix case-insensitively. Backslash-escape
 *   `_` so it matches literally instead of as LIKE's single-char wildcard.
 *   https://developers.cloudflare.com/d1/reference/database-size/#internal-metadata
 */
export const excludeReservedSqliteObjects = `name not like 'sqlite\\_%' escape '\\' and name not like '\\_cf\\_%' escape '\\'`;

export async function extractSchema(
  client: Client,
  schemaName = 'main',
  input: {
    excludedTables?: string[];
  } = {},
): Promise<string> {
  const excludedTables = input.excludedTables ?? [];
  const excludedTableFilter = excludedTables
    .map((tableName) => `and name != ${sqlStringLiteral(tableName)}`)
    .join('\n        ');
  const rows = await client.all<{sql: string | null}>({
    sql: `
      select sql
      from ${schemaName}.sqlite_schema
      where sql is not null
        and ${excludeReservedSqliteObjects}
        ${excludedTableFilter}
      order by
        case type
          when 'table' then 0
          when 'view' then 1
          when 'index' then 2
          when 'trigger' then 3
        end,
        name
    `,
    args: [],
  });

  return rows.map((row) => `${normalizeSchemaSqlForExtraction(String(row.sql))};`).join('\n');
}

function sqlStringLiteral(value: string) {
  return `'${value.replaceAll(`'`, `''`)}'`;
}

export type SqliteSchemaFingerprint = {
  tables: {
    name: string;
    columns: {
      name: string;
      type: string;
      notNull: boolean;
      defaultValue: string | null;
      primaryKeyPosition: number;
      hidden: number;
    }[];
    indexes: {
      unique: boolean;
      origin: string;
      partial: boolean;
      columns: string[];
    }[];
  }[];
  views: {
    name: string;
    sql: string;
  }[];
};

export async function inspectSchemaFingerprint(
  client: Client,
  schemaName = 'main',
  input: {excludedTables?: string[]} = {},
): Promise<SqliteSchemaFingerprint> {
  const excludedTables = input.excludedTables ?? [];
  const excludedTableFilter = excludedTables
    .map((tableName) => `and name != ${sqlStringLiteral(tableName)}`)
    .join('\n        ');
  const objects = await client.all<{
    type: 'table' | 'view';
    name: string;
    sql: string | null;
  }>({
    sql: `
      select type, name, sql
      from ${schemaName}.sqlite_schema
      where type in ('table', 'view')
        and ${excludeReservedSqliteObjects}
        ${excludedTableFilter}
      order by type, name
    `,
    args: [],
  });

  const tables = [];
  const views = [];

  for (const object of objects) {
    if (object.type === 'view') {
      views.push({
        name: object.name,
        sql: normalizeSchemaStatement(object.sql ?? ''),
      });
      continue;
    }

    const tableNameLiteral = quoteSqlString(object.name);
    const columns = await client.all<{
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
      hidden: number;
    }>({
      sql: `select name, type, "notnull", dflt_value, pk, hidden from pragma_table_xinfo(${tableNameLiteral}) order by cid`,
      args: [],
    });
    const indexList = await client.all<{
      name: string;
      unique: number;
      origin: string;
      partial: number;
    }>({
      sql: `select name, "unique", origin, partial from pragma_index_list(${tableNameLiteral}) order by name`,
      args: [],
    });

    const indexes = [];
    for (const index of indexList) {
      const indexNameLiteral = quoteSqlString(index.name);
      const indexColumns = await client.all<{name: string}>({
        sql: `select name from pragma_index_info(${indexNameLiteral}) order by seqno`,
        args: [],
      });
      indexes.push({
        unique: Boolean(index.unique),
        origin: index.origin,
        partial: Boolean(index.partial),
        columns: indexColumns.map((column) => column.name),
      });
    }

    tables.push({
      name: object.name,
      columns: columns.map((column) => ({
        name: column.name,
        type: String(column.type ?? '').toLowerCase(),
        notNull: Boolean(column.notnull),
        defaultValue: column.dflt_value,
        primaryKeyPosition: column.pk,
        hidden: column.hidden,
      })),
      indexes,
    });
  }

  return {tables, views};
}

export function rawSqlWithSqlSplittingSync(
  runOne: (query: {sql: string; args: QueryArg[]}) => {
    rowsAffected?: number;
    lastInsertRowid?: string | number | bigint | null;
  },
  sql: string,
) {
  if (!sql.trim()) {
    return {};
  }

  const statements = splitSqlStatements(sql).filter((statement) => !isCommentOnlySql(statement));
  if (statements.length === 0) {
    return {};
  }
  if (statements.length <= 1) {
    return runOne({sql: statements[0]!, args: []});
  }

  let lastResult = {};
  for (const statement of statements) {
    lastResult = runOne({sql: statement, args: []});
  }
  return lastResult;
}

export async function rawSqlWithSqlSplittingAsync(
  runOne: (query: {
    sql: string;
    args: QueryArg[];
  }) => Promise<{rowsAffected?: number; lastInsertRowid?: string | number | bigint | null}>,
  sql: string,
) {
  if (!sql.trim()) {
    return {};
  }

  const statements = splitSqlStatements(sql).filter((statement) => !isCommentOnlySql(statement));
  if (statements.length === 0) {
    return {};
  }
  if (statements.length <= 1) {
    return runOne({sql: statements[0]!, args: []});
  }

  let lastResult = {};
  for (const statement of statements) {
    lastResult = await runOne({sql: statement, args: []});
  }
  return lastResult;
}

export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let index = 0;

  while (index < sql.length) {
    const char = sql[index]!;
    const skippedEnd = scanSqlIgnoredRange(sql, index);
    if (skippedEnd !== null) {
      current += sql.slice(index, skippedEnd);
      index = skippedEnd;
      continue;
    }

    if (char === ';') {
      if (isTriggerStatementInProgress(current) && !isTriggerTerminator(current)) {
        current += char;
        index += 1;
        continue;
      }

      const statement = current.trim();
      if (statement && stripSqlComments(statement).trim()) {
        statements.push(`${statement};`);
      }
      current = '';
      index += 1;
      continue;
    }

    current += char;
    index += 1;
  }

  const trailing = current.trim();
  if (trailing && stripSqlComments(trailing).trim()) {
    statements.push(trailing);
  }

  return statements;
}

function isCommentOnlySql(sql: string) {
  let index = 0;

  while (index < sql.length) {
    const char = sql[index]!;

    const skippedEnd = scanSqlIgnoredRange(sql, index);
    if (skippedEnd !== null) {
      if (char !== '-' && char !== '/') return false;
      index = skippedEnd;
      continue;
    }

    if (!/\s/u.test(char)) {
      return false;
    }

    index += 1;
  }

  return true;
}

export function surroundWithBeginCommitRollbackSync<TDriver, TResult>(
  client: SyncClient<TDriver>,
  fn: (tx: SyncClient<TDriver>) => TResult,
): TResult;
export function surroundWithBeginCommitRollbackSync<TDriver, TResult>(
  client: SyncClient<TDriver>,
  fn: (tx: SyncClient<TDriver>) => Promise<TResult>,
): Promise<TResult>;
export function surroundWithBeginCommitRollbackSync<TDriver, TResult>(
  client: SyncClient<TDriver>,
  fn: (tx: SyncClient<TDriver>) => TResult | Promise<TResult>,
): TResult | Promise<TResult> {
  client.run({sql: 'begin', args: []});
  try {
    const result = fn(client);
    if (isPromiseLike(result)) {
      return result.then(
        (value) => {
          client.run({sql: 'commit', args: []});
          return value;
        },
        (error) => {
          tryRollbackSync(client);
          throw error;
        },
      );
    }
    client.run({sql: 'commit', args: []});
    return result;
  } catch (error) {
    tryRollbackSync(client);
    throw error;
  }
}

export async function surroundWithBeginCommitRollbackAsync<TDriver, TResult>(
  client: AsyncClient<TDriver>,
  fn: (tx: AsyncClient<TDriver>) => Promise<TResult> | TResult,
): Promise<TResult> {
  await client.run({sql: 'begin', args: []});
  try {
    const result = await fn(client);
    await client.run({sql: 'commit', args: []});
    return result;
  } catch (error) {
    await tryRollbackAsync(client);
    throw error;
  }
}

// if a rollback fails (e.g. because the inner sql included its own commit), preserve the
// original error. the caller only cares about what actually went wrong in their code.
function tryRollbackSync<TDriver>(client: SyncClient<TDriver>) {
  try {
    client.run({sql: 'rollback', args: []});
  } catch {
    // ignore
  }
}

async function tryRollbackAsync<TDriver>(client: AsyncClient<TDriver>) {
  try {
    await client.run({sql: 'rollback', args: []});
  } catch {
    // ignore
  }
}

function stripSqlComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function normalizeSchemaStatement(sql: string) {
  return sql.toLowerCase().replace(/\s+/g, ' ').trim();
}

function quoteSqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function isPromiseLike<TResult>(value: TResult | Promise<TResult>): value is Promise<TResult> {
  return typeof value === 'object' && value !== null && 'then' in value;
}

function isTriggerStatementInProgress(sql: string): boolean {
  return /^\s*create\s+trigger\b/iu.test(stripSqlComments(sql));
}

function isTriggerTerminator(sql: string): boolean {
  return /\bend\s*$/iu.test(stripSqlComments(sql).trim());
}
