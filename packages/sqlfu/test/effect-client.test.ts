import {DatabaseSync} from 'node:sqlite';

import * as Effect from 'effect/Effect';
import {expect, test} from 'vitest';

import {SqlfuClient, toEffectClient} from '../src/effect.js';
import {createNodeSqliteClient} from '../src/index.js';
import {createAsyncNodeSqliteClient} from '../src/node/host.js';

test('toEffectClient wraps a sync client with sync-runnable Effects', () => {
  using fixture = createNodeSqliteFixture();
  const client = toEffectClient(fixture.client);

  const program = Effect.gen(function* () {
    yield* client.run({
      sql: 'create table posts (id integer primary key, slug text not null)',
      args: [],
    });
    yield* client.run({
      sql: 'insert into posts (slug) values (?)',
      args: ['hello'],
    });

    return yield* client.all<{id: number; slug: string}>({
      sql: 'select id, slug from posts',
      args: [],
    });
  });

  expect(Effect.runSync(program)).toMatchObject([{id: 1, slug: 'hello'}]);
});

test('toEffectClient wraps sync prepared statements', () => {
  using fixture = createNodeSqliteFixture();
  const client = toEffectClient(fixture.client);

  const program = Effect.gen(function* () {
    yield* client.run({
      sql: 'create table posts (id integer primary key, slug text not null)',
      args: [],
    });

    const insertPost = yield* client.prepare('insert into posts (slug) values (:slug)');
    yield* insertPost.run({slug: 'hello'});

    const findPosts = yield* client.prepare<{id: number; slug: string}>(
      'select id, slug from posts where slug = :slug',
    );
    return yield* findPosts.all({slug: 'hello'});
  });

  expect(Effect.runSync(program)).toMatchObject([{id: 1, slug: 'hello'}]);
});

test('toEffectClient wraps an async client with async-runnable Effects', async () => {
  using fixture = createAsyncNodeSqliteFixture();
  const client = toEffectClient(fixture.client);

  const program = Effect.gen(function* () {
    yield* client.run({
      sql: 'create table posts (id integer primary key, slug text not null)',
      args: [],
    });
    yield* client.run({
      sql: 'insert into posts (slug) values (?)',
      args: ['hello'],
    });

    return yield* client.all<{id: number; slug: string}>({
      sql: 'select id, slug from posts',
      args: [],
    });
  });

  await expect(Effect.runPromise(program)).resolves.toMatchObject([{id: 1, slug: 'hello'}]);
});

test('toEffectClient puts query failures in the Effect failure channel', () => {
  using fixture = createNodeSqliteFixture();
  const client = toEffectClient(fixture.client);

  const result = Effect.runSync(
    client
      .all({
        sql: 'select id from missing_posts',
        args: [],
        name: 'findMissingPosts',
      })
      .pipe(
        Effect.match({
          onFailure: (error) => ({ok: false, error}),
          onSuccess: (rows) => ({ok: true, rows}),
        }),
      ),
  );

  expect(result).toMatchObject({
    ok: false,
    error: {
      kind: 'missing_table',
      query: {name: 'findMissingPosts'},
      system: 'sqlite',
    },
  });
});

test('toEffectClient normalizes async client query failures in the Effect failure channel', async () => {
  using fixture = createAsyncNodeSqliteFixture();
  const client = toEffectClient(fixture.client);

  const result = await Effect.runPromise(
    client
      .all({
        sql: 'select id from missing_posts',
        args: [],
        name: 'findMissingPosts',
      })
      .pipe(
        Effect.match({
          onFailure: (error) => ({ok: false, error}),
          onSuccess: (rows) => ({ok: true, rows}),
        }),
      ),
  );

  expect(result).toMatchObject({
    ok: false,
    error: {
      kind: 'missing_table',
      query: {name: 'findMissingPosts'},
      system: 'sqlite',
    },
  });
});

test('SqlfuClient layer provides a wrapped client through Effect context', () => {
  using fixture = createNodeSqliteFixture();
  const DB = SqlfuClient.make().pipe(Effect.provide(SqlfuClient.layer(fixture.client)));

  const program = Effect.gen(function* () {
    const client = yield* DB;
    yield* client.run({
      sql: 'create table posts (id integer primary key, slug text not null)',
      args: [],
    });
    yield* client.run({
      sql: 'insert into posts (slug) values (?)',
      args: ['hello'],
    });

    return yield* client.all<{id: number; slug: string}>({
      sql: 'select id, slug from posts',
      args: [],
    });
  });

  expect(Effect.runSync(program)).toMatchObject([{id: 1, slug: 'hello'}]);
});

function createNodeSqliteFixture() {
  const database = new DatabaseSync(':memory:');

  return {
    client: createNodeSqliteClient(database),
    [Symbol.dispose]() {
      database.close();
    },
  };
}

function createAsyncNodeSqliteFixture() {
  const database = new DatabaseSync(':memory:');

  return {
    client: createAsyncNodeSqliteClient(database),
    [Symbol.dispose]() {
      database.close();
    },
  };
}
