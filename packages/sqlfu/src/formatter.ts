/*
 * Formatter adapter around vendored sql-formatter code from
 * https://github.com/sql-formatter-org/sql-formatter at version 15.7.3 / commit
 * a66b90020b7373155aa2e95a1bdc7d18055ae601 (MIT).
 *
 * Calls `formatDialect` with a per-call dialect (sqlite / postgresql) rather
 * than upstream's `format`, which ships a 20-dialect lookup table. esbuild
 * still tree-shakes unused dialects out of the bundle (the import below
 * pulls in only the two we actually expose).
 */

import {formatDialect} from './vendor/sql-formatter/sqlFormatter.js';
import {postgresql} from './vendor/sql-formatter/languages/postgresql/postgresql.formatter.js';
import {sqlite} from './vendor/sql-formatter/languages/sqlite/sqlite.formatter.js';

import type {FormatOptionsWithLanguage as VendoredFormatOptionsWithLanguage} from './vendor/sql-formatter/sqlFormatter.js';

export type SqlFormatStyle = 'sqlfu' | 'upstream';

/** Subset of the vendored dialects we expose by name. */
export type SqlFormatLanguage = 'sqlite' | 'postgresql';

export type FormatSqlOptions = Omit<VendoredFormatOptionsWithLanguage, 'language'> & {
  style?: SqlFormatStyle;
  printWidth?: number;
  inlineClauses?: boolean;
  newlineBeforeTableName?: boolean;
  /**
   * Pick the SQL dialect to format for. Default `'sqlite'` keeps the
   * historical behavior; consumers driven by a project config (the CLI,
   * the lint plugin, the public `format()` API) pass through whatever
   * the project's `dialect.name` resolves to.
   */
  language?: SqlFormatLanguage;
};

const dialectsByLanguage = {sqlite, postgresql} as const;

const sqlfuDefaultOptions = {
  tabWidth: 2,
  keywordCase: 'lower',
  identifierCase: 'lower',
  dataTypeCase: 'lower',
  functionCase: 'lower',
  linesBetweenQueries: 1,
} as const;
const compactableClauses = new Set(['select', 'from', 'where', 'group by', 'having', 'order by', 'limit', 'returning']);

export function formatSql(sql: string, options: FormatSqlOptions = {}): string {
  const {
    style = 'sqlfu',
    printWidth = 80,
    inlineClauses = style === 'sqlfu',
    newlineBeforeTableName = false,
    language = 'sqlite',
    ...rest
  } = options;
  const vendoredOptions = style === 'sqlfu' ? {...sqlfuDefaultOptions, ...rest} : rest;
  const formatted = formatDialect(sql, {
    ...vendoredOptions,
    dialect: dialectsByLanguage[language],
  });

  if (!inlineClauses) {
    return formatted;
  }

  return compactClauses(formatted, {printWidth, newlineBeforeTableName});
}

function compactClauses(sql: string, options: {printWidth: number; newlineBeforeTableName: boolean}): string {
  const lines = sql.split('\n');
  const compacted: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line === '' || line.startsWith('  ') || isStandaloneComment(line)) {
      compacted.push(line);
      continue;
    }

    const bodyLines: string[] = [];
    while (index + 1 < lines.length && lines[index + 1].startsWith('  ')) {
      bodyLines.push(lines[index + 1]);
      index += 1;
    }

    compacted.push(...compactClause(line, bodyLines, options));
  }

  return compacted.join('\n');
}

function compactClause(
  header: string,
  bodyLines: string[],
  options: {printWidth: number; newlineBeforeTableName: boolean},
): string[] {
  if (bodyLines.length === 0) {
    return [header];
  }

  const normalizedHeader = header.trim().toLowerCase();
  if (!compactableClauses.has(normalizedHeader)) {
    return [header, ...bodyLines];
  }

  if (normalizedHeader === 'from' && options.newlineBeforeTableName) {
    return [header, ...bodyLines];
  }

  if (!bodyLines.every((line) => line.startsWith('  ') && !line.startsWith('    '))) {
    return [header, ...bodyLines];
  }

  if (bodyLines.some((line) => isStandaloneComment(line.trim()) || /\/\*/.test(line))) {
    return [header, ...bodyLines];
  }

  const body = bodyLines.map((line) => line.trim()).join(' ');
  if (body.length === 0) {
    return [header, ...bodyLines];
  }

  const inline = `${header} ${body}`;
  if (inline.length <= options.printWidth) {
    return [inline];
  }

  if (normalizedHeader === 'from') {
    return [header, ...bodyLines];
  }

  return [header, ...bodyLines];
}

function isStandaloneComment(line: string): boolean {
  return line.startsWith('--') || line.startsWith('/*') || line.startsWith('*/') || /^\*\s/.test(line);
}

/**
 * Format a standalone `.sql` file's contents the same way the `format-sql`
 * rule formats inline SQL templates. Pure string-in, string-out; preserves a
 * trailing newline if the input had one.
 */
export function formatSqlFileContents(contents: string, options: {language?: SqlFormatLanguage} = {}): string {
  if (!contents.trim()) return contents;
  const formatted = formatSql(contents, {style: 'sqlfu', language: options.language}).trim();
  return formatted + (contents.match(/\s*$/)?.[0] || '');
}
