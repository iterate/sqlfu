// Pg-flavored mirrors of key flows from `studio.spec.ts`. The premise:
// the UI is largely a renderer over the same `sqlfu draft` / `sqlfu sync`
// / `sqlfu migrate` commands the CLI runs, all of which go through the
// dialect interface. So if these specs pass for pg the way the sqlite
// equivalents pass, migrations are functionally working for pg.
//
// Skips if docker postgres isn't reachable.
import fs from 'node:fs/promises';
import path from 'node:path';

import {Client} from 'pg';
import type {Locator, Page} from '@playwright/test';

import {expect, test} from './pg-fixture.ts';

const ADMIN_URL =
  process.env.SQLFU_UI_PG_ADMIN_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5544/postgres';

test.beforeAll(async () => {
  const client = new Client({connectionString: ADMIN_URL});
  try {
    await client.connect();
    await client.query('select 1');
  } catch (error) {
    test.skip(
      true,
      `pg not reachable at ${ADMIN_URL}. Run \`docker compose -f packages/pg/test/docker-compose.yml up -d\` first.`,
    );
    void error;
  } finally {
    await client.end().catch(() => {});
  }
});

test('schema page surfaces drift cards for an empty pg database', async ({page}) => {
  // Definitions describe a `posts` table; the pg db is fresh + empty.
  // The drift-card UI should reflect that gap.
  await page.goto('/#schema');
  await expect(page.getByRole('heading', {name: 'Schema', exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Repo Drift'})).toBeVisible();
  await expect(page.getByText('Desired Schema does not match Migrations.')).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Schema Drift'})).toBeVisible();
});

test('sqlfu draft writes a pg migration that captures the desired schema', async ({page, projectDir}) => {
  const migrationsDir = path.join(projectDir, 'migrations');

  await page.goto('/#schema');
  await expect(page.getByRole('heading', {name: 'Schema', exact: true})).toBeVisible();

  await confirmAndRunSchemaCommand(page, page.getByRole('button', {name: 'sqlfu draft'}), 'sqlfu draft');

  await expect
    .poll(async () => {
      try {
        return (await fs.readdir(migrationsDir)).filter((name) => name.endsWith('.sql')).length;
      } catch {
        return 0;
      }
    })
    .toBe(1);

  // The drafted migration's body should reference the table from
  // definitions.sql. Don't assert exact pg-migra wording — just that
  // the table name made it through the diff.
  const [migrationFile] = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith('.sql'));
  const migrationContents = await fs.readFile(path.join(migrationsDir, migrationFile), 'utf8');
  expect(migrationContents.toLowerCase()).toContain('posts');
});

test('sqlfu migrate applies a pending pg migration to the live db', async ({page, projectDir, dbName}) => {
  // Pre-seed a migration so this spec is independent of `sqlfu draft`.
  const migrationsDir = path.join(projectDir, 'migrations');
  await fs.mkdir(migrationsDir, {recursive: true});
  await fs.writeFile(
    path.join(migrationsDir, '0001_create_posts.sql'),
    `create table posts (
       id integer primary key,
       slug text not null unique,
       title text not null,
       body text not null,
       published boolean not null
     );
     create view post_cards as select id, slug, title, published from posts;`,
  );

  await page.goto('/#schema');
  await expect(page.getByRole('heading', {name: 'Schema', exact: true})).toBeVisible();

  await confirmAndRunSchemaCommand(page, page.getByRole('button', {name: 'sqlfu migrate'}), 'sqlfu migrate');

  // Migration ran → table exists. Poll because the command is streamed
  // and the confirm response returns before the apply completes.
  await expect.poll(() => pgRelationExists(dbName, 'posts'), {timeout: 15_000}).toBe(true);
  await expect.poll(() => pgMigrationApplied(dbName, '0001_create_posts'), {timeout: 5_000}).toBe(true);
});

async function pgRelationExists(dbName: string, tableName: string): Promise<boolean> {
  const url = ADMIN_URL.replace(/\/[^/]*$/, `/${dbName}`);
  const client = new Client({connectionString: url});
  try {
    await client.connect();
    // `to_regclass($1)` returns null when the relation doesn't exist, the
    // relation oid otherwise. Cast to text strips it back to the bare
    // relname (or schema-qualified form if the relation isn't in
    // search_path) — we only care that it's non-null.
    const result = await client.query<{n: string | null}>(
      `select to_regclass($1)::text as n`,
      [`public.${tableName}`],
    );
    return result.rows[0]?.n != null;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function pgMigrationApplied(dbName: string, migrationName: string): Promise<boolean> {
  const url = ADMIN_URL.replace(/\/[^/]*$/, `/${dbName}`);
  const client = new Client({connectionString: url});
  try {
    await client.connect();
    const result = await client.query<{name: string}>(
      `select name from sqlfu_migrations where name = $1`,
      [migrationName],
    );
    return result.rows[0]?.name === migrationName;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function confirmAndRunSchemaCommand(page: Page, button: Locator, commandLabel: string) {
  // The button click starts a streaming `schema/command` request that
  // keeps running well after the user's confirmation reaches the
  // backend. The schema panel's `runCommandMutation` surfaces a
  // `<commandLabel> succeeded` (or `Running …`) status line that
  // settles only when the streaming command finishes. Waiting on
  // that text is the same signal a real user would look at — and
  // means the spec is asserting on observable UI state, not on
  // an internal network detail. It also means fixture teardown
  // can't race a still-running command and tear down its pg
  // database out from under live pool connections.
  await button.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
  await expect(dialog).not.toBeVisible();
  // Pg `sqlfu migrate` needs to spin up pg-migra under docker — longer than
  // the global 15s expect timeout. 30s leaves headroom for cold container
  // starts in CI without papering over real regressions.
  await expect(page.getByText(`${commandLabel} succeeded`)).toBeVisible({timeout: 30_000});
}
