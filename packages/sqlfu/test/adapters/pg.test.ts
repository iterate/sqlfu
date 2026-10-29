import {expect, test} from 'vitest';

import {createNodePostgresClient, type NodePostgresLike} from '../../src/adapters/pg.js';

test('createNodePostgresClient binds prepared named params directly to postgres placeholders', async () => {
  const calls: QueryCall[] = [];
  const client = createNodePostgresClient(createPool(calls));

  await using stmt = client.prepare<{id: number}>(
    [
      `select $fn$select :ignored, ?$fn$ as body`,
      `from posts`,
      `where id = :id and slug = @slug and rank < $limit`,
    ].join('\n'),
  );

  await stmt.all({id: 1, slug: 'alpha', limit: 10});

  expect(calls).toMatchObject([
    {
      text: [
        `select $fn$select :ignored, ?$fn$ as body`,
        `from posts`,
        `where id = $1 and slug = $2 and rank < $3`,
      ].join('\n'),
      values: [1, 'alpha', 10],
    },
  ]);
});

test('createNodePostgresClient binds positional query args while preserving dollar-quoted question marks', async () => {
  const calls: QueryCall[] = [];
  const client = createNodePostgresClient(createPool(calls));

  await client.all({
    sql: `select $tag$?$tag$ as literal, ? as id, '?' as quoted, ? as slug`,
    args: [1, 'alpha'],
  });

  expect(calls).toMatchObject([
    {
      text: `select $tag$?$tag$ as literal, $1 as id, '?' as quoted, $2 as slug`,
      values: [1, 'alpha'],
    },
  ]);
});

test('createNodePostgresClient preserves postgres casts and json question operators while binding params', async () => {
  const calls: QueryCall[] = [];
  const client = createNodePostgresClient(createPool(calls));

  await using stmt = client.prepare<{id: number}>(
    `select * from posts where id = :id::int and payload ? :key and tags ?| array[:tag]`,
  );

  await stmt.all({id: 1, key: 'published', tag: 'sql'});

  expect(calls).toMatchObject([
    {
      text: `select * from posts where id = $1::int and payload ? $2 and tags ?| array[$3]`,
      values: [1, 'published', 'sql'],
    },
  ]);
});

test('createNodePostgresClient.values reads rows as arrays of the text the server sent', async () => {
  const calls: QueryCall[] = [];
  const client = createNodePostgresClient(createPool(calls));

  await client.values({sql: `select id, created_at from posts where id = ?`, args: [1]});

  expect(calls).toMatchObject([
    {text: `select id, created_at from posts where id = $1`, values: [1], rowMode: 'array'},
  ]);
  const parse = calls[0]!.types!.getTypeParser();
  expect(parse('2026-10-29 08:54:00+00')).toBe('2026-10-29 08:54:00+00');
});

type QueryCall = {
  text: string;
  values: unknown[] | undefined;
  rowMode?: 'array';
  types?: {getTypeParser: () => (value: string) => unknown};
};

function createPool(calls: QueryCall[]): NodePostgresLike {
  return {
    query: (async (textOrConfig: string | QueryCall, values?: unknown[]) => {
      calls.push(typeof textOrConfig === 'string' ? {text: textOrConfig, values} : textOrConfig);
      return {rows: [{id: 1}], rowCount: 1};
    }) as NodePostgresLike['query'],
  };
}
