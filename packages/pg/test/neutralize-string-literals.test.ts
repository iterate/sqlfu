// Pure-function tests for the SQL string-literal neutralizer.
// No postgres connection needed.
import {expect, test} from 'vitest';

import {neutralizeStringLiterals} from '../src/impl/neutralize-string-literals.js';

test('neutralizes $N inside single-quoted strings', () => {
  expect(neutralizeStringLiterals(`select 'hi $1' as msg, x from t where x = $1`)).toBe(
    `select 'hi SQLFU_DOLLAR1' as msg, x from t where x = $1`,
  );
});

test('handles embedded doubled-quote escape', () => {
  expect(neutralizeStringLiterals(`select 'it''s $1' as msg`)).toBe(
    `select 'it''s SQLFU_DOLLAR1' as msg`,
  );
});

test('neutralizes $N inside e-strings, preserving backslash escapes', () => {
  expect(neutralizeStringLiterals(`select e'foo\\n$1' as msg`)).toBe(
    `select e'foo\\nSQLFU_DOLLAR1' as msg`,
  );
  expect(neutralizeStringLiterals(`select E'has \\'quote $1' as msg`)).toBe(
    `select E'has \\'quote SQLFU_DOLLAR1' as msg`,
  );
});

test('rewrites dollar-quoted strings to single-quoted, escaping inner quotes', () => {
  expect(neutralizeStringLiterals(`select $$hi $1 there$$ as msg`)).toBe(
    `select 'hi SQLFU_DOLLAR1 there' as msg`,
  );
  expect(neutralizeStringLiterals(`select $$it's complex$$ as msg`)).toBe(
    `select 'it''s complex' as msg`,
  );
  expect(neutralizeStringLiterals(`select $body$has $1 in it$body$ as msg`)).toBe(
    `select 'has SQLFU_DOLLAR1 in it' as msg`,
  );
});

test('leaves quoted identifiers untouched (even ones containing $1)', () => {
  expect(neutralizeStringLiterals(`select "$1" from t where x = $1`)).toBe(
    `select "$1" from t where x = $1`,
  );
});

test('leaves comments untouched but recognises their boundaries', () => {
  // The `$1` inside the comment should *stay* — comments aren't strings,
  // and pg strips them before parsing anyway. The substituting regex won't
  // match either: by the time we run `$N` substitution, comments have been
  // collapsed by pg's own parser.
  expect(neutralizeStringLiterals(`select x /* with $1 in comment */ from t`)).toBe(
    `select x /* with $1 in comment */ from t`,
  );
  expect(neutralizeStringLiterals(`select x -- $1 in line comment\nfrom t`)).toBe(
    `select x -- $1 in line comment\nfrom t`,
  );
});

test('leaves $N positional parameters outside strings alone', () => {
  expect(neutralizeStringLiterals(`select x from t where x = $1 and y = $42`)).toBe(
    `select x from t where x = $1 and y = $42`,
  );
});

test('handles array-literal style strings', () => {
  expect(neutralizeStringLiterals(`select '{1,2,$1}'::int[] as arr from t`)).toBe(
    `select '{1,2,SQLFU_DOLLAR1}'::int[] as arr from t`,
  );
});

test('handles multiple strings and parameters in one query', () => {
  expect(
    neutralizeStringLiterals(`select 'a' as a, 'b $1' as b, x from t where x = $1`),
  ).toBe(`select 'a' as a, 'b SQLFU_DOLLAR1' as b, x from t where x = $1`);
});

test('handles nested block comments', () => {
  expect(
    neutralizeStringLiterals(`select /* outer /* nested $1 */ still inside */ x from t`),
  ).toBe(`select /* outer /* nested $1 */ still inside */ x from t`);
});

test('preserves the surrounding SQL exactly when there is nothing to neutralize', () => {
  const sql = `select id, name from users where id = $1 order by id desc`;
  expect(neutralizeStringLiterals(sql)).toBe(sql);
});
