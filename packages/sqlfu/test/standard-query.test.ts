import {createClient} from '@libsql/client';
import {DatabaseSync} from 'node:sqlite';
import {expect, expectTypeOf, test} from 'vitest';

import {
  createLibsqlClient,
  createNodeSqliteClient,
  instrument,
  type QueryExecutionContext,
  type StandardQueryV1,
} from '../src/index.js';

// A Standard Query (https://github.com/colinhacks/reylo/blob/main/src/standard-query.ts) is what a reylo
// `.sql` import is: a statement plus `encode` (input -> values to bind) and `decode` (every row, as an
// array of raw values in select order -> output). These are written by hand so the test shows the
// whole contract.

test('client.execute binds encode(input), reads every row as an array, and returns decode(rows)', () => {
  const client = createNodeSqliteClient(new DatabaseSync(':memory:'));
  client.sql.run`create table posts (id integer primary key, slug text not null)`;
  client.sql.run`insert into posts (slug) values ('hello'), ('world'), ('again')`;

  const decoded: unknown[] = [];
  const postsAfter: StandardQueryV1<{minId: number}, Array<{id: number; slug: string}>, 'sqlite'> = {
    '~standard': {
      version: 1,
      vendor: 'hand-written',
      query: {
        dialect: 'sqlite',
        // `id` twice: rows as objects would collapse these into one key
        text: 'select id, slug, id from posts where id > ? order by id',
        encode: (input) => [(input as {minId: number}).minId],
        decode: (rows) => {
          decoded.push(...rows);
          return rows.map(([id, slug]) => ({id: Number(id), slug: String(slug)}));
        },
      },
    },
  };

  const posts = client.execute(postsAfter, {minId: 1});

  expectTypeOf(posts).toEqualTypeOf<Array<{id: number; slug: string}>>();
  expect(posts).toEqual([
    {id: 2, slug: 'world'},
    {id: 3, slug: 'again'},
  ]);
  expect(decoded).toEqual([
    [2, 'world', 2],
    [3, 'again', 3],
  ]);
});

test('async clients return a promise of the output', async () => {
  const client = createLibsqlClient(createClient({url: ':memory:'}));
  await client.sql.run`create table posts (id integer primary key, slug text not null)`;
  await client.sql.run`insert into posts (slug) values ('hello')`;

  const firstPost: StandardQueryV1<{}, {slug: string} | null, 'sqlite'> = {
    '~standard': {
      version: 1,
      vendor: 'hand-written',
      query: {
        dialect: 'sqlite',
        text: `select slug from posts order by id limit 1`,
        encode: () => [],
        decode: (rows) => (rows[0] ? {slug: String(rows[0][0])} : null),
      },
    },
  };

  const post = client.execute(firstPost);

  expectTypeOf(post).toEqualTypeOf<Promise<{slug: string} | null>>();
  expect(await post).toEqual({slug: 'hello'});
});

test('client.execute refuses a query written for another database', () => {
  const client = createNodeSqliteClient(new DatabaseSync(':memory:'));

  const postgresQuery: StandardQueryV1<{}, unknown, 'postgres'> = {
    '~standard': {
      version: 1,
      vendor: 'hand-written',
      query: {dialect: 'postgres', text: 'select now()', encode: () => [], decode: (rows) => rows},
    },
  };

  expect(() => client.execute(postgresQuery)).toThrow(
    `This query is written for postgres, and this client runs sqlite.`,
  );
});

test('instrument hooks see a Standard Query as the statement it binds', () => {
  const contexts: QueryExecutionContext[] = [];
  const client = instrument(createNodeSqliteClient(new DatabaseSync(':memory:')), ({context, execute}) => {
    contexts.push(context);
    return execute();
  });

  const echo: StandardQueryV1<{word: string}, string, 'sqlite'> = {
    '~standard': {
      version: 1,
      vendor: 'hand-written',
      query: {
        dialect: 'sqlite',
        text: 'select ? as word',
        encode: (input) => [(input as {word: string}).word],
        decode: (rows) => String(rows[0]![0]),
      },
    },
  };

  expect(client.execute(echo, {word: 'hi'})).toBe('hi');
  expect(contexts).toMatchObject([{operation: 'values', query: {sql: 'select ? as word', args: ['hi']}}]);
});
