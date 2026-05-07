// Postgres formatter. Uses `sql-formatter` directly (no vendoring — sqlfu's
// strict-tier bundle constraints don't apply here, this is a dev-time
// package). The user has flagged that they dislike sql-formatter's
// newline-heavy output; this module is the place to add sqlfu-style
// compaction (matching the sqlite formatter's `style: 'sqlfu'` clauses)
// when that work happens.
import {format, type FormatOptions} from 'sql-formatter';

import type {Dialect} from 'sqlfu';

type FormatSqlOptions = Parameters<Dialect['formatSql']>[1];

export const pgFormatSql: Dialect['formatSql'] = (sql, options) => {
  // Sqlfu's `FormatSqlOptions` extends sql-formatter's option set with
  // sqlfu-specific extras (`style`, `printWidth`, `inlineClauses`,
  // `newlineBeforeTableName`). For the pg path we currently honor only the
  // sql-formatter passthrough options; a future change can layer on the
  // sqlfu compaction step.
  const sqlFormatterOptions: Partial<FormatOptions> = options ? stripSqlfuExtras(options) : {};
  return format(sql, {language: 'postgresql', ...sqlFormatterOptions});
};

function stripSqlfuExtras(options: NonNullable<FormatSqlOptions>): Partial<FormatOptions> {
  const {style: _s, printWidth: _pw, inlineClauses: _ic, newlineBeforeTableName: _nb, ...rest} = options;
  return rest as Partial<FormatOptions>;
}
