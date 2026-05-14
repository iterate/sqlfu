import dedent from 'dedent';
import {expect, test} from 'vitest';

import {
  findNamedParameterReferences,
  parseInlineParameterExpansions,
  prepareSqlForAnalysis,
  type ParameterExpansion,
} from '../../src/typegen/query-parameters.js';

test('named parameter references ignore comments, strings, and cast operators', () => {
  const sql = dedent`
    select ':not_param' as single_quoted,
      ":not_param" as double_quoted,
      \`:not_param\` as backtick_quoted
    from posts
    -- where id = :commented_id
    /* and slug = :block_commented_slug */
    where id = :id
      and slug in (:slugs)
      and author_id = :author.id
      and status = cast(:status as text)
      and payload = value::json
  `;

  expect(simplifyReferences(findNamedParameterReferences(sql))).toEqual([
    {raw: ':id', name: 'id', path: [], wrappedInParens: false},
    {raw: ':slugs', name: 'slugs', path: [], wrappedInParens: true},
    {raw: ':author.id', name: 'author', path: ['id'], wrappedInParens: false},
    {raw: ':status', name: 'status', path: [], wrappedInParens: false},
  ]);
});

test('inline parameter expansion inference recognizes object fields and list-shaped params', () => {
  const sql = dedent`
    -- insert into posts (slug, title) values :commented_posts
    insert into posts (slug, title) values :posts;

    select id
    from posts
    where (slug, title) in (:keys)
      and author_id = :author.id
      and updated_by = :author.updated_by;
  `;

  expect(parseInlineParameterExpansions(sql)).toMatchObject([
    {
      kind: 'object-array',
      name: 'posts',
      fields: ['slug', 'title'],
      sqlShape: 'values',
      acceptsSingleOrArray: true,
    },
    {
      kind: 'object-array',
      name: 'keys',
      fields: ['slug', 'title'],
      sqlShape: 'row-list',
      acceptsSingleOrArray: false,
    },
    {
      kind: 'object-fields',
      name: 'author',
      fields: ['id', 'updated_by'],
      driverFields: ['id', 'updated_by'],
    },
  ]);
});

test('analysis SQL expands object-shaped parameters without changing runtime SQL source', () => {
  const expansions: ParameterExpansion[] = [
    {
      kind: 'object-array',
      name: 'keys',
      fields: ['slug', 'title'],
      sqlShape: 'row-list',
      acceptsSingleOrArray: false,
    },
    {
      kind: 'object-fields',
      name: 'author',
      fields: ['id'],
      driverFields: ['id'],
    },
    {
      kind: 'scalar-array',
      name: 'ids',
    },
  ];

  expect(
    prepareSqlForAnalysis(
      dedent`
        select *
        from posts
        where (slug, title) in (:keys)
          and author_id = :author.id
          and id in (:ids)
          and status = :status;
      `,
      expansions,
    ),
  ).toBe(dedent`
    select *
    from posts
    where (slug = :keys__slug and title = :keys__title)
      and author_id = :author__id
      and id in (:ids)
      and status = :status;
  `);
});

test('inline parameter expansion rejects mixed object and scalar parameter usage', () => {
  expect(() => parseInlineParameterExpansions(`select :post.id, :post;`)).toThrow(
    'Parameter "post" cannot be used both as :post and object-fields',
  );
});

function simplifyReferences(references: ReturnType<typeof findNamedParameterReferences>) {
  return references.map((reference) => ({
    raw: reference.raw,
    name: reference.name,
    path: reference.path,
    wrappedInParens: reference.wrappedInParens,
  }));
}
