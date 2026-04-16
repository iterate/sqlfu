/*
 * SQLite-specific identifier rendering helpers.
 * This file is a seam for future dialect-specific identifier logic if schemadiff grows beyond SQLite.
 */
import {SQL_KEYWORDS} from '../keywords.js';

export function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function maybeQuoteIdentifier(value: string): string {
  return isSimpleIdentifier(value) && !SQL_KEYWORDS.has(value.toLowerCase()) ? value : quoteIdentifier(value);
}

export function quoteSqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function renderTableName(value: string): string {
  return maybeQuoteIdentifier(value);
}

function isSimpleIdentifier(value: string): boolean {
  return /^[a-z_][a-z0-9_]*$/u.test(value);
}
