import {expect, test} from 'vitest';

import {pgDialect} from '../src/index.js';

const dialect = pgDialect({adminUrl: 'postgresql://unused/postgres'});

test('pgDialect.name is "postgresql"', () => {
  expect(dialect.name).toBe('postgresql');
});

test('pgDialect.quoteIdentifier wraps in double quotes and escapes inner ones', () => {
  expect(dialect.quoteIdentifier('users')).toBe('"users"');
  expect(dialect.quoteIdentifier('Users')).toBe('"Users"');
  expect(dialect.quoteIdentifier('weird"name')).toBe('"weird""name"');
});

test('pgDialect.defaultMigrationTableDdl uses pg flavor (timestamptz, text)', () => {
  const ddl = dialect.defaultMigrationTableDdl('sqlfu_migrations');
  expect(ddl).toContain('timestamptz');
  expect(ddl).toContain('create table if not exists sqlfu_migrations');
  expect(ddl).toContain('checksum text not null');
  expect(ddl).toContain("name text primary key check (name not like '%.sql')");
});

test('pgDialect.formatSql lowercases keywords and reflows', () => {
  const formatted = dialect.formatSql('SELECT a, b FROM t WHERE c = 1');
  expect(formatted.toLowerCase()).toContain('select');
  expect(formatted.toLowerCase()).toContain('from');
  expect(formatted.toLowerCase()).toContain('where');
});
