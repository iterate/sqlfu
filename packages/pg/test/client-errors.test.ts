// `createNodePostgresClient` turns Postgres errors into `SqlfuError`s whose
// `kind` comes from the SQLSTATE on the driver error (`cause.code`). Every
// error here is produced by a real Postgres, not a hand-built error object.
import {Pool} from 'pg';
import {createNodePostgresClient} from 'sqlfu';
import {expect, test} from 'vitest';

import {isPgReachable, startTempDatabase, TEST_ADMIN_URL} from './pg-fixture.js';

if (!(await isPgReachable())) {
  throw new Error(
    `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
      `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
  );
}

test('syntax error → syntax', async () => {
  await using db = await startClient();

  await expect(db.client.all({sql: 'seleeeeect 1', args: []})).rejects.toMatchObject({
    name: 'SqlfuError',
    kind: 'syntax',
    system: 'postgresql',
    query: {sql: 'seleeeeect 1'},
    message: 'syntax error at or near "seleeeeect"',
    cause: {code: '42601'},
  });
});

test('missing table → missing_table', async () => {
  await using db = await startClient();

  await expect(db.client.all({sql: 'select * from nope', args: []})).rejects.toMatchObject({
    kind: 'missing_table',
    cause: {code: '42P01'},
  });
});

test('missing column → missing_column', async () => {
  await using db = await startClient();
  await db.client.raw('create table users (email text)');

  await expect(db.client.all({sql: 'select nope from users', args: []})).rejects.toMatchObject({
    kind: 'missing_column',
    cause: {code: '42703'},
  });
});

test('duplicate unique value → unique_violation', async () => {
  await using db = await startClient();
  await db.client.raw('create table users (email text unique)');
  await db.client.run({sql: 'insert into users (email) values (?)', args: ['ada@example.com']});

  await expect(
    db.client.run({sql: 'insert into users (email) values (?)', args: ['ada@example.com']}),
  ).rejects.toMatchObject({
    kind: 'unique_violation',
    cause: {code: '23505', constraint: 'users_email_key'},
  });
});

test('duplicate primary key → unique_violation', async () => {
  await using db = await startClient();
  await db.client.raw('create table users (id int primary key)');
  await db.client.run({sql: 'insert into users (id) values (?)', args: [1]});

  await expect(db.client.run({sql: 'insert into users (id) values (?)', args: [1]})).rejects.toMatchObject({
    kind: 'unique_violation',
    cause: {code: '23505', constraint: 'users_pkey'},
  });
});

test('null in a not-null column → not_null_violation', async () => {
  await using db = await startClient();
  await db.client.raw('create table users (email text not null)');

  await expect(db.client.run({sql: 'insert into users (email) values (?)', args: [null]})).rejects.toMatchObject({
    kind: 'not_null_violation',
    cause: {code: '23502'},
  });
});

test('reference to a missing row → foreign_key_violation', async () => {
  await using db = await startClient();
  await db.client.raw(`
    create table authors (id int primary key);
    create table posts (author_id int references authors (id));
  `);

  await expect(db.client.run({sql: 'insert into posts (author_id) values (?)', args: [999]})).rejects.toMatchObject({
    kind: 'foreign_key_violation',
    cause: {code: '23503'},
  });
});

test('failed check constraint → check_violation', async () => {
  await using db = await startClient();
  await db.client.raw('create table users (age int check (age >= 0))');

  await expect(db.client.run({sql: 'insert into users (age) values (?)', args: [-1]})).rejects.toMatchObject({
    kind: 'check_violation',
    cause: {code: '23514'},
  });
});

test('row locked by another transaction → transient', async () => {
  await using db = await startClient();
  await db.client.raw(`
    create table jobs (id int);
    insert into jobs (id) values (1);
  `);

  await db.client.transaction(async (tx) => {
    await tx.all({sql: 'select * from jobs for update', args: []});

    // `db.client` (not `tx`) runs on a different pool connection, so it has to wait for the lock.
    await expect(db.client.all({sql: 'select * from jobs for update nowait', args: []})).rejects.toMatchObject({
      kind: 'transient',
      cause: {code: '55P03'},
    });
  });
});

test('serialization failure between concurrent transactions → transient', async () => {
  await using db = await startClient();
  await db.client.raw(`
    create table counters (id int primary key, value int);
    insert into counters (id, value) values (1, 0);
  `);

  await expect(
    db.client.transaction(async (tx) => {
      await tx.raw('set transaction isolation level repeatable read');
      await tx.all({sql: 'select * from counters', args: []});

      // Another connection commits a change to the row this transaction already read.
      await db.client.run({sql: 'update counters set value = value + 1 where id = ?', args: [1]});

      await tx.run({sql: 'update counters set value = value + 1 where id = ?', args: [1]});
    }),
  ).rejects.toMatchObject({
    kind: 'transient',
    cause: {code: '40001'},
  });
});

test('errors with no matching kind stay unknown', async () => {
  await using db = await startClient();

  await expect(db.client.all({sql: 'select 1 / 0', args: []})).rejects.toMatchObject({
    kind: 'unknown',
    message: 'division by zero',
    cause: {code: '22012'},
  });
});

async function startClient() {
  const database = await startTempDatabase();
  const pool = new Pool({connectionString: database.url});
  return {
    client: createNodePostgresClient(pool),
    async [Symbol.asyncDispose]() {
      await pool.end();
      await database[Symbol.asyncDispose]();
    },
  };
}
