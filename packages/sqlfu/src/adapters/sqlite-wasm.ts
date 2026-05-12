import {wrapAsyncClientErrors} from '../adapter-errors.js';
import {bindAsyncSql} from '../sql.js';
import {rawSqlWithSqlSplittingAsync, surroundWithBeginCommitRollbackAsync} from '../sqlite-text.js';
import type {AsyncClient, PreparedStatement, PreparedStatementParams, QueryArg, ResultRow, SqlQuery} from '../types.js';

export type SqliteWasmBindValue = string | number | bigint | Uint8Array | null;

export interface SqliteWasmExecOptions {
  sql: string;
  bind?: SqliteWasmBindValue[] | Record<string, SqliteWasmBindValue> | undefined;
  rowMode?: 'object' | 'array';
  returnValue?: 'resultRows' | 'this';
}

export interface SqliteWasmDatabaseLike {
  exec(...args: any[]): unknown;
  selectValue(sql: string): unknown;
  changes(isTotal?: boolean, use64Bit?: boolean): number | bigint;
}

export function createSqliteWasmClient(database: SqliteWasmDatabaseLike): AsyncClient<SqliteWasmDatabaseLike> {
  const all: AsyncClient<SqliteWasmDatabaseLike>['all'] = async <TRow extends ResultRow = ResultRow>(
    query: SqlQuery,
  ) => {
    const rows = database.exec({
      sql: query.sql,
      bind: toPositionalBind(query.args),
      rowMode: 'object',
      returnValue: 'resultRows',
    });
    return (rows as TRow[] | undefined) ?? [];
  };
  const run: AsyncClient<SqliteWasmDatabaseLike>['run'] = async (query: SqlQuery) => {
    database.exec({
      sql: query.sql,
      bind: toPositionalBind(query.args),
    });
    return captureRunResult(database);
  };
  const raw: AsyncClient<SqliteWasmDatabaseLike>['raw'] = async (sql: string) => {
    return rawSqlWithSqlSplittingAsync(async (singleQuery) => {
      database.exec({
        sql: singleQuery.sql,
        bind: toPositionalBind(singleQuery.args),
      });
      return captureRunResult(database);
    }, sql);
  };
  const iterate: AsyncClient<SqliteWasmDatabaseLike>['iterate'] = async function* <TRow extends ResultRow = ResultRow>(
    query: SqlQuery,
  ) {
    const rows = await all<TRow>(query);
    for (const row of rows) {
      yield row;
    }
  };
  const prepare: AsyncClient<SqliteWasmDatabaseLike>['prepare'] = <TRow extends ResultRow = ResultRow>(
    sql: string,
  ): PreparedStatement<TRow> => {
    // sqlite-wasm exposes a low-level cursor `Stmt` via `db.prepare(sql)`, but
    // wrapping it would expand the structural `SqliteWasmDatabaseLike`
    // interface and require manual finalize/step plumbing in error paths.
    // Instead this shim captures the SQL and re-issues `db.exec` per call.
    // The wasm runtime caches parsed statements internally, so repeated exec
    // of the same SQL doesn't re-parse at the C level — sqlfu just doesn't
    // hold a native handle. Named params flow through wasm's native `bind`
    // shape after bare object keys are translated to the prefix used in SQL.
    return {
      async all(params) {
        const rows = database.exec({
          sql,
          bind: toBind(sql, params),
          rowMode: 'object',
          returnValue: 'resultRows',
        });
        return (rows as TRow[] | undefined) ?? [];
      },
      async run(params) {
        database.exec({
          sql,
          bind: toBind(sql, params),
        });
        return captureRunResult(database);
      },
      async *iterate(params) {
        const rows = database.exec({
          sql,
          bind: toBind(sql, params),
          rowMode: 'object',
          returnValue: 'resultRows',
        });
        for (const row of (rows as TRow[] | undefined) ?? []) {
          yield row;
        }
      },
      async [Symbol.asyncDispose]() {},
    };
  };
  const client: Omit<AsyncClient<SqliteWasmDatabaseLike>, 'sql'> & {sql: AsyncClient<SqliteWasmDatabaseLike>['sql']} = {
    driver: database,
    system: 'sqlite',
    sync: false,
    all,
    run,
    raw,
    iterate,
    prepare,
    async transaction<TResult>(fn: (tx: AsyncClient<SqliteWasmDatabaseLike>) => Promise<TResult> | TResult) {
      return surroundWithBeginCommitRollbackAsync(client, fn);
    },
    sql: undefined as unknown as AsyncClient<SqliteWasmDatabaseLike>['sql'],
  } satisfies AsyncClient<SqliteWasmDatabaseLike>;

  client.sql = bindAsyncSql(client);

  return wrapAsyncClientErrors(client);
}

export const createSqliteWasmDatabase = createSqliteWasmClient;

function toPositionalBind(args: QueryArg[]): SqliteWasmBindValue[] | undefined {
  if (args.length === 0) {
    return undefined;
  }
  return args.map(coerceBindValue);
}

function toBind(
  sql: string,
  params: PreparedStatementParams | undefined,
): SqliteWasmBindValue[] | Record<string, SqliteWasmBindValue> | undefined {
  if (params == null) return undefined;
  if (Array.isArray(params)) return toPositionalBind(params as QueryArg[]);
  const namedParameters = ordinaryNamedParameters(sql);
  const out: Record<string, SqliteWasmBindValue> = {};
  for (const [key, value] of Object.entries(params)) {
    out[sqliteWasmBindKey(key, namedParameters)] = coerceBindValue(value as QueryArg);
  }
  return out;
}

function sqliteWasmBindKey(key: string, namedParameters: Map<string, string>): string {
  if (hasBindPrefix(key)) return key;
  return namedParameters.get(key) || `:${key}`;
}

function hasBindPrefix(key: string): boolean {
  return key.startsWith(':') || key.startsWith('$') || key.startsWith('@');
}

function ordinaryNamedParameters(sql: string): Map<string, string> {
  const out = new Map<string, string>();
  let index = 0;
  while (index < sql.length) {
    const code = sql.charCodeAt(index);
    if (code === 0x27 /* ' */) {
      index = scanQuoted(sql, index, 0x27);
      continue;
    }
    if (code === 0x22 /* " */) {
      index = scanQuoted(sql, index, 0x22);
      continue;
    }
    if (code === 0x60 /* ` */) {
      index = scanQuoted(sql, index, 0x60);
      continue;
    }
    if (code === 0x5b /* [ */) {
      index = scanBracketedIdentifier(sql, index);
      continue;
    }
    if (code === 0x2d /* - */ && sql.charCodeAt(index + 1) === 0x2d /* - */) {
      index = scanLineComment(sql, index + 2);
      continue;
    }
    if (code === 0x2f /* / */ && sql.charCodeAt(index + 1) === 0x2a /* * */) {
      index = scanBlockComment(sql, index + 2);
      continue;
    }
    if (isNamedParameterPrefix(code) && isIdentStart(sql.charCodeAt(index + 1))) {
      const start = index;
      index += 2;
      while (index < sql.length && isIdentCont(sql.charCodeAt(index))) index++;
      const parameter = sql.slice(start, index);
      const name = parameter.slice(1);
      if (!out.has(name)) out.set(name, parameter);
      continue;
    }
    index++;
  }
  return out;
}

function scanQuoted(sql: string, start: number, quote: number): number {
  let index = start + 1;
  while (index < sql.length) {
    if (sql.charCodeAt(index) === quote) {
      if (sql.charCodeAt(index + 1) === quote) {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index++;
  }
  return sql.length;
}

function scanBracketedIdentifier(sql: string, start: number): number {
  let index = start + 1;
  while (index < sql.length) {
    if (sql.charCodeAt(index) === 0x5d /* ] */) return index + 1;
    index++;
  }
  return sql.length;
}

function scanLineComment(sql: string, start: number): number {
  let index = start;
  while (index < sql.length && sql.charCodeAt(index) !== 0x0a /* \n */) index++;
  return index;
}

function scanBlockComment(sql: string, start: number): number {
  let index = start;
  while (index < sql.length) {
    if (sql.charCodeAt(index) === 0x2a /* * */ && sql.charCodeAt(index + 1) === 0x2f /* / */) {
      return index + 2;
    }
    index++;
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

function coerceBindValue(value: QueryArg): SqliteWasmBindValue {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
}

function captureRunResult(database: SqliteWasmDatabaseLike) {
  const lastInsertRowidValue = database.selectValue('select last_insert_rowid() as value');
  const rowsAffected = Number(database.changes(false, false) ?? 0);
  const lastInsertRowid =
    typeof lastInsertRowidValue === 'bigint'
      ? Number(lastInsertRowidValue)
      : ((lastInsertRowidValue as number | null | undefined) ?? null);
  return {rowsAffected, lastInsertRowid};
}
