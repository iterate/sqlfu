/*
 * Formatter adapter around vendored sql-formatter code from
 * https://github.com/sql-formatter-org/sql-formatter at version 15.7.3 / commit
 * a66b90020b7373155aa2e95a1bdc7d18055ae601 (MIT).
 *
 * Local modifications are intentionally small:
 * - support a `dialect` option name in sqlfu's public API
 * - default to the sqlite dialect
 */

import {format, supportedDialects} from './vendor/sql-formatter/sqlFormatter.js';

import type {
  FormatOptionsWithLanguage as VendoredFormatOptionsWithLanguage,
  SqlLanguage,
} from './vendor/sql-formatter/sqlFormatter.js';

export type SqlFormatDialect = SqlLanguage;

export type FormatSqlOptions = Omit<VendoredFormatOptionsWithLanguage, 'language'> & {
  readonly dialect?: SqlFormatDialect;
};

export const supportedSqlDialects = supportedDialects;

export function formatSql(sql: string, options: FormatSqlOptions = {}): string {
  const {dialect = 'sqlite', ...rest} = options;
  return format(sql, {
    ...rest,
    language: dialect,
  });
}
