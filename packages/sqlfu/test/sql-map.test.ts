import {DatabaseSync} from 'node:sqlite';
import {expect, test} from 'vitest';

import {createNodeSqliteClient, sql} from '../src/index.js';

test('client.all applies a query mapper to every row', () => {
  using fixture = createPostsFixture();

  const query = sql<{result: {slug: string}}>`
    select slug from posts order by slug
  `.map((row) => ({upper: row.slug.toUpperCase()}));

  expect(fixture.client.all(query)).toEqual([{upper: 'HELLO-WORLD'}, {upper: 'SECOND-POST'}]);
});

test('client.iterate applies a query mapper to every row', () => {
  using fixture = createPostsFixture();

  const query = sql<{result: {slug: string}}>`
    select slug from posts order by slug
  `.map((row) => ({upper: row.slug.toUpperCase()}));

  expect([...fixture.client.iterate(query)]).toEqual([{upper: 'HELLO-WORLD'}, {upper: 'SECOND-POST'}]);
});

test('client.run rejects queries with mappers instead of silently ignoring them', () => {
  using fixture = createPostsFixture();

  const query = sql`
    insert into posts (slug) values ('third-post')
  `.map((row) => row);

  expect(() => fixture.client.run(query)).toThrow(/\.map\(\.\.\.\) mapper.*does not return rows/);
});

test('chained map calls compose left to right', () => {
  using fixture = createPostsFixture();

  const query = sql<{result: {slug: string}}>`
    select slug from posts order by slug limit 1
  `
    .map((row) => ({upper: row.slug.toUpperCase()}))
    .map((row) => ({exclaimed: `${row.upper}!`}));

  expect(fixture.client.all(query)).toEqual([{exclaimed: 'HELLO-WORLD!'}]);
});

function createPostsFixture() {
  const database = new DatabaseSync(':memory:');
  const client = createNodeSqliteClient(database);
  client.run(sql`create table posts (slug text primary key)`);
  client.run(sql`insert into posts (slug) values ('hello-world'), ('second-post')`);
  return {
    client,
    [Symbol.dispose]() {
      database.close();
    },
  };
}
