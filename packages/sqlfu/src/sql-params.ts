import type {PreparedStatementParams, QueryArg} from './types.js';

export type SqlPlaceholderStyle = 'question' | 'postgres';

export type SqlNamedParameter = {
  kind: 'named';
  parameter: string;
  name: string;
  start: number;
  end: number;
};

type SqlPositionalParameter = {
  kind: 'positional';
  parameter: '?';
  start: number;
  end: number;
};

type SqlParameter = SqlNamedParameter | SqlPositionalParameter;

export function bindSqlParamsToPositional(
  sql: string,
  params: PreparedStatementParams | null | undefined,
  placeholderStyle: SqlPlaceholderStyle,
): {sql: string; args: QueryArg[]} {
  if (params == null || Array.isArray(params)) {
    return {
      sql: rewriteQuestionMarkPlaceholders(sql, placeholderStyle),
      args: params ? (params as QueryArg[]) : [],
    };
  }

  const named = params as Record<string, unknown>;
  const parameters = scanSqlParameters(sql);
  let out = '';
  let cursor = 0;
  let placeholderIndex = 0;
  const args: QueryArg[] = [];

  for (const parameter of parameters) {
    out += sql.slice(cursor, parameter.start);
    if (parameter.kind === 'positional') {
      out += positionalPlaceholder(placeholderStyle, ++placeholderIndex);
      cursor = parameter.end;
      continue;
    }

    out += positionalPlaceholder(placeholderStyle, ++placeholderIndex);
    cursor = parameter.end;
    if (!Object.prototype.hasOwnProperty.call(named, parameter.name)) {
      throw new Error(`SQL: missing value for named parameter "${parameter.name}".`);
    }
    args.push(named[parameter.name] as QueryArg);
  }

  out += sql.slice(cursor);
  return {sql: out, args};
}

export function bindSqlParamsToPrefixedRecord(
  sql: string,
  params: PreparedStatementParams | null | undefined,
): QueryArg[] | Record<string, QueryArg> | undefined {
  if (params == null) return undefined;
  if (Array.isArray(params)) return params as QueryArg[];

  const namedParameters = new Map<string, string>();
  for (const parameter of scanSqlNamedParameters(sql)) {
    if (!namedParameters.has(parameter.name)) namedParameters.set(parameter.name, parameter.parameter);
  }

  const out: Record<string, QueryArg> = {};
  for (const [key, value] of Object.entries(params)) {
    out[sqlBindKey(key, namedParameters)] = value as QueryArg;
  }
  return out;
}

export function scanSqlNamedParameters(sql: string): SqlNamedParameter[] {
  const out: SqlNamedParameter[] = [];
  for (const parameter of scanSqlParameters(sql)) {
    if (parameter.kind === 'named') out.push(parameter);
  }
  return out;
}

function rewriteQuestionMarkPlaceholders(sql: string, placeholderStyle: SqlPlaceholderStyle): string {
  if (placeholderStyle === 'question') return sql;

  let out = '';
  let cursor = 0;
  let placeholderIndex = 0;
  for (const parameter of scanSqlParameters(sql)) {
    if (parameter.kind !== 'positional') continue;
    out += sql.slice(cursor, parameter.start);
    out += positionalPlaceholder(placeholderStyle, ++placeholderIndex);
    cursor = parameter.end;
  }
  out += sql.slice(cursor);
  return out;
}

function scanSqlParameters(sql: string): SqlParameter[] {
  const out: SqlParameter[] = [];
  let index = 0;

  while (index < sql.length) {
    const skippedEnd = scanSqlIgnoredRange(sql, index);
    if (skippedEnd !== null) {
      index = skippedEnd;
      continue;
    }

    const code = sql.charCodeAt(index);
    if (code === 0x3f /* ? */) {
      out.push({kind: 'positional', parameter: '?', start: index, end: index + 1});
      index += 1;
      continue;
    }

    if (isNamedParameterPrefix(code) && isIdentStart(sql.charCodeAt(index + 1))) {
      const start = index;
      index += 2;
      while (index < sql.length && isIdentCont(sql.charCodeAt(index))) index += 1;
      const parameter = sql.slice(start, index);
      out.push({kind: 'named', parameter, name: parameter.slice(1), start, end: index});
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
  if (code === 0x24 /* $ */) return scanDollarQuotedString(sql, start);
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

function scanDollarQuotedString(sql: string, start: number): number | null {
  let index = start + 1;
  while (index < sql.length) {
    const code = sql.charCodeAt(index);
    if (code === 0x24 /* $ */) {
      const tag = sql.slice(start, index + 1);
      const end = sql.indexOf(tag, index + 1);
      return end === -1 ? null : end + tag.length;
    }
    if (!isIdentCont(code)) return null;
    index += 1;
  }
  return null;
}

function positionalPlaceholder(placeholderStyle: SqlPlaceholderStyle, index: number): string {
  return placeholderStyle === 'postgres' ? `$${index}` : '?';
}

function sqlBindKey(key: string, namedParameters: Map<string, string>): string {
  if (hasBindPrefix(key)) return key;
  return namedParameters.get(key) || `:${key}`;
}

function hasBindPrefix(key: string): boolean {
  return key.startsWith(':') || key.startsWith('$') || key.startsWith('@');
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
