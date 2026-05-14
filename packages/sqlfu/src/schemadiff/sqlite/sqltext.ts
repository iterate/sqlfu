/*
 * SQLite-specific SQL text normalization and token scanning helpers.
 * This file intentionally stays SQLite-oriented; other dialects will likely need different tokenization rules.
 */
import {tokenize, type Token} from '../../vendor/sqlfu-sqlite-parser/tokenizer.js';
import {maybeQuoteIdentifier} from './identifiers.js';

export function normalizeStoredSql(sql: string): string {
  return normalizeStoredSqlWithIdentifiers(sql, []);
}

export function normalizeStoredSqlWithIdentifiers(sql: string, identifiers: string[]): string {
  const identifierByNormalizedName = new Map(identifiers.map((identifier) => [identifier.toLowerCase(), identifier]));
  try {
    return rewriteSchemaSql(sql, (token) => {
      if (token.kind === 'KEYWORD') {
        return token.value.toLowerCase();
      }

      if (token.kind !== 'IDENTIFIER') {
        return token.value;
      }

      const identifier = identifierByNormalizedName.get(unquoteIdentifierToken(token.value).toLowerCase());
      return identifier ? maybeQuoteIdentifier(identifier) : token.value;
    });
  } catch {
    // The tokenizer is intentionally lightweight. If SQLite accepts syntax it does not
    // understand yet, keep the catalog SQL visible instead of dropping the object on the floor.
    return trimSchemaSql(sql);
  }
}

export function normalizeViewDefinition(createSql: string): string {
  const normalized = normalizeComparableSql(createSql);
  const match = normalized.match(/\bas\s+(.+)$/iu);
  return match?.[1] ?? normalized;
}

export function normalizeComparableSql(sql: string): string {
  try {
    return rewriteSchemaSql(sql, normalizeComparableToken).replace(/\s+/gu, ' ');
  } catch {
    // Comparison must be conservative: unknown valid SQLite should produce a raw-text
    // difference, not an error or a false equality from partial token rewriting.
    return trimSchemaSql(sql).replace(/\s+/gu, ' ');
  }
}

export function normalizeSchemaSqlForExtraction(sql: string): string {
  return rewriteSchemaSql(sql, (token) => (token.kind === 'KEYWORD' ? token.value.toLowerCase() : token.value));
}

export function extractWhereClause(sql: string): string | null {
  if (!sql) {
    return null;
  }
  const match = sql.match(/\bwhere\b([\s\S]+)$/iu);
  return match?.[1] ? normalizeComparableSql(match[1]) : null;
}

export function sqlMentionsIdentifier(sql: string, identifier: string): boolean {
  return sqlIdentifierTokens(sql).has(identifier.toLowerCase());
}

export function splitTopLevelCommaList(sql: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inBracket = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]!;
    const next = sql[index + 1];

    current += char;

    if (inSingleQuote) {
      if (char === "'" && next === "'") {
        current += next;
        index += 1;
        continue;
      }
      if (char === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (char === '"' && next === '"') {
        current += next;
        index += 1;
        continue;
      }
      if (char === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (inBacktick) {
      if (char === '`') {
        inBacktick = false;
      }
      continue;
    }

    if (inBracket) {
      if (char === ']') {
        inBracket = false;
      }
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }
    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (char === '`') {
      inBacktick = true;
      continue;
    }
    if (char === '[') {
      inBracket = true;
      continue;
    }
    if (char === '(') {
      depth += 1;
      continue;
    }
    if (char === ')') {
      depth -= 1;
      continue;
    }
    if (char === ',' && depth === 0) {
      parts.push(current.slice(0, -1));
      current = '';
    }
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}

export function normalizeIdentifierToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('""', '"').toLowerCase();
  }
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).toLowerCase();
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function sqlIdentifierTokens(sql: string): ReadonlySet<string> {
  const tokens = new Set<string>();

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]!;
    const next = sql[index + 1];

    if (char === "'") {
      index = skipSingleQuotedString(sql, index);
      continue;
    }

    if (char === '"') {
      const {value, endIndex} = readDelimitedIdentifier(sql, index, '"');
      tokens.add(value);
      index = endIndex;
      continue;
    }

    if (char === '`') {
      const {value, endIndex} = readDelimitedIdentifier(sql, index, '`');
      tokens.add(value);
      index = endIndex;
      continue;
    }

    if (char === '[') {
      const endIndex = sql.indexOf(']', index + 1);
      if (endIndex === -1) {
        break;
      }
      tokens.add(sql.slice(index + 1, endIndex).toLowerCase());
      index = endIndex;
      continue;
    }

    if (char === '-' && next === '-') {
      index = skipLineComment(sql, index);
      continue;
    }

    if (char === '/' && next === '*') {
      index = skipBlockComment(sql, index);
      continue;
    }

    if (!/[a-z_]/iu.test(char)) {
      continue;
    }

    let endIndex = index + 1;
    while (endIndex < sql.length && /[a-z0-9_$]/iu.test(sql[endIndex]!)) {
      endIndex += 1;
    }
    tokens.add(sql.slice(index, endIndex).toLowerCase());
    index = endIndex - 1;
  }

  return tokens;
}

function skipSingleQuotedString(sql: string, startIndex: number): number {
  for (let index = startIndex + 1; index < sql.length; index += 1) {
    if (sql[index] !== "'") {
      continue;
    }
    if (sql[index + 1] === "'") {
      index += 1;
      continue;
    }
    return index;
  }
  return sql.length - 1;
}

function readDelimitedIdentifier(
  sql: string,
  startIndex: number,
  delimiter: '"' | '`',
): {value: string; endIndex: number} {
  let value = '';

  for (let index = startIndex + 1; index < sql.length; index += 1) {
    const char = sql[index]!;
    const next = sql[index + 1];
    if (char === delimiter && next === delimiter) {
      value += delimiter;
      index += 1;
      continue;
    }
    if (char === delimiter) {
      return {value: value.toLowerCase(), endIndex: index};
    }
    value += char;
  }

  return {value: value.toLowerCase(), endIndex: sql.length - 1};
}

function skipLineComment(sql: string, startIndex: number): number {
  const newlineIndex = sql.indexOf('\n', startIndex + 2);
  return newlineIndex === -1 ? sql.length - 1 : newlineIndex;
}

function skipBlockComment(sql: string, startIndex: number): number {
  const endIndex = sql.indexOf('*/', startIndex + 2);
  return endIndex === -1 ? sql.length - 1 : endIndex + 1;
}

function rewriteSchemaSql(sql: string, rewriteToken: (token: Token) => string): string {
  const trimmed = trimSchemaSql(sql);
  if (!trimmed) {
    return '';
  }

  const tokens = tokenize(trimmed);
  let output = '';
  let position = 0;

  for (const token of tokens) {
    output += trimmed.slice(position, token.start);
    output += rewriteToken(token);
    position = token.stop + 1;
  }

  output += trimmed.slice(position);
  return output;
}

function normalizeComparableToken(token: Token): string {
  if (token.kind === 'KEYWORD') {
    return token.value.toLowerCase();
  }

  if (token.kind !== 'IDENTIFIER') {
    return token.value;
  }

  // SQLite may treat double-quoted text as a string literal in compatibility contexts.
  // Preserving it can create false positives for case-only quoted identifier changes, but
  // lowercasing it can create false negatives for semantic literal changes.
  if (token.value.startsWith('"')) {
    return token.value;
  }

  return token.value.toLowerCase();
}

function trimSchemaSql(sql: string): string {
  return sql.trim().replace(/;+$/u, '');
}

function unquoteIdentifierToken(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replaceAll('""', '"');
  }
  if (value.startsWith('`') && value.endsWith('`')) {
    return value.slice(1, -1).replaceAll('``', '`');
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1);
  }
  return value;
}
