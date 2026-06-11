import {expect, test} from 'vitest';

import {sql} from '../src/index.js';

test('sql tag strips comments outside strings', () => {
  const query = sql`
    select slug -- the natural key
    from posts /* all of them */
    order by slug
  `;
  expect(query.sql).toBe('select slug from posts order by slug');
});

test('sql tag preserves comment-like text inside string literals', () => {
  expect(sql`select '-- not a comment' as x`.sql).toBe("select '-- not a comment' as x");
});

test('sql tag preserves comment-like text inside dollar-quoted strings', () => {
  // Postgres dollar quoting (@sqlfu/pg shares this tag): the contents are
  // data, not SQL, so comment stripping must not touch them.
  expect(sql`select $$some -- literal text$$ as x`.sql).toBe('select $$some -- literal text$$ as x');
  expect(sql`select $tag$keep /* this */ text$tag$ as y`.sql).toBe('select $tag$keep /* this */ text$tag$ as y');
});
