// Postgres schema diff via the vendored `migra`.
//
// Migra fundamentally compares two databases. We CREATE DATABASE two
// scratch databases (`sqlfu_scratch_<random>`) on the configured admin
// URL, apply the baseline DDL to one and the desired DDL to the other,
// run migra, and DROP DATABASE both.
//
// Why two databases instead of two schemas in one db: migra emits
// schema-qualified statements when the inputs sit in different schemas
// (e.g. `create schema X; create table X.users (...); drop schema Y`).
// Two databases each containing a `public` schema produce the per-table
// diffs callers expect.
//
// Driver-agnostic: we open per-scratch-db connections via sqlfu's
// `createNodePostgresClient` (one place where `pg` is touched), then
// adapt those AsyncClients to the vendored migra's narrow `Queryable`
// surface via `adaptAsyncClient`.
import {Pool} from 'pg';
import {createNodePostgresClient, type Dialect} from 'sqlfu';

import {Migration} from '../vendor/migra/index.js';
import {adaptAsyncClient} from '../vendor/schemainspect/pgkit-compat.js';
import {createTempDatabasePair} from './scratch-database.js';

export const pgDiffSchema = (adminUrl: string): Dialect['diffSchema'] => {
  return async (_host, input) => {
    await using pair = await createTempDatabasePair(adminUrl);

    const baselinePool = new Pool({connectionString: pair.baseline.url, max: 1});
    const desiredPool = new Pool({connectionString: pair.desired.url, max: 1});
    const baselineClient = createNodePostgresClient(baselinePool);
    const desiredClient = createNodePostgresClient(desiredPool);

    try {
      if (input.baselineSql.trim()) {
        await baselineClient.raw(input.baselineSql);
      }
      if (input.desiredSql.trim()) {
        await desiredClient.raw(input.desiredSql);
      }

      const migration = await Migration.create(adaptAsyncClient(baselineClient), adaptAsyncClient(desiredClient), {
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
      await baselinePool.end();
      await desiredPool.end();
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
