// Pure-function tests for the SQL string-literal tokenizer/redactor.
// These don't need a postgres connection — they exercise the
// state-machine in isolation.
import {expect, test} from 'vitest';

import {
  REDACTION_SUBSTITUTE,
  redactAllStringLiterals,
  redactDollarQuotedStrings,
} from '../src/impl/redact-string-literals.js';

test('aggressive redaction replaces single-quoted strings', () => {
  expect(redactAllStringLiterals(`select 'hi $1' as msg`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as msg`,
  );
});

test('aggressive redaction handles embedded doubled-quote escape', () => {
  expect(redactAllStringLiterals(`select 'it''s fine' as msg`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as msg`,
  );
});

test('aggressive redaction replaces e-strings with backslash escapes', () => {
  expect(redactAllStringLiterals(`select e'foo\\nbar' as msg`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as msg`,
  );
  expect(redactAllStringLiterals(`select E'has \\'quote' as msg`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as msg`,
  );
});

test('aggressive redaction replaces dollar-quoted strings (no tag)', () => {
  expect(redactAllStringLiterals(`select $$hi $1 there$$ as msg`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as msg`,
  );
});

test('aggressive redaction replaces tagged dollar-quoted strings', () => {
  expect(redactAllStringLiterals(`select $body$has $1 in it$body$ as msg`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as msg`,
  );
});

test('aggressive redaction leaves quoted identifiers alone (even ones containing $1)', () => {
  expect(redactAllStringLiterals(`select "$1" from t where x = $1`)).toBe(
    `select "$1" from t where x = $1`,
  );
});

test('aggressive redaction leaves comments alone but recognises their boundaries', () => {
  // `$1` inside a block comment shouldn't trip the tokenizer's `$`
  // handling — the comment boundary keeps the `$` from being seen as
  // the start of a dollar-quoted string.
  expect(redactAllStringLiterals(`select x /* with $1 in comment */ from t`)).toBe(
    `select x /* with $1 in comment */ from t`,
  );
  expect(redactAllStringLiterals(`select x -- $1 in line comment\nfrom t`)).toBe(
    `select x -- $1 in line comment\nfrom t`,
  );
});

test('aggressive redaction leaves $N positional parameters alone', () => {
  expect(redactAllStringLiterals(`select x from t where x = $1 and y = $42`)).toBe(
    `select x from t where x = $1 and y = $42`,
  );
});

test('aggressive redaction leaves bare $ in code alone', () => {
  expect(redactAllStringLiterals(`select x from t where x > 0$1$0`)).toBe(
    `select x from t where x > 0$1$0`,
  );
});

test('aggressive redaction handles array-literal-style strings', () => {
  expect(redactAllStringLiterals(`select '{1,2,$1}'::int[] as arr from t`)).toBe(
    `select ${REDACTION_SUBSTITUTE}::int[] as arr from t`,
  );
});

test('aggressive redaction handles multiple strings in one query', () => {
  expect(redactAllStringLiterals(`select 'a' as a, 'b $1' as b, x from t where x = $1`)).toBe(
    `select ${REDACTION_SUBSTITUTE} as a, ${REDACTION_SUBSTITUTE} as b, x from t where x = $1`,
  );
});

test('aggressive redaction leaves nested block comments matched', () => {
  expect(redactAllStringLiterals(`select /* outer /* nested $1 */ still inside */ x from t`)).toBe(
    `select /* outer /* nested $1 */ still inside */ x from t`,
  );
});

test('dollar-only redaction preserves single-quoted strings', () => {
  // The AST path uses this — `pgsql-ast-parser` handles single-quoted
  // strings fine, so leaving them intact preserves literal-not-null
  // info for later inference passes.
  expect(redactDollarQuotedStrings(`select 'hi $1' as msg, x from t where x = $1`)).toBe(
    `select 'hi $1' as msg, x from t where x = $1`,
  );
});

test('dollar-only redaction rewrites dollar-quoted as a single-quoted literal', () => {
  // Substitute is a real string literal so the AST sees a `string` node
  // and `isNonNullableField` can infer not-null. Body is preserved
  // verbatim (apart from `'` → `''` escaping).
  expect(redactDollarQuotedStrings(`select $$hi $1$$ as msg from t where x = $1`)).toBe(
    `select 'hi $1' as msg from t where x = $1`,
  );
});

test('dollar-only redaction handles tagged dollar-quoted strings', () => {
  expect(redactDollarQuotedStrings(`select $tag$hi $tag$ as msg from t`)).toBe(
    `select 'hi ' as msg from t`,
  );
});

test('dollar-only redaction escapes embedded single-quotes in the body', () => {
  expect(redactDollarQuotedStrings(`select $$it's complex$$ as msg from t`)).toBe(
    `select 'it''s complex' as msg from t`,
  );
});

test('redaction substitute survives a downstream cast (smoke test of the chosen sentinel)', () => {
  // Not exercising pg here — just asserting the sentinel's *shape* is
  // what we expect downstream code to see (a NULL with a marker comment
  // and a `::text` anchor that any further cast can safely chain off).
  expect(REDACTION_SUBSTITUTE).toMatch(/^null\/\*[\w_]+\*\/::text$/);
});
