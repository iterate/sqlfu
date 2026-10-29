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
  return prepareSqlParamsBinding(sql, placeholderStyle).bind(params);
}

export type PreparedSqlParamsBinding = {
  bind(params: PreparedStatementParams | null | undefined): {sql: string; args: QueryArg[]};
};

/**
 * Scan the SQL once and return a binder for repeated calls — the rewritten SQL
 * is a pure function of the input, so adapters that re-issue the same
 * statement (durable objects re-exec per call) can cache this instead of
 * rescanning every execution. Only the args extraction depends on `params`.
 */
export function prepareSqlParamsBinding(sql: string, placeholderStyle: SqlPlaceholderStyle): PreparedSqlParamsBinding {
  const parameters = scanSqlParameters(sql, placeholderStyle);
  const positionalOnlySql = renderPositionalSql(
    sql,
    parameters.filter((parameter) => parameter.kind === 'positional'),
    placeholderStyle,
  );
  const allPositionalSql = renderPositionalSql(sql, parameters, placeholderStyle);
  const namedParameterNames = parameters.flatMap((parameter) => (parameter.kind === 'named' ? [parameter.name] : []));

  return {
    bind(params) {
      if (params == null || Array.isArray(params)) {
        return {sql: positionalOnlySql, args: params ? (params as QueryArg[]) : []};
      }
      const named = params as Record<string, unknown>;
      const args: QueryArg[] = [];
      for (const name of namedParameterNames) {
        if (!Object.prototype.hasOwnProperty.call(named, name)) {
          throw new Error(`SQL: missing value for named parameter "${name}".`);
        }
        args.push(named[name] as QueryArg);
      }
      return {sql: allPositionalSql, args};
    },
  };
}

function renderPositionalSql(sql: string, parameters: SqlParameter[], placeholderStyle: SqlPlaceholderStyle): string {
  let out = '';
  let cursor = 0;
  let placeholderIndex = 0;
  for (const parameter of parameters) {
    out += sql.slice(cursor, parameter.start);
    out += positionalPlaceholder(placeholderStyle, ++placeholderIndex);
    cursor = parameter.end;
  }
  out += sql.slice(cursor);
  return out;
}

export function bindSqlParamsToPrefixedRecord(
  sql: string,
  params: PreparedStatementParams | null | undefined,
): QueryArg[] | Record<string, QueryArg> | undefined {
  if (params == null) return undefined;
  if (Array.isArray(params)) return params as QueryArg[];

  const namedParameters = new Map<string, string[]>();
  for (const parameter of scanSqlNamedParameters(sql)) {
    const parameters = namedParameters.get(parameter.name);
    if (parameters) {
      if (!parameters.includes(parameter.parameter)) parameters.push(parameter.parameter);
    } else {
      namedParameters.set(parameter.name, [parameter.parameter]);
    }
  }

  const out: Record<string, QueryArg> = {};
  for (const [key, value] of Object.entries(params)) {
    for (const bindKey of sqlBindKeys(key, namedParameters)) {
      out[bindKey] = value as QueryArg;
    }
  }
  return out;
}

export function scanSqlNamedParameters(sql: string): SqlNamedParameter[] {
  const out: SqlNamedParameter[] = [];
  for (const parameter of scanSqlParameters(sql, 'question')) {
    if (parameter.kind === 'named') out.push(parameter);
  }
  return out;
}

function scanSqlParameters(sql: string, placeholderStyle: SqlPlaceholderStyle): SqlParameter[] {
  const out: SqlParameter[] = [];
  let index = 0;

  while (index < sql.length) {
    const skippedEnd = scanSqlIgnoredRange(sql, index, placeholderStyle);
    if (skippedEnd !== null) {
      index = skippedEnd;
      continue;
    }

    const code = sql.charCodeAt(index);
    if (code === 0x3f /* ? */) {
      if (placeholderStyle === 'postgres' && isPostgresQuestionOperator(sql, index)) {
        index += 1;
        continue;
      }
      out.push({kind: 'positional', parameter: '?', start: index, end: index + 1});
      index += 1;
      continue;
    }

    if (isNamedParameterPrefix(code) && isNamedParameterStart(sql, index)) {
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

function scanSqlIgnoredRange(sql: string, start: number, placeholderStyle: SqlPlaceholderStyle): number | null {
  const code = sql.charCodeAt(start);
  if (code === 0x27 /* ' */) return scanQuotedSql(sql, start, 0x27);
  if (code === 0x22 /* " */) return scanQuotedSql(sql, start, 0x22);
  if (code === 0x60 /* ` */) return scanQuotedSql(sql, start, 0x60);
  if (code === 0x5b /* [ */ && placeholderStyle !== 'postgres') return scanBracketedSqlIdentifier(sql, start);
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

function isPostgresQuestionOperator(sql: string, index: number): boolean {
  const next = sql.charCodeAt(index + 1);
  if (next === 0x7c /* | */ || next === 0x26 /* & */) return true;

  const previousIndex = previousNonWhitespaceIndex(sql, index - 1);
  const nextIndex = nextNonWhitespaceIndex(sql, index + 1);
  if (previousIndex === -1 || nextIndex === -1) return false;
  return isExpressionTokenEnd(sql, previousIndex) && isExpressionTokenStart(sql, nextIndex);
}

function sqlBindKeys(key: string, namedParameters: Map<string, string[]>): string[] {
  if (hasBindPrefix(key)) return [key];
  return namedParameters.get(key) || [`:${key}`];
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

function isNamedParameterStart(sql: string, index: number): boolean {
  if (sql.charCodeAt(index) === 0x3a /* : */) {
    if (sql.charCodeAt(index - 1) === 0x3a /* : */ || sql.charCodeAt(index + 1) === 0x3a /* : */) {
      return false;
    }
  }
  return isIdentStart(sql.charCodeAt(index + 1));
}

function previousNonWhitespaceIndex(sql: string, start: number): number {
  for (let index = start; index >= 0; index -= 1) {
    if (!/\s/u.test(sql[index]!)) return index;
  }
  return -1;
}

function nextNonWhitespaceIndex(sql: string, start: number): number {
  for (let index = start; index < sql.length; index += 1) {
    if (!/\s/u.test(sql[index]!)) return index;
  }
  return -1;
}

function isExpressionTokenEnd(sql: string, index: number): boolean {
  const code = sql.charCodeAt(index);
  if (isIdentCont(code)) return !previousWordIsNonExpression(sql, index);
  return code === 0x27 /* ' */ || code === 0x22 /* " */ || code === 0x5d /* ] */ || code === 0x29 /* ) */;
}

function isExpressionTokenStart(sql: string, index: number): boolean {
  const code = sql.charCodeAt(index);
  return (
    isIdentStart(code) ||
    (code >= 0x30 && code <= 0x39) ||
    code === 0x27 /* ' */ ||
    code === 0x22 /* " */ ||
    code === 0x28 /* ( */ ||
    code === 0x5b /* [ */ ||
    code === 0x3a /* : */ ||
    code === 0x40 /* @ */ ||
    code === 0x24 /* $ */ ||
    code === 0x3f /* ? */ ||
    code === 0x2d /* - */
  );
}

function previousWordIsNonExpression(sql: string, end: number): boolean {
  let start = end;
  while (start > 0 && isIdentCont(sql.charCodeAt(start - 1))) start -= 1;
  const word = sql.slice(start, end + 1).toLowerCase();
  return NON_EXPRESSION_PREVIOUS_WORDS.has(word);
}

const NON_EXPRESSION_PREVIOUS_WORDS = new Set([
  'all',
  'and',
  'as',
  'between',
  'by',
  'case',
  'delete',
  'distinct',
  'else',
  'end',
  'except',
  'from',
  'group',
  'having',
  'in',
  'insert',
  'intersect',
  'is',
  'join',
  'like',
  'limit',
  'not',
  'offset',
  'on',
  'or',
  'order',
  'returning',
  'select',
  'set',
  'then',
  'union',
  'update',
  'using',
  'values',
  'when',
  'where',
  'with',
]);
