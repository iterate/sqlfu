// Template config for the pg-flavored UI test projects. The fixture in
// `pg-fixture.ts` copies this template into a per-test project directory
// and creates a unique pg database. The database name is derived from
// the project's directory basename so each test is isolated.
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {Pool} from 'pg';
import {createNodePostgresClient, defineConfig} from 'sqlfu';
import {pgDialect} from '@sqlfu/pg';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const dbName = `sqlfu_ui_${path.basename(projectRoot).replaceAll(/[^a-z0-9_]/g, '_')}`;
const adminUrl = process.env.SQLFU_UI_PG_ADMIN_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5544/postgres';
const projectUrl = adminUrl.replace(/\/[^/]*$/, `/${dbName}`);

export default defineConfig({
  // The `db` factory must return a `DisposableAsyncClient`, *not* a bare
  // `AsyncClient`. The host's `openDb(config)` helper does
  // `await using database = await config.db()` and immediately tries to
  // dispose, so the returned object needs `[Symbol.asyncDispose]` (to
  // close the pool when the host is done with it). For node-postgres,
  // that's `await pool.end()`. The string-form of `db` (sqlite path)
  // wraps this for you in `openLocalSqliteFile`; the factory form has
  // to do it explicitly.
  db: () => {
    const pool = new Pool({connectionString: projectUrl});
    // Per-test fixtures drop their database while the dev server still has
    // a live pg connection to it. Postgres terminates the connection, the
    // pool surfaces that as an `error` event, and an unhandled `error` on
    // an `EventEmitter` crashes the host process. Production users build
    // their own pool and add this listener themselves; here we add it so
    // the dev-server-under-test survives fixture teardown.
    pool.on('error', () => {});
    return {
      client: createNodePostgresClient(pool),
      async [Symbol.asyncDispose]() {
        await pool.end();
      },
    };
  },
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {importExtension: '.ts'},
  dialect: pgDialect({adminUrl}),
});
