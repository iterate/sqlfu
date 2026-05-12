import {expect, test} from 'vitest';

import {rewriteNamedParamsToPositional, scanSqliteNamedParameters} from '../src/sqlite-text.js';

test('sqlite named parameter scanner skips quoted text and comments', () => {
  const input = [
    `select ':literal' as single, ":quoted" as double, \`@tick\` as tick, [$bracket] as bracketed`,
    `from posts`,
    `where id = :id and slug = @slug and rank < $limit`,
    `-- :comment`,
    `/* @block */`,
  ].join('\n');

  expect(scanSqliteNamedParameters(input)).toMatchObject([
    {parameter: ':id', name: 'id'},
    {parameter: '@slug', name: 'slug'},
    {parameter: '$limit', name: 'limit'},
  ]);

  expect(rewriteNamedParamsToPositional(input, {id: 1, slug: 'alpha', limit: 10})).toMatchObject({
    sql: [
      `select ':literal' as single, ":quoted" as double, \`@tick\` as tick, [$bracket] as bracketed`,
      `from posts`,
      `where id = ? and slug = ? and rank < ?`,
      `-- :comment`,
      `/* @block */`,
    ].join('\n'),
    args: [1, 'alpha', 10],
  });
});
