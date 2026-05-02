// Postgres schema diff via `@pgkit/migra`.
//
// Wart: pgDialect.diffSchema needs *two* postgres databases — one with the
// baseline schema applied, one with the desired schema applied. Migra
// compares them as two parallel realities of the same logical database.
//
// Today the dialect reads connection URLs from environment variables:
//
//   SQLFU_PG_DIFF_BASELINE_URL  pg url with the baseline schema pre-applied
//   SQLFU_PG_DIFF_DESIRED_URL   pg url with the desired schema pre-applied
//
// Tests spin up two pglite instances (each its own logical database) and
// point these env vars at them. A follow-up will replace the env-var hack
// with proper config fields and likely add an "auto-create temp databases
// on a given pg server" code path so users don't have to provision two
// databases by hand.
//
// Why not two schemas in one database? Migra fundamentally compares two
// databases — comparing two scratch schemas in one db produces diffs that
// schema-qualify everything (`create schema X; create table X.users (...);
// drop schema Y`), which isn't what callers want.
import {Migration} from '@pgkit/migra';
import {createClient, type Client as PgkitClient} from '@pgkit/client';
import type {Dialect} from 'sqlfu';

export const pgDiffSchema: Dialect['diffSchema'] = async (_host, input) => {
  const baselineUrl = process.env.SQLFU_PG_DIFF_BASELINE_URL;
  const desiredUrl = process.env.SQLFU_PG_DIFF_DESIRED_URL;
  if (!baselineUrl || !desiredUrl) {
    throw new Error(
      'pgDialect.diffSchema requires baseline + desired postgres connection URLs. ' +
        'Set SQLFU_PG_DIFF_BASELINE_URL and SQLFU_PG_DIFF_DESIRED_URL to two databases ' +
        '(each pre-loaded with the baseline / desired schema). ' +
        'A follow-up will replace this env-var hack with proper config fields.',
    );
  }

  const baselineClient = createClient(baselineUrl);
  const desiredClient = createClient(desiredUrl);

  try {
    if (input.baselineSql.trim()) {
      await baselineClient.query(baselineClient.sql.raw(input.baselineSql));
    }
    if (input.desiredSql.trim()) {
      await desiredClient.query(desiredClient.sql.raw(input.desiredSql));
    }

    const migration = await Migration.create(baselineClient, desiredClient, {
      schema: undefined,
      exclude_schema: undefined,
      ignore_extension_versions: true,
    });
    if (input.allowDestructive) {
      migration.set_safety(false);
    }
    migration.add_all_changes();

    return splitMigraStatements(migration.sql);
  } finally {
    await baselineClient.end();
    await desiredClient.end();
  }
};

function splitMigraStatements(sql: string): string[] {
  if (!sql.trim()) {
    return [];
  }
  return sql
    .split(/;\s*\n/u)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0)
    .map((stmt) => (stmt.endsWith(';') ? stmt : `${stmt};`));
}

// Re-export `PgkitClient` so other dialect modules sharing the connection
// pattern can pick it up without re-importing pgkit.
export type {PgkitClient};
