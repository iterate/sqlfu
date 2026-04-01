import {expect, test} from 'vitest';

import {
  createBetterSqlite3Database,
  createBunDatabase,
  createDurableObjectDatabase,
  createLibsqlDatabase,
  type BetterSqlite3DatabaseLike,
  type BunSqliteDatabaseLike,
  type DurableObjectSqlStorageLike,
  type LibsqlClientLike,
} from '../src/client.js';

test('createLibsqlDatabase delegates through a passed-in libsql client', async () => {
  const calls: Array<string | {sql: string; args?: readonly unknown[]}> = [];
  const client = {
    async execute(statement) {
      calls.push(statement);
      return {
        rows: [{id: 1, email: 'ada@example.com'}],
        rowsAffected: 1,
        lastInsertRowid: 123n,
      };
    },
  } as LibsqlClientLike;
  const database = createLibsqlDatabase(client);

  const result = await database.query<{id: number; email: string}>({
    sql: 'select * from users where id = ?',
    args: [1],
  });

  expect(calls).toMatchObject([{sql: 'select * from users where id = ?', args: [1]}]);
  expect(result).toMatchObject({
    rows: [{id: 1, email: 'ada@example.com'}],
    rowsAffected: 1,
    lastInsertRowid: 123n,
  });
});

test('createBetterSqlite3Database reads via all() and writes via run()', async () => {
  const calls: Array<{kind: 'prepare' | 'all' | 'run'; sql?: string; args?: readonly unknown[]}> = [];
  const driver = {
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
  } as BetterSqlite3DatabaseLike;
  const database = createBetterSqlite3Database(driver);

  await expect(
    database.query<{id: number; email: string}>({sql: 'select * from users where id = ?', args: [1]}),
  ).resolves.toMatchObject({
    rows: [{id: 1, email: 'ada@example.com'}],
    rowsAffected: 0,
    lastInsertRowid: null,
  });
  await expect(database.query({sql: 'insert into users (email) values (?)', args: ['ada@example.com']})).resolves.toMatchObject({
    rows: [],
    rowsAffected: 2,
    lastInsertRowid: 99,
  });
  expect(calls).toMatchObject([
    {kind: 'prepare', sql: 'select * from users where id = ?'},
    {kind: 'all', args: [1]},
    {kind: 'prepare', sql: 'insert into users (email) values (?)'},
    {kind: 'run', args: ['ada@example.com']},
  ]);
});

test('createBunDatabase routes read queries through query().all() and writes through run()', async () => {
  const calls: Array<{kind: 'query' | 'all' | 'run'; sql?: string; args?: readonly unknown[]}> = [];
  const driver = {
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
  } as BunSqliteDatabaseLike;
  const database = createBunDatabase(driver);

  await expect(database.query<{count: number}>({sql: 'select count(*) as count from users', args: []})).resolves.toMatchObject({
    rows: [{count: 1}],
    rowsAffected: 0,
    lastInsertRowid: null,
  });
  await expect(database.query({sql: 'insert into users (email) values (?)', args: ['ada@example.com']})).resolves.toMatchObject({
    rows: [],
    rowsAffected: 3,
    lastInsertRowid: 42,
  });
  expect(calls).toMatchObject([
    {kind: 'query', sql: 'select count(*) as count from users'},
    {kind: 'all', args: []},
    {kind: 'run', sql: 'insert into users (email) values (?)', args: ['ada@example.com']},
  ]);
});

test('createDurableObjectDatabase reads rows and rowsWritten from sql.exec()', async () => {
  const calls: Array<{sql: string; args: readonly unknown[]}> = [];
  const storage = {
    exec(query, ...bindings) {
      calls.push({sql: query, args: bindings});
      return {
        toArray() {
          return [{id: 1, email: 'ada@example.com'}];
        },
        rowsWritten: 4,
      };
    },
  } as DurableObjectSqlStorageLike;
  const database = createDurableObjectDatabase(storage);

  const result = await database.query<{id: number; email: string}>({
    sql: 'insert into users (email) values (?) returning id, email',
    args: ['ada@example.com'],
  });

  expect(calls).toMatchObject([{sql: 'insert into users (email) values (?) returning id, email', args: ['ada@example.com']}]);
  expect(result).toMatchObject({
    rows: [{id: 1, email: 'ada@example.com'}],
    rowsAffected: 4,
    lastInsertRowid: null,
  });
});
