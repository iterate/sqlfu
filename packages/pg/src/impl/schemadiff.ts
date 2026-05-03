// Postgres schema diff via `@pgkit/migra`.
//
// Migra fundamentally compares two databases. We CREATE DATABASE two scratch
// databases (`sqlfu_scratch_<random>`) on the configured admin URL, apply
// the baseline DDL to one and the desired DDL to the other, run migra,
// and DROP DATABASE both. The factory function below closes over the
// admin URL so the resulting `diffSchema` impl doesn't need to thread it
// through.
//
// Why two databases instead of two schemas in one db: migra emits
// schema-qualified statements when the inputs sit in different schemas
// (e.g. `create schema X; create table X.users (...); drop schema Y`).
// Two databases each containing a `public` schema produce the
// per-table diffs callers expect.
import {Migration} from '@pgkit/migra';
import {createClient} from '@pgkit/client';
import type {Dialect} from 'sqlfu';

import {createTempDatabasePair} from './scratch-database.js';

export const pgDiffSchema = (adminUrl: string): Dialect['diffSchema'] => {
  return async (_host, input) => {
    await using pair = await createTempDatabasePair(adminUrl);

    const baselineClient = createClient(pair.baseline.url);
    const desiredClient = createClient(pair.desired.url);

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
