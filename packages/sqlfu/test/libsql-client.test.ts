import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {createClient} from '@libsql/client';
import {expect, test} from 'vitest';

import {createLibsqlClient} from '../src/client.js';

test('createLibsqlClient works with a real @libsql/client database', async () => {
  await using fixture = await createLibsqlFixture();
  await fixture.raw.execute('create table users (id integer primary key, email text not null)');

  await fixture.raw.execute({
    sql: 'insert into users (email) values (?), (?)',
    args: ['ada@example.com', 'grace@example.com'],
  });

  await expect(
    fixture.client.query<{id: number; email: string}>({
      sql: 'select id, email from users where email = ?',
      args: ['ada@example.com'],
    }).then(normalizeUserRows),
  ).resolves.toMatchObject([{id: 1, email: 'ada@example.com'}]);

  await expect(
    fixture.client.sql<{id: number; email: string}>`select id, email from users order by id`.then(normalizeUserRows),
  ).resolves.toMatchObject([
    {id: 1, email: 'ada@example.com'},
    {id: 2, email: 'grace@example.com'},
  ]);

  const writeResult = await fixture.client.sql.exec`insert into users (email) values (${'lin@example.com'})`;
  expect(writeResult.length).toBe(0);
  expect(writeResult.rowsAffected).toBe(1);
  expect(typeof writeResult.lastInsertRowid).toMatch(/^(bigint|number|string)$/);

  await expect(
    fixture.raw.execute('select id, email from users where email = \'lin@example.com\''),
  ).resolves.toMatchObject({
    rows: [{id: 3, email: 'lin@example.com'}],
  });
});

test('createLibsqlClient turns real sqlite syntax errors into promise rejections for tagged sql', async () => {
  await using fixture = await createLibsqlFixture();
  await fixture.raw.execute('create table users (id integer primary key, email text not null)');

  await expect(
    fixture.client.sql`selectTYPO from users`.then(
      (rows) => rows,
      (error) => String(error),
    ),
  ).resolves.toContain('syntax error');
});

async function createLibsqlFixture() {
  const dbPath = path.join(os.tmpdir(), `sqlfu-libsql-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  const raw = createClient({url: `file:${dbPath}`});

  return {
    raw,
    client: createLibsqlClient(raw),
    async [Symbol.asyncDispose]() {
      raw.close();
      await fs.rm(dbPath, {force: true});
    },
  };
}

function normalizeUserRows(rows: ReadonlyArray<{id: number; email: string}>) {
  return rows.map((row) => ({id: row.id, email: row.email}));
}
