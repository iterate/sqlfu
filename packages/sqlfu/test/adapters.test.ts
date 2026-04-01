import {expect, test} from 'vitest';

import {
  createBetterSqlite3Client,
  createBunClient,
  createDurableObjectClient,
  createLibsqlClient,
  type BetterSqlite3DatabaseLike,
  type BunSqliteDatabaseLike,
  type DurableObjectSqlStorageLike,
  type LibsqlClientLike,
} from '../src/client.js';

test('createLibsqlClient makes sql awaitable and keeps sql.exec async', async () => {
  const calls: Array<string | {sql: string; args?: readonly unknown[]}> = [];
  const client = createLibsqlClient({
    async execute(statement) {
      calls.push(statement);
      return {
        rows: [{id: 1, email: 'ada@example.com'}],
      };
    },
  } as LibsqlClientLike);

  await expect(client.query<{id: number; email: string}>({sql: 'select * from users where id = ?', args: [1]})).resolves.toMatchObject([
    {id: 1, email: 'ada@example.com'},
  ]);
  await expect(client.sql<{id: number; email: string}>`select * from users where id = ${1}`).resolves.toMatchObject([
    {id: 1, email: 'ada@example.com'},
  ]);
  await expect(client.sql.exec<{id: number; email: string}>`select * from users where id = ${1}`).resolves.toMatchObject([
    {id: 1, email: 'ada@example.com'},
  ]);
  expect(calls).toMatchObject([
    {sql: 'select * from users where id = ?', args: [1]},
    {sql: 'select * from users where id = ?', args: [1]},
    {sql: 'select * from users where id = ?', args: [1]},
  ]);
});

test('createLibsqlClient turns synchronous execution errors into promise rejections for tagged sql', async () => {
  const client = createLibsqlClient({
    execute() {
      throw new Error('near "selectTYPO": syntax error');
    },
  } as LibsqlClientLike);

  await expect(
    client.sql`selectTYPO from users`.then(
      (rows) => rows,
      (error) => String(error),
    ),
  ).resolves.toContain('syntax error');
});

test('createBetterSqlite3Client makes sql.exec native sync for local sqlite', async () => {
  const calls: Array<{kind: 'prepare' | 'all' | 'run'; sql?: string; args?: readonly unknown[]}> = [];
  const client = createBetterSqlite3Client({
    prepare(query) {
      calls.push({kind: 'prepare', sql: query});
      if (query.startsWith('select')) {
        return {
          reader: true,
          all(...args) {
            calls.push({kind: 'all', args});
            return [{id: 1, email: 'ada@example.com'}];
          },
          run() {
            throw new Error('run should not be called for reader statements');
          },
        };
      }

      return {
        reader: false,
        all() {
          throw new Error('all should not be called for write statements');
        },
        run(...args) {
          calls.push({kind: 'run', args});
          return {changes: 2, lastInsertRowid: 99};
        },
      };
    },
  } as BetterSqlite3DatabaseLike);

  expect(client.query<{id: number; email: string}>({sql: 'select * from users where id = ?', args: [1]})).toMatchObject([
    {id: 1, email: 'ada@example.com'},
  ]);
  expect(client.sql.exec<{id: number; email: string}>`select * from users where id = ${1}`).toMatchObject([
    {id: 1, email: 'ada@example.com'},
  ]);
  const writeResult = client.sql.exec`insert into users (email) values (${'ada@example.com'})`;
  expect(writeResult).toMatchObject({
    length: 0,
    rowsAffected: 2,
    lastInsertRowid: expect.any(Number),
  });
  await expect(client.sql<{id: number; email: string}>`select * from users where id = ${1}`).resolves.toMatchObject([
    {id: 1, email: 'ada@example.com'},
  ]);
  expect(calls).toMatchObject([
    {kind: 'prepare', sql: 'select * from users where id = ?'},
    {kind: 'all', args: [1]},
    {kind: 'prepare', sql: 'select * from users where id = ?'},
    {kind: 'all', args: [1]},
    {kind: 'prepare', sql: 'insert into users (email) values (?)'},
    {kind: 'run', args: ['ada@example.com']},
    {kind: 'prepare', sql: 'select * from users where id = ?'},
    {kind: 'all', args: [1]},
  ]);
});

test('createBetterSqlite3Client turns synchronous execution errors into promise rejections for tagged sql', async () => {
  const client = createBetterSqlite3Client({
    prepare() {
      throw new Error('near "selectTYPO": syntax error');
    },
  } as BetterSqlite3DatabaseLike);

  await expect(
    client.sql`selectTYPO from users`.then(
      (rows) => rows,
      (error) => String(error),
    ),
  ).resolves.toContain('syntax error');
});

test('createBunClient routes read queries through query().all() and writes through run()', async () => {
  const calls: Array<{kind: 'query' | 'all' | 'run'; sql?: string; args?: readonly unknown[]}> = [];
  const client = createBunClient({
    query(query) {
      calls.push({kind: 'query', sql: query});
      return {
        all(...args) {
          calls.push({kind: 'all', args});
          return [{count: 1}];
        },
      };
    },
    run(query, params) {
      calls.push({kind: 'run', sql: query, args: params});
      return {changes: 3, lastInsertRowid: 42};
    },
  } as BunSqliteDatabaseLike);

  expect(client.sql.exec<{count: number}>`select count(*) as count from users`).toMatchObject([{count: 1}]);
  const writeResult = client.sql.exec`insert into users (email) values (${'ada@example.com'})`;
  expect(writeResult).toMatchObject({
    length: 0,
    rowsAffected: 3,
    lastInsertRowid: expect.any(Number),
  });
  await expect(client.sql<{count: number}>`select count(*) as count from users`).resolves.toMatchObject([{count: 1}]);
  expect(calls).toMatchObject([
    {kind: 'query', sql: 'select count(*) as count from users'},
    {kind: 'all', args: []},
    {kind: 'run', sql: 'insert into users (email) values (?)', args: ['ada@example.com']},
    {kind: 'query', sql: 'select count(*) as count from users'},
    {kind: 'all', args: []},
  ]);
});

test('createDurableObjectClient keeps durable object sql native sync', async () => {
  const calls: Array<{sql: string; args: readonly unknown[]}> = [];
  const client = createDurableObjectClient({
    exec(query, ...bindings) {
      calls.push({sql: query, args: bindings});
      return {
        toArray() {
          return [{id: 1, email: 'ada@example.com'}];
        },
        rowsWritten: 4,
      };
    },
  } as DurableObjectSqlStorageLike);

  const syncResult = client.sql.exec<{id: number; email: string}>`select * from users where email = ${'ada@example.com'}`;
  expect(syncResult).toMatchObject({
    0: {id: 1, email: 'ada@example.com'},
    length: 1,
    rowsAffected: 4,
  });
  const asyncResult = await client.sql<{id: number; email: string}>`select * from users where email = ${'ada@example.com'}`;
  expect(asyncResult).toMatchObject({
    0: {id: 1, email: 'ada@example.com'},
    length: 1,
    rowsAffected: 4,
  });
  expect(calls).toMatchObject([
    {sql: 'select * from users where email = ?', args: ['ada@example.com']},
    {sql: 'select * from users where email = ?', args: ['ada@example.com']},
  ]);
});
