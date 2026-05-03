import {beforeAll, expect, test} from 'vitest';

import type {SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';

beforeAll(async () => {
  if (!(await isPgReachable())) {
    throw new Error(
      `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
        `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
    );
  }
});

const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
const stubHost = {} as unknown as SqlfuHost;

test(
  'pgDialect.materializeSchemaSql applies DDL and extracts canonical schema',
  {timeout: 30_000},
  async () => {
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
  },
);

test(
  'pgDialect.materializeSchemaSql honors excludedTables',
  {timeout: 30_000},
  async () => {
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
  },
);
