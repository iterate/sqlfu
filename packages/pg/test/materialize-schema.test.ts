import {expect, test} from 'vitest';

import type {SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {isPgReachable, MISSING_PG_MESSAGE, TEST_ADMIN_URL} from './pg-fixture.js';

const pgReachable = await isPgReachable();
const pgTest = test.skipIf(!pgReachable);

const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
const stubHost = {} as unknown as SqlfuHost;

pgTest('pgDialect.materializeSchemaSql applies DDL and extracts canonical schema', {timeout: 30_000}, async () => {
  const result = await dialect.materializeSchemaSql(stubHost, {
    sourceSql: `
        create table users (id integer primary key, name text not null, email text);
        create index users_email_idx on users(email);
      `,
  });
  const lower = result.toLowerCase();
  expect(lower).toContain('create table');
  expect(lower).toContain('users');
  expect(lower).toContain('id');
  expect(lower).toContain('name');
  expect(lower).toContain('email');
  expect(lower).toContain('users_email_idx');
});

pgTest('pgDialect.materializeSchemaSql honors excludedTables', {timeout: 30_000}, async () => {
  const result = await dialect.materializeSchemaSql(stubHost, {
    sourceSql: `
        create table sqlfu_migrations (name text primary key);
        create table app_data (id integer primary key);
      `,
    excludedTables: ['sqlfu_migrations'],
  });
  const lower = result.toLowerCase();
  expect(lower).toContain('app_data');
  expect(lower).not.toContain('sqlfu_migrations');
});

if (!pgReachable) {
  test.skip(MISSING_PG_MESSAGE, () => {});
}
