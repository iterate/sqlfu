import BetterSqlite3 from 'better-sqlite3';
import {expect, test} from 'vitest';

import {sync} from '../src/api/sync.js';
import {createBetterSqlite3Client, sql} from '../src/index.js';

test('runtime sync handles index names that are substrings of table names', () => {
  using fixture = createRuntimeSyncFixture();

  sync(fixture.client, {
    definitions: `
      create table posts (
        id integer primary key,
        slug text not null
      );

      create index post on posts (slug);
    `,
  });

  expect(
    fixture.client.all<{name: string; tbl_name: string}>(sql`
      select name, tbl_name
      from sqlite_schema
      where type = 'index'
        and name = 'post'
    `),
  ).toMatchObject([{name: 'post', tbl_name: 'posts'}]);
});

test('runtime sync cleanup only drops literal scratch-prefixed objects', () => {
  using fixture = createRuntimeSyncFixture();

  fixture.client.raw(`
    create table xxsqlfuxsyncxkeep (
      id integer primary key
    );

    insert into xxsqlfuxsyncxkeep (id) values (1);
  `);

  sync(fixture.client, {
    definitions: `
      create table xxsqlfuxsyncxkeep (
        id integer primary key
      );

      create table posts (
        id integer primary key
      );
    `,
  });

  expect(
    fixture.client.all<{name: string}>(sql`
      select name
      from sqlite_schema
      where type = 'table'
        and name in ('posts', 'xxsqlfuxsyncxkeep')
      order by name
    `),
  ).toMatchObject([{name: 'posts'}, {name: 'xxsqlfuxsyncxkeep'}]);

  expect(
    fixture.client.all<{id: number}>(sql`
      select id
      from xxsqlfuxsyncxkeep
    `),
  ).toMatchObject([{id: 1}]);
});

function createRuntimeSyncFixture() {
  const db = new BetterSqlite3(':memory:');
  return {
    client: createBetterSqlite3Client(db),
    [Symbol.dispose]() {
      db.close();
    },
  };
}
