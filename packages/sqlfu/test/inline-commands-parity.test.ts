import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import dedent from 'dedent';
import {createSqlfuApi} from '../src/api/core.js';
import {autoAcceptConfirm} from '../src/api/internal.js';
import {loadProjectStateFrom} from '../src/node/config.js';
import {createNodeHost} from '../src/node/host.js';
import {createTempFixtureRoot, writeFixtureFiles} from './fs-fixture.js';

test('migrate and check work on an inline config against the default local db', async () => {
  const root = await createInlineProject('inline-parity-default-db', {
    definitions: 'create table posts (slug text primary key)',
    migrations: [{name: '0001_create_posts', content: 'create table posts (slug text primary key)'}],
  });
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  await expect(api.pending()).resolves.toMatchObject(['0001_create_posts']);

  await api.migrate({confirm: autoAcceptConfirm});

  const db = new DatabaseSync(path.join(root, '.sqlfu', 'app.db'));
  try {
    const tables = db.prepare(`select name from sqlite_schema where type = 'table' and name = 'posts'`).all();
    expect(tables).toMatchObject([{name: 'posts'}]);
  } finally {
    db.close();
  }

  await expect(api.pending()).resolves.toMatchObject([]);
  await expect(api.applied()).resolves.toMatchObject(['0001_create_posts']);
  await expect(api.check()).resolves.toBeUndefined();
});

test('check reports drift between inline definitions and inline migrations', async () => {
  const root = await createInlineProject('inline-parity-drift', {
    definitions: 'create table posts (slug text primary key, title text)',
    migrations: [{name: '0001_create_posts', content: 'create table posts (slug text primary key)'}],
  });
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  // Repo-only leg: no database needed at all.
  await expect(api.checkMigrationsMatchDefinitions()).rejects.toThrow(/do not match/);
  await expect(api.check()).rejects.toThrow(/repo drift/i);
});

test('inline configs can declare a db path used by CLI commands', async () => {
  const root = await createInlineProject('inline-parity-db-path', {
    dbProperty: `db: './custom.db',`,
    definitions: 'create table posts (slug text primary key)',
    migrations: [{name: '0001_create_posts', content: 'create table posts (slug text primary key)'}],
  });
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  await api.migrate({confirm: autoAcceptConfirm});

  const db = new DatabaseSync(path.join(root, 'custom.db'));
  try {
    const tables = db.prepare(`select name from sqlite_schema where type = 'table' and name = 'posts'`).all();
    expect(tables).toMatchObject([{name: 'posts'}]);
  } finally {
    db.close();
  }
  await expect(fs.access(path.join(root, '.sqlfu', 'app.db'))).rejects.toThrow();
});

test('inline configs can declare a db factory used by CLI commands', async () => {
  const root = await createInlineProject('inline-parity-db-factory', {
    extraImports: [
      `import {DatabaseSync} from 'node:sqlite';`,
      `import {createNodeSqliteClient} from 'sqlfu';`,
    ],
    dbProperty: dedent`
      db: () => {
        const database = new DatabaseSync('./factory.db');
        return {
          client: createNodeSqliteClient(database),
          async [Symbol.asyncDispose]() {
            database.close();
          },
        };
      },
    `,
    definitions: 'create table posts (slug text primary key)',
    migrations: [{name: '0001_create_posts', content: 'create table posts (slug text primary key)'}],
  });
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  const previousCwd = process.cwd();
  process.chdir(root); // the factory above uses a cwd-relative path, like real factories often do
  try {
    await api.migrate({confirm: autoAcceptConfirm});
  } finally {
    process.chdir(previousCwd);
  }

  const db = new DatabaseSync(path.join(root, 'factory.db'));
  try {
    const tables = db.prepare(`select name from sqlite_schema where type = 'table' and name = 'posts'`).all();
    expect(tables).toMatchObject([{name: 'posts'}]);
  } finally {
    db.close();
  }
});

test('a db on a non-exported inline config is a clear error', async () => {
  const root = await createTempFixtureRoot('inline-parity-db-unexported');
  await writeFixtureFiles(root, {
    'sqlfu.config.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      const app = defineConfig({
        db: './custom.db',
        definitions: sql\`create table posts (slug text primary key)\`,
        queries: {
          listPosts: sql.many<{result: {slug: string}}>\`select slug from posts\`,
        },
      });

      void app;
    `,
  });
  await linkSqlfu(root);
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  await expect(api.migrate({confirm: autoAcceptConfirm})).rejects.toThrow(/not exported directly/);
});

test('a db that resolves to a falsy value at import time is reported as such, not as a missing export', async () => {
  const root = await createTempFixtureRoot('inline-parity-db-falsy');
  await writeFixtureFiles(root, {
    'sqlfu.config.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      export const app = defineConfig({
        db: process.env.SQLFU_TEST_UNSET_DB!,
        definitions: sql\`create table posts (slug text primary key)\`,
        queries: {
          listPosts: sql.many<{result: {slug: string}}>\`select slug from posts\`,
        },
      });
    `,
  });
  await linkSqlfu(root);
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  // The config IS exported; the error must not claim otherwise.
  await expect(api.migrate({confirm: autoAcceptConfirm})).rejects.toThrow(/resolved to a falsy value/);
});

test('repo-only commands do not import the config module even when db is declared', async () => {
  const root = await createTempFixtureRoot('inline-parity-lazy-db');
  await writeFixtureFiles(root, {
    'side-effect.ts': `throw new Error('config module was imported');`,
    'sqlfu.config.ts': dedent`
      import './side-effect.js';
      import {defineConfig, sql} from 'sqlfu';

      export default defineConfig({
        db: './custom.db',
        definitions: sql\`create table posts (slug text primary key)\`,
        migrations: [
          {
            name: '0001_create_posts',
            content: sql\`create table posts (slug text primary key)\`,
          },
        ],
        queries: {
          listPosts: sql.many<{result: {slug: string}}>\`select slug from posts\`,
        },
      });
    `,
  });
  await linkSqlfu(root);
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  // Static analysis is enough for repo-only commands; declaring db must not
  // force a dynamic import (the module may only be importable in its real
  // runtime, e.g. a Durable Object importing cloudflare:workers).
  await expect(api.checkMigrationsMatchDefinitions()).resolves.toBeUndefined();

  // Commands that open the database do import — and surface the module's error.
  await expect(api.migrate({confirm: autoAcceptConfirm})).rejects.toThrow(/config module was imported/);
});

test('db commands on a module with multiple inline configs error clearly', async () => {
  const root = await createTempFixtureRoot('inline-parity-multi-source');
  await writeFixtureFiles(root, {
    'sqlfu.config.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      export const first = defineConfig({
        definitions: sql\`create table posts (slug text primary key)\`,
        queries: {
          listPosts: sql.many<{result: {slug: string}}>\`select slug from posts\`,
        },
      });

      export const second = defineConfig({
        definitions: sql\`create table users (id int primary key)\`,
        queries: {
          listUsers: sql.many<{result: {id: number}}>\`select id from users\`,
        },
      });
    `,
  });
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  await expect(api.migrate({confirm: autoAcceptConfirm})).rejects.toThrow(/exactly one/);
});

test('api draft still routes inline projects away from file-backed drafting', async () => {
  const root = await createInlineProject('inline-parity-draft', {
    definitions: 'create table posts (slug text primary key, title text)',
    migrations: [{name: '0001_create_posts', content: 'create table posts (slug text primary key)'}],
  });
  const api = createSqlfuApi({projectRoot: root, host: await createNodeHost(), loadProjectState: () => loadProjectStateFrom(root)});

  // Inline drafting appends entries to the config module (sqlfu draft CLI);
  // the file-backed drafting path must not silently write migration files.
  await expect(api.draft({confirm: autoAcceptConfirm})).rejects.toThrow(/inline/);
  await expect(fs.readdir(root)).resolves.not.toContain('migrations');
});

async function createInlineProject(
  slug: string,
  input: {
    definitions: string;
    migrations: {name: string; content: string}[];
    dbProperty?: string;
    extraImports?: string[];
  },
) {
  const root = await createTempFixtureRoot(slug);
  const migrationEntries = input.migrations
    .map(
      (migration) => dedent`
        {
          name: '${migration.name}',
          content: sql\`${migration.content}\`,
        },
      `,
    )
    .join('\n');
  const imports = [`import {defineConfig, sql} from 'sqlfu';`, ...(input.extraImports || [])].join('\n');
  await writeFixtureFiles(root, {
    'sqlfu.config.ts': [
      imports,
      '',
      'export default defineConfig({',
      input.dbProperty ? `  ${input.dbProperty.split('\n').join('\n  ')}` : '',
      `  definitions: sql\`${input.definitions}\`,`,
      '  migrations: [',
      `    ${migrationEntries.split('\n').join('\n    ')}`,
      '  ],',
      '  queries: {',
      '    listPosts: sql.many<{result: {slug: string}}>`select slug from posts`,',
      '  },',
      '});',
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  });
  await linkSqlfu(root);
  return root;
}

async function linkSqlfu(root: string) {
  await fs.mkdir(path.join(root, 'node_modules'), {recursive: true});
  await fs.symlink(path.resolve(import.meta.dirname, '..'), path.join(root, 'node_modules', 'sqlfu'), 'dir');
}
