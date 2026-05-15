import {expect, test} from 'vitest';

import {
  bindSqlParamsToPositional,
  bindSqlParamsToPrefixedRecord,
  scanSqlNamedParameters,
} from '../src/sql-params.js';

test('sql named parameter scanner skips quoted text, comments, and dollar-quoted bodies', () => {
  const input = [
    `select ':literal' as single, ":quoted" as double, \`@tick\` as tick, [$bracket] as bracketed`,
    `from posts`,
    `where id = :id and slug = @slug and rank < $limit`,
    `and body = $sql$select :ignored, @ignored, ?$sql$`,
    `and note = $$select :ignored_too, ?$$`,
    `-- :comment`,
    `/* @block */`,
  ].join('\n');

  expect(scanSqlNamedParameters(input)).toMatchObject([
    {parameter: ':id', name: 'id'},
    {parameter: '@slug', name: 'slug'},
    {parameter: '$limit', name: 'limit'},
  ]);
});

test('sql params bind named records to question-mark positional placeholders', () => {
  const input = [
    `select ':literal' as single, ":quoted" as double, \`@tick\` as tick, [$bracket] as bracketed`,
    `from posts`,
    `where id = :id and slug = @slug and rank < $limit`,
    `-- :comment`,
    `/* @block */`,
  ].join('\n');

  expect(bindSqlParamsToPositional(input, {id: 1, slug: 'alpha', limit: 10}, 'question')).toMatchObject({
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

test('sql params bind named records directly to postgres positional placeholders', () => {
  const input = [
    `select $fn$select :ignored, ?$fn$ as body`,
    `from posts`,
    `where id = :id and slug = @slug and rank < $limit`,
  ].join('\n');

  expect(bindSqlParamsToPositional(input, {id: 1, slug: 'alpha', limit: 10}, 'postgres')).toMatchObject({
    sql: [
      `select $fn$select :ignored, ?$fn$ as body`,
      `from posts`,
      `where id = $1 and slug = $2 and rank < $3`,
    ].join('\n'),
    args: [1, 'alpha', 10],
  });
});

test('sql params preserve postgres cast syntax after named parameters', () => {
  expect(bindSqlParamsToPositional(`select :id::int as id`, {id: 1}, 'postgres')).toMatchObject({
    sql: `select $1::int as id`,
    args: [1],
  });

  expect(scanSqlNamedParameters(`select count(*)::int as count`)).toMatchObject([]);
});

test('sql params bind positional arrays to postgres placeholders while preserving dollar-quoted question marks', () => {
  expect(
    bindSqlParamsToPositional(
      `select $tag$?$tag$ as literal, ? as first, '?' as quoted, ? as second`,
      ['alpha', 'beta'],
      'postgres',
    ),
  ).toMatchObject({
    sql: `select $tag$?$tag$ as literal, $1 as first, '?' as quoted, $2 as second`,
    args: ['alpha', 'beta'],
  });
});

test('sql params preserve postgres json question operators', () => {
  expect(
    bindSqlParamsToPositional(
      [
        `select *`,
        `from posts`,
        `where payload ? 'published'`,
        `and tags ?| array['sql', 'typescript']`,
        `and flags ?& array[?]`,
        `and id = ?`,
      ].join('\n'),
      ['visible', 1],
      'postgres',
    ),
  ).toMatchObject({
    sql: [
      `select *`,
      `from posts`,
      `where payload ? 'published'`,
      `and tags ?| array['sql', 'typescript']`,
      `and flags ?& array[$1]`,
      `and id = $2`,
    ].join('\n'),
    args: ['visible', 1],
  });
});

test('sql params bind named right operands after postgres json question operators', () => {
  expect(bindSqlParamsToPositional(`select * from posts where payload ? :key and id = :id`, {key: 'slug', id: 1}, 'postgres')).toMatchObject({
    sql: `select * from posts where payload ? $1 and id = $2`,
    args: ['slug', 1],
  });
});

test('sql params bind bare object keys to the prefixes used by sqlite-wasm SQL', () => {
  expect(bindSqlParamsToPrefixedRecord(`select :id, @slug, $limit`, {id: 1, slug: 'alpha', limit: 10})).toMatchObject({
    ':id': 1,
    '@slug': 'alpha',
    '$limit': 10,
  });

  expect(bindSqlParamsToPrefixedRecord(`select :id`, {':id': 1})).toMatchObject({
    ':id': 1,
  });
});
