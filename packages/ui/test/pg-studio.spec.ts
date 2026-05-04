// First playwright spec for the pg-ui story. Goal: prove the studio
// can render *anything* coherent against a postgres-backed project.
// This is the smallest possible "ui works for pg" assertion — when it
// fails, the failure mode tells us what to fix next.
//
// Skips if docker postgres isn't reachable (CI run-pg-tests style).
import {Client} from 'pg';

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

test('studio renders the schema for a pg project', async ({page, projectDir}) => {
  void projectDir;
  await page.goto('/');
  // Whatever the landing page does, it should at least surface the
  // table we declared in `definitions.sql`. The exact element shape
  // is a follow-up to nail down — for now the smallest assertion that
  // proves "something pg-aware loaded" is the table name itself.
  await expect(page.getByText('posts').first()).toBeVisible({timeout: 30_000});
});
