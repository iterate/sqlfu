import {expect, test} from 'vitest';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import type {Dialect, SqlfuHost, SqlfuProjectConfig} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {isPgReachable, MISSING_PG_MESSAGE, TEST_ADMIN_URL} from './pg-fixture.js';

const pgReachable = await isPgReachable();
const pgTest = test.skipIf(!pgReachable);

async function withProject<T>(
  definitionsSql: string,
  fn: (config: SqlfuProjectConfig, host: SqlfuHost, dialect: Dialect) => Promise<T>,
): Promise<T> {
  const projectRoot = await mkdtemp(join(tmpdir(), 'sqlfu-pg-typegen-'));
  await writeFile(join(projectRoot, 'definitions.sql'), definitionsSql);
  try {
    const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
    const config: SqlfuProjectConfig = {
      projectRoot,
      definitions: join(projectRoot, 'definitions.sql'),
      queries: join(projectRoot, 'sql'),
      generate: {
        validator: null,
        prettyErrors: true,
        sync: false,
        experimentalJsonTypes: false,
        runtime: 'sqlfu',
        importExtension: '.js',
        authority: 'desired_schema',
      },
      dialect,
    };
    return await fn(config, createMinimalHost(), dialect);
  } finally {
    await rm(projectRoot, {recursive: true, force: true});
  }
}

function createMinimalHost(): SqlfuHost {
  // The pg dialect's typegen methods only exercise `host.fs.readFile`. The
  // rest of the host surface throws — fail-fast if any of it gets touched.
  const fsImpl: SqlfuHost['fs'] = {
    async readFile(path: string) {
      const fs = await import('node:fs/promises');
      return fs.readFile(path, 'utf8');
    },
    async writeFile() {
      throw new Error('host.fs.writeFile not implemented in typegen test fixture');
    },
    async readdir() {
      throw new Error('host.fs.readdir not implemented in typegen test fixture');
    },
    async mkdir() {
      throw new Error('host.fs.mkdir not implemented in typegen test fixture');
    },
    async rm() {
      throw new Error('host.fs.rm not implemented in typegen test fixture');
    },
    async rename() {
      throw new Error('host.fs.rename not implemented in typegen test fixture');
    },
    async exists() {
      return false;
    },
  };
  return {
    fs: fsImpl,
    openDb: async () => {
      throw new Error('host.openDb not implemented in typegen test fixture');
    },
    openScratchDb: async () => {
      throw new Error('host.openScratchDb not implemented in typegen test fixture');
    },
    execAdHocSql: async () => {
      throw new Error('host.execAdHocSql not implemented in typegen test fixture');
    },
    initializeProject: async () => {
      throw new Error('host.initializeProject not implemented in typegen test fixture');
    },
    digest: async (content) => content,
    now: () => new Date('2026-05-03T00:00:00.000Z'),
    uuid: () => 'test-uuid',
    logger: {log: () => {}, warn: () => {}, error: () => {}},
    catalog: {
      load: async () => ({queries: {}, queryDocuments: {}}) as never,
      refresh: async () => {},
      analyzeSql: async () => ({}) as never,
    },
  };
}

pgTest(
  'pgDialect.materializeTypegenSchema + loadSchemaForTypegen returns the relations',
  {timeout: 30_000},
  async () => {
    const sql = `
    create table users (id integer primary key, name text not null, bio text);
    create view active_users as select id, name from users where bio is not null;
  `;
    await withProject(sql, async (config, host, dialect) => {
      await using materialized = await dialect.materializeTypegenSchema(host, {
        projectRoot: config.projectRoot,
        sourceSql: sql,
        experimentalJsonTypes: false,
      });
      const relations = await dialect.loadSchemaForTypegen(materialized);

      expect(relations.has('users')).toBe(true);
      expect(relations.has('active_users')).toBe(true);

      const users = relations.get('users')!;
      expect(users.kind).toBe('table');
      expect(users.columns.get('id')).toMatchObject({tsType: 'number', notNull: true});
      expect(users.columns.get('name')).toMatchObject({tsType: 'string', notNull: true});
      expect(users.columns.get('bio')).toMatchObject({tsType: 'string', notNull: false});

      const view = relations.get('active_users')!;
      expect(view.kind).toBe('view');
      expect(view.columns.has('id')).toBe(true);
      expect(view.columns.has('name')).toBe(true);
    });
  },
);

pgTest(
  'pgDialect.analyzeQueries infers parameter + result types AND nullability via the AST pipeline',
  {timeout: 30_000},
  async () => {
    const sql = `create table users (id integer primary key, name text not null, bio text);`;
    await withProject(sql, async (config, host, dialect) => {
      await using materialized = await dialect.materializeTypegenSchema(host, {
        projectRoot: config.projectRoot,
        sourceSql: sql,
        experimentalJsonTypes: false,
      });
      const analyses = await dialect.analyzeQueries(materialized, [
        {sqlPath: 'find-user.sql', sqlContent: 'select id, name, bio from users where id = $1'},
      ]);

      expect(analyses).toHaveLength(1);
      const [analysis] = analyses;
      if (!analysis.ok) {
        throw new Error(`expected ok analysis, got error: ${analysis.error.description}`);
      }
      expect(analysis.descriptor.queryType).toBe('Select');
      expect(analysis.descriptor.parameters).toEqual([
        {name: '$1', tsType: 'number', notNull: false, toDriver: 'identity', isArray: false},
      ]);
      expect(analysis.descriptor.columns.map((c) => c.name)).toEqual(['id', 'name', 'bio']);
      expect(analysis.descriptor.columns.map((c) => c.tsType)).toEqual(['number', 'string', 'string']);
      // Nullability: PRIMARY KEY → not_null, NOT NULL → not_null, otherwise nullable.
      expect(analysis.descriptor.columns.map((c) => c.notNull)).toEqual([true, true, false]);
    });
  },
);

pgTest('pgDialect.analyzeQueries accepts sqlfu named parameters', {timeout: 30_000}, async () => {
  const sql = `create table posts (id integer primary key, slug text not null, title text not null);`;
  await withProject(sql, async (config, host, dialect) => {
    await using materialized = await dialect.materializeTypegenSchema(host, {
      projectRoot: config.projectRoot,
      sourceSql: sql,
      experimentalJsonTypes: false,
    });
    const analyses = await dialect.analyzeQueries(materialized, [
      {sqlPath: 'find-post.sql', sqlContent: 'select id, slug, title from posts where slug = :slug'},
    ]);

    const [analysis] = analyses;
    if (!analysis.ok) {
      throw new Error(`expected ok analysis, got error: ${analysis.error.description}`);
    }
    expect(analysis.descriptor).toMatchObject({
      sql: 'select id, slug, title from posts where slug = $1',
      queryType: 'Select',
      parameters: [{name: 'slug', tsType: 'string', notNull: false, toDriver: 'identity', isArray: false}],
    });
    expect(analysis.descriptor.columns.map((column) => column.name)).toEqual(['id', 'slug', 'title']);
  });
});

pgTest('pgDialect.analyzeQueries handles LEFT JOIN queries end-to-end', {timeout: 30_000}, async () => {
  // Smoke-test: a LEFT JOIN query goes through the AST pipeline without
  // erroring. Specific nullability semantics are pgkit/typegen's domain
  // — we inherit them as-is and the pgkit fixture lift (Phase C6) will
  // pin those down.
  const sql = `
      create table users (id integer primary key, name text not null);
      create table profiles (user_id integer primary key references users(id), bio text not null);
    `;
  await withProject(sql, async (config, host, dialect) => {
    await using materialized = await dialect.materializeTypegenSchema(host, {
      projectRoot: config.projectRoot,
      sourceSql: sql,
      experimentalJsonTypes: false,
    });
    const analyses = await dialect.analyzeQueries(materialized, [
      {
        sqlPath: 'users-with-bios.sql',
        sqlContent: `
            select u.id, u.name, p.bio
            from users u
            left join profiles p on p.user_id = u.id
          `,
      },
    ]);
    const [analysis] = analyses;
    if (!analysis.ok) {
      throw new Error(`expected ok analysis, got error: ${analysis.error.description}`);
    }
    const cols = analysis.descriptor.columns;
    expect(cols.map((c) => c.name)).toEqual(['id', 'name', 'bio']);
    expect(cols.map((c) => c.tsType)).toEqual(['number', 'string', 'string']);
  });
});

pgTest('pgDialect.analyzeQueries handles INSERT...RETURNING via DML→SELECT rewrite', {timeout: 30_000}, async () => {
  const sql = `create table posts (id integer primary key, title text not null, draft boolean);`;
  await withProject(sql, async (config, host, dialect) => {
    await using materialized = await dialect.materializeTypegenSchema(host, {
      projectRoot: config.projectRoot,
      sourceSql: sql,
      experimentalJsonTypes: false,
    });
    const analyses = await dialect.analyzeQueries(materialized, [
      {sqlPath: 'create-post.sql', sqlContent: 'insert into posts (title) values ($1) returning id, title, draft'},
    ]);
    const [analysis] = analyses;
    if (!analysis.ok) {
      throw new Error(`expected ok analysis, got error: ${analysis.error.description}`);
    }
    expect(analysis.descriptor.queryType).toBe('Insert');
    expect(analysis.descriptor.parameters).toHaveLength(1);
    expect(analysis.descriptor.parameters[0]).toMatchObject({tsType: 'string'});
    // Result columns for DML+RETURNING come from the AST rewrite (the
    // vendored pipeline turns INSERT...RETURNING into a SELECT-shaped
    // analysis target).
    const colNames = analysis.descriptor.columns.map((c) => c.name);
    expect(colNames).toEqual(['id', 'title', 'draft']);
    // id (PRIMARY KEY) and title (NOT NULL) → not_null. draft is nullable.
    const cols = analysis.descriptor.columns;
    expect(cols.find((c) => c.name === 'id')?.notNull).toBe(true);
    expect(cols.find((c) => c.name === 'title')?.notNull).toBe(true);
    expect(cols.find((c) => c.name === 'draft')?.notNull).toBe(false);
  });
});

pgTest('pgDialect.analyzeQueries reports prepare-time errors as ok:false', {timeout: 30_000}, async () => {
  const sql = `create table users (id integer primary key);`;
  await withProject(sql, async (config, host, dialect) => {
    await using materialized = await dialect.materializeTypegenSchema(host, {
      projectRoot: config.projectRoot,
      sourceSql: sql,
      experimentalJsonTypes: false,
    });
    const analyses = await dialect.analyzeQueries(materialized, [
      {sqlPath: 'broken.sql', sqlContent: 'select id from nonexistent_table'},
    ]);
    expect(analyses[0].ok).toBe(false);
  });
});

// Gap-closure regression: before this change, `pgMaterializeTypegenSchema`
// took `(host, config)` and threw if `config.generate.authority` wasn't
// `'desired_schema'` — meaning the `migrations`/`migration_history`/
// `live_schema` authorities couldn't drive pg-side typegen at all. The
// fix split the responsibility: `readSchemaForAuthority` (in main sqlfu)
// resolves whichever authority into a SQL string, and that SQL is then
// passed to the dialect via `{projectRoot, sourceSql}`. The dialect no
// longer needs to know which authority produced its input.
//
// This test exercises that new shape directly, with arbitrary SQL the
// caller might have produced via any authority. If pg ever regresses
// to peeking at `config.generate.authority`, this test fails fast.
pgTest('pgDialect.materializeTypegenSchema is authority-agnostic', {timeout: 30_000}, async () => {
  const sourceSql = `
    create table products (id int primary key, name text not null);
    create table orders (id int primary key, product_id int references products(id));
  `;
  const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
  await using materialized = await dialect.materializeTypegenSchema(createMinimalHost(), {
    projectRoot: '/dev/null/unused-by-pg',
    sourceSql,
    experimentalJsonTypes: false,
  });
  const relations = await dialect.loadSchemaForTypegen(materialized);
  expect(relations.has('products')).toBe(true);
  expect(relations.has('orders')).toBe(true);
});

if (!pgReachable) {
  test.skip(MISSING_PG_MESSAGE, () => {});
}
