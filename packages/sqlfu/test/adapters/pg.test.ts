import {expect, test} from 'vitest';

import {createNodePostgresClient, type NodePostgresLike} from '../../src/adapters/pg.js';

test('createNodePostgresClient binds prepared named params directly to postgres placeholders', async () => {
  const calls: QueryCall[] = [];
  const client = createNodePostgresClient(createPool(calls));

  await using stmt = client.prepare<{id: number}>([
    `select $fn$select :ignored, ?$fn$ as body`,
    `from posts`,
    `where id = :id and slug = @slug and rank < $limit`,
  ].join('\n'));

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

type QueryCall = {
  text: string;
  values: unknown[] | undefined;
};

function createPool(calls: QueryCall[]): NodePostgresLike {
  return {
    async query<TRow extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]) {
      calls.push({text, values});
      return {rows: [{id: 1}] as unknown as TRow[], rowCount: 1};
    },
  };
}
