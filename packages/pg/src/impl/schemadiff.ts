// Postgres schema diff via `@pgkit/migra`.
//
// Wart: pgDialect.diffSchema doesn't currently know how to spin up a postgres
// instance to materialize the baseline + desired schemas against. The sqlite
// dialect uses `host.openScratchDb` which creates an in-memory sqlite db;
// there's no equivalent for pg. For now, this implementation throws if called
// without a pg connection-string available via the `SQLFU_PG_DIFF_URL`
// environment variable. A follow-up will add a proper config field for the
// scratch-db URL (or extend `SqlfuHost` with a dialect-aware scratch db
// factory) so users don't have to set an env var.
//
// Tests use pglite (in-process pg) and pass a connection URL through env.
import {Migration} from '@pgkit/migra';
import {createClient, type Client as PgkitClient} from '@pgkit/client';
import type {Dialect} from 'sqlfu';

const SCRATCH_SCHEMA_PREFIX = 'sqlfu_diff_';

export const pgDiffSchema: Dialect['diffSchema'] = async (_host, input) => {
  const baseUrl = process.env.SQLFU_PG_DIFF_URL;
  if (!baseUrl) {
    throw new Error(
      'pgDialect.diffSchema requires a postgres connection URL. Set the `SQLFU_PG_DIFF_URL` environment variable to a postgres URL with create-schema privileges. ' +
        'A follow-up will replace this env-var hack with a proper config field.',
    );
  }

  const baselineSchema = uniqueSchemaName('baseline');
  const desiredSchema = uniqueSchemaName('desired');

  const adminClient = createClient(baseUrl);
  try {
    await adminClient.query(adminClient.sql.raw(`create schema ${quoteIdent(baselineSchema)}`));
    await adminClient.query(adminClient.sql.raw(`create schema ${quoteIdent(desiredSchema)}`));

    const baselineClient = clientWithSearchPath(baseUrl, baselineSchema);
    const desiredClient = clientWithSearchPath(baseUrl, desiredSchema);

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
    await adminClient.query(adminClient.sql.raw(`drop schema if exists ${quoteIdent(baselineSchema)} cascade`));
    await adminClient.query(adminClient.sql.raw(`drop schema if exists ${quoteIdent(desiredSchema)} cascade`));
    await adminClient.end();
  }
};

function clientWithSearchPath(baseUrl: string, schema: string): PgkitClient {
  // pgkit's `createClient` takes a connection string; we add the schema as a
  // search_path option via the URL's `options` parameter. Postgres treats
  // unqualified DDL/DML as targeting the first schema in `search_path`, so
  // applying the user's schema SQL inside this client lands inside the
  // scratch schema.
  const url = new URL(baseUrl);
  const optionsParam = `-c search_path=${schema}`;
  url.searchParams.set('options', optionsParam);
  return createClient(url.toString());
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

function uniqueSchemaName(role: 'baseline' | 'desired'): string {
  // Random suffix avoids clashes between concurrent sqlfu invocations against
  // the same scratch db. Lowercase to match pg's identifier-folding default.
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${SCRATCH_SCHEMA_PREFIX}${role}_${suffix}`;
}

function splitMigraStatements(sql: string): string[] {
  if (!sql.trim()) {
    return [];
  }
  // Migra emits statements separated by `;` followed by newlines. Splitting
  // on raw `;` breaks string literals — but migra's output is generated DDL
  // which doesn't embed semicolons inside identifiers we care about. Match
  // the existing sqlite output shape: a list of self-contained statements
  // each ending in `;`.
  return sql
    .split(/;\s*\n/u)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0)
    .map((stmt) => (stmt.endsWith(';') ? stmt : `${stmt};`));
}
