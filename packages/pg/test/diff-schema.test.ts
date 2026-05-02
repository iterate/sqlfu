import {expect, test} from 'vitest';

import type {SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {startPglitePairFixture} from './pglite-fixture.js';

// A do-nothing host — pgDialect.diffSchema doesn't currently use it
// (the materialization happens via SQLFU_PG_DIFF_*_URL env vars).
const stubHost = {} as unknown as SqlfuHost;

async function withFixture<T>(fn: () => Promise<T>): Promise<T> {
  await using pair = await startPglitePairFixture();
  const previous = {
    baseline: process.env.SQLFU_PG_DIFF_BASELINE_URL,
    desired: process.env.SQLFU_PG_DIFF_DESIRED_URL,
  };
  process.env.SQLFU_PG_DIFF_BASELINE_URL = pair.baselineUrl;
  process.env.SQLFU_PG_DIFF_DESIRED_URL = pair.desiredUrl;
  try {
    return await fn();
  } finally {
    if (previous.baseline == null) delete process.env.SQLFU_PG_DIFF_BASELINE_URL;
    else process.env.SQLFU_PG_DIFF_BASELINE_URL = previous.baseline;
    if (previous.desired == null) delete process.env.SQLFU_PG_DIFF_DESIRED_URL;
    else process.env.SQLFU_PG_DIFF_DESIRED_URL = previous.desired;
  }
}

test('pgDialect.diffSchema reports no statements when baseline matches desired', {timeout: 30_000}, async () => {
  await withFixture(async () => {
    const ddl = `create table users (id integer primary key, name text not null);`;
    const statements = await pgDialect.diffSchema(stubHost, {
      baselineSql: ddl,
      desiredSql: ddl,
      allowDestructive: false,
    });
    expect(statements).toEqual([]);
  });
});

test('pgDialect.diffSchema emits create-table for a new table', {timeout: 30_000}, async () => {
  await withFixture(async () => {
    const statements = await pgDialect.diffSchema(stubHost, {
      baselineSql: '',
      desiredSql: `create table users (id integer primary key, name text not null);`,
      allowDestructive: false,
    });
    const joined = statements.join('\n').toLowerCase();
    expect(joined).toContain('create table');
    expect(joined).toContain('users');
  });
});

test('pgDialect.diffSchema refuses destructive drops when allowDestructive=false', {timeout: 30_000}, async () => {
  await withFixture(async () => {
    await expect(
      pgDialect.diffSchema(stubHost, {
        baselineSql: `create table users (id integer primary key);`,
        desiredSql: '',
        allowDestructive: false,
      }),
    ).rejects.toThrow();
  });
});

test('pgDialect.diffSchema emits drop-table when allowDestructive=true', {timeout: 30_000}, async () => {
  await withFixture(async () => {
    const statements = await pgDialect.diffSchema(stubHost, {
      baselineSql: `create table users (id integer primary key);`,
      desiredSql: '',
      allowDestructive: true,
    });
    const joined = statements.join('\n').toLowerCase();
    expect(joined).toContain('drop table');
    expect(joined).toContain('users');
  });
});
