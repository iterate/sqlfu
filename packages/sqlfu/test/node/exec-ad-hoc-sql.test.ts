import {DatabaseSync} from 'node:sqlite';

import {expect, test} from 'vitest';

import {createAsyncNodeSqliteClient} from '../../src/node/host.js';
import {createNodeHost} from '../../src/node/host.js';

// execAdHocSql is the UI SQL runner's entry point. Previously it reached into
// `client.driver` and ran `.prepare().all()` synchronously — fine for sync
// drivers, but async drivers (D1, libsql, Turso) returned un-awaited Promises
// that kept resolving after the UI handler's `await using` disposed the
// client, crashing miniflare with ERR_DISPOSED. The fix unifies both paths
// through the sqlfu Client API.

test('execAdHocSql returns rows for a read statement', async () => {
  await using fixture = await openNodeHost(`create table posts (id integer primary key, slug text not null);
     insert into posts (slug) values ('first'), ('second');`);

  const result = await fixture.host.execAdHocSql(
    fixture.client,
    'select id, slug from posts order by id',
    undefined,
  );
  expect(result).toMatchObject({
    mode: 'rows',
    rows: [
      {id: 1, slug: 'first'},
      {id: 2, slug: 'second'},
    ],
  });
});

test('execAdHocSql returns metadata for a write statement', async () => {
  await using fixture = await openNodeHost(`create table posts (id integer primary key, slug text not null);`);

  const result = await fixture.host.execAdHocSql(
    fixture.client,
    `insert into posts (slug) values ('new')`,
    undefined,
  );
  expect(result).toMatchObject({
    mode: 'metadata',
    metadata: {rowsAffected: 1, lastInsertRowid: 1},
  });
});

test('execAdHocSql rewrites named params against an async client', async () => {
  // Uses createAsyncNodeSqliteClient — an async client shape over node:sqlite.
  // Exercises the Client-API-only path (previously only the sync driver-reach
  // path supported named params; async drivers silently failed).
  await using fixture = await openNodeHost(`create table posts (id integer primary key, slug text not null);
     insert into posts (slug) values ('hello-world'), ('goodbye');`);

  const result = await fixture.host.execAdHocSql(
    fixture.client,
    'select id, slug from posts where slug = :slug',
    {slug: 'hello-world'},
  );
  expect(result).toMatchObject({
    mode: 'rows',
    rows: [{id: 1, slug: 'hello-world'}],
  });
});

test('execAdHocSql skips named-param-shaped tokens inside string literals', async () => {
  // `'a:b'` inside a string literal must not be treated as `:b` placeholder —
  // otherwise we'd rewrite the SQL and look for an arg named `b`.
  await using fixture = await openNodeHost(`create table posts (id integer primary key, slug text not null);`);

  const result = await fixture.host.execAdHocSql(
    fixture.client,
    `select 'a:b' as literal, :real as param`,
    {real: 42},
  );
  expect(result).toMatchObject({mode: 'rows', rows: [{literal: 'a:b', param: 42}]});
});

async function openNodeHost(seed: string) {
  const host = await createNodeHost();
  const database = new DatabaseSync(':memory:');
  const client = createAsyncNodeSqliteClient(database);
  await client.raw(seed);

  return {
    host,
    client,
    [Symbol.asyncDispose]: async () => {
      database.close();
    },
  };
}
