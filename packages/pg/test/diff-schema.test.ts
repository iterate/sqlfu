import {beforeAll, expect, test} from 'vitest';

import type {SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';

beforeAll(async () => {
  if (!(await isPgReachable())) {
    throw new Error(
      `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
        `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' (or set SQLFU_PG_TEST_URL to a reachable pg).`,
    );
  }
});

const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
// pgDialect.diffSchema doesn't currently use the host; tests pass a stub.
const stubHost = {} as unknown as SqlfuHost;

test('pgDialect.diffSchema reports no statements when baseline matches desired', {timeout: 30_000}, async () => {
  const ddl = `create table users (id integer primary key, name text not null);`;
  const statements = await dialect.diffSchema(stubHost, {
    baselineSql: ddl,
    desiredSql: ddl,
    allowDestructive: false,
  });
  expect(statements).toEqual([]);
});

test('pgDialect.diffSchema emits create-table for a new table', {timeout: 30_000}, async () => {
  const statements = await dialect.diffSchema(stubHost, {
    baselineSql: '',
    desiredSql: `create table users (id integer primary key, name text not null);`,
    allowDestructive: false,
  });
  const joined = statements.join('\n').toLowerCase();
  expect(joined).toContain('create table');
  expect(joined).toContain('users');
});

test('pgDialect.diffSchema refuses destructive drops when allowDestructive=false', {timeout: 30_000}, async () => {
  await expect(
    dialect.diffSchema(stubHost, {
      baselineSql: `create table users (id integer primary key);`,
      desiredSql: '',
      allowDestructive: false,
    }),
  ).rejects.toThrow();
});

test('pgDialect.diffSchema emits drop-table when allowDestructive=true', {timeout: 30_000}, async () => {
  const statements = await dialect.diffSchema(stubHost, {
    baselineSql: `create table users (id integer primary key);`,
    desiredSql: '',
    allowDestructive: true,
  });
  const joined = statements.join('\n').toLowerCase();
  expect(joined).toContain('drop table');
  expect(joined).toContain('users');
});
