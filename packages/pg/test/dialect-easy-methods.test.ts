import {expect, test} from 'vitest';

import {pgDialect} from '../src/index.js';

test('pgDialect.name is "postgresql"', () => {
  expect(pgDialect.name).toBe('postgresql');
});

test('pgDialect.quoteIdentifier wraps in double quotes and escapes inner ones', () => {
  expect(pgDialect.quoteIdentifier('users')).toBe('"users"');
  expect(pgDialect.quoteIdentifier('Users')).toBe('"Users"');
  expect(pgDialect.quoteIdentifier('weird"name')).toBe('"weird""name"');
});

test('pgDialect.defaultMigrationTableDdl uses pg flavor (timestamptz, text)', () => {
  const ddl = pgDialect.defaultMigrationTableDdl('sqlfu_migrations');
  expect(ddl).toContain('timestamptz');
  expect(ddl).toContain('create table if not exists sqlfu_migrations');
  expect(ddl).toContain('checksum text not null');
  expect(ddl).toContain("name text primary key check (name not like '%.sql')");
});

test('pgDialect.formatSql lowercases keywords and reflows', () => {
  const formatted = pgDialect.formatSql('SELECT a, b FROM t WHERE c = 1');
  expect(formatted.toLowerCase()).toContain('select');
  expect(formatted.toLowerCase()).toContain('from');
  expect(formatted.toLowerCase()).toContain('where');
});
