import {Pool} from 'pg';
import {expect, test} from 'vitest';

import {createNodePostgresClient, type StandardQueryV1} from 'sqlfu';

import {isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';

if (!(await isPgReachable())) {
  throw new Error(
    `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
      `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
  );
}

test('a postgres client hands a Standard Query each value as the text the server sent', async () => {
  const pool = new Pool({connectionString: TEST_ADMIN_URL});
  const client = createNodePostgresClient(pool);

  // The raw form on Postgres is text: no int8 -> string, timestamptz -> Date, or int4[] -> number[]
  // parsing before `decode` sees the row.
  const raw: StandardQueryV1<{n: string}, unknown, 'postgres'> = {
    '~standard': {
      version: 1,
      vendor: 'hand-written',
      query: {
        dialect: 'postgres',
        text: `select $1::int8 + 1 as n, '2026-10-29 08:54:00+00'::timestamptz as at, '{1,2}'::int4[] as tags, null as n`,
        encode: (input) => [(input as {n: string}).n],
        decode: (rows) => rows,
      },
    },
  };

  try {
    expect(await client.execute(raw, {n: '9007199254740992'})).toEqual([
      ['9007199254740993', '2026-10-29 08:54:00+00', '{1,2}', null],
    ]);
    expect(await client.transaction((tx) => tx.execute(raw, {n: '1'}))).toEqual([
      ['2', '2026-10-29 08:54:00+00', '{1,2}', null],
    ]);
  } finally {
    await pool.end();
  }
});
