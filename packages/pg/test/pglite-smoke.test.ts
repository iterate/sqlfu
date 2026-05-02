import {expect, test} from 'vitest';
import {createClient} from '@pgkit/client';
import {Client as PgClient} from 'pg';

import {startPgliteFixture} from './pglite-fixture.js';

test('pglite fixture is reachable via raw `pg`', {timeout: 30_000}, async () => {
  await using fixture = await startPgliteFixture();
  const client = new PgClient(fixture.url);
  await client.connect();
  try {
    const result = await client.query<{one: number}>('select 1 as one');
    expect(result.rows).toEqual([{one: 1}]);
  } finally {
    await client.end();
  }
});

test('pglite fixture is reachable via @pgkit/client', {timeout: 30_000}, async () => {
  await using fixture = await startPgliteFixture();
  const client = createClient(fixture.url);
  try {
    const result = await client.any(client.sql`select 1 as one`);
    expect(result).toEqual([{one: 1}]);
  } finally {
    await client.end();
  }
});
