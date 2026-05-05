import BetterSqlite3 from 'better-sqlite3';
import {execa} from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import {findMiniflareD1Path} from '../../src/cloudflare/miniflare.js';

const packageRoot = path.resolve(path.dirname(import.meta.filename), '../..');
const repoRoot = path.resolve(packageRoot, '../..');

test('findMiniflareD1Path resolves the sqlite file created by Alchemy dev for a D1 binding', async () => {
  await using fixture = await createAlchemyDevFixture();

  const alchemyDbPath = await fixture.runAlchemyDev();

  const dbPath = findMiniflareD1Path(fixture.databaseSlug, {cwd: fixture.nestedCwd});
  expect(dbPath).toBe(alchemyDbPath);
  await expect(fs.stat(dbPath)).resolves.toMatchObject({size: expect.any(Number)});

  using database = openSqliteFile(dbPath);
  const tables = database
    .prepare<{name: string}>("select name from sqlite_master where type = 'table' order by name")
    .all();
  const migrations = database
    .prepare<{name: string; type: string}>('select name, type from d1_migrations order by id')
    .all();

  expect(tables).toEqual(expect.arrayContaining([{name: 'd1_migrations'}, {name: 'message'}]));
  expect(migrations).toEqual([{name: '0001_create_message.sql', type: 'migration'}]);
}, 15_000);

test('findMiniflareD1Path throws an actionable error when no well-known Miniflare root is found', async () => {
  await using fixture = await createTempDirectory('miniflare-d1-path-missing');
  const nestedCwd = path.join(fixture.root, 'apps', 'web');
  await fs.mkdir(nestedCwd, {recursive: true});

  expect(() => findMiniflareD1Path('my-dev-app-slug', {cwd: nestedCwd})).toThrow(
    `No Miniflare v3 root found from ${nestedCwd}. Pass {miniflareV3Root} or run from inside a project with a supported Miniflare persist directory.`,
  );
});

async function createAlchemyDevFixture() {
  const root = await createRepoTempDirectory('alchemy-miniflare-d1-path');
  const databaseSlug = `sqlfu-miniflare-d1-${process.pid}-${Date.now()}`;
  const stage = `test-${process.pid}-${Date.now()}`;
  const nestedCwd = path.join(root, 'apps', 'web', 'src', 'server');

  await writeFixtureFiles(root, {
    'package.json': JSON.stringify({private: true, workspaces: []}, null, 2),
    'pnpm-lock.yaml': '',
    'migrations/0001_create_message.sql': 'create table message(id integer primary key, body text not null);',
    'src/worker.ts': `
      export default {
        async fetch(_request, env) {
          const row = await env.DB.prepare('select count(*) as count from message').first();
          return Response.json(row);
        },
      };
    `,
    'alchemy.run.mts': `
      import alchemy from 'alchemy';
      import {D1Database, Worker} from 'alchemy/cloudflare';

      const app = await alchemy('sqlfu-miniflare-d1-path-test', {noTrack: true});

      const database = await D1Database('database', {
        name: '${databaseSlug}',
        migrationsDir: './migrations',
      });

      await Worker('worker', {
        name: '${databaseSlug}-worker',
        entrypoint: './src/worker.ts',
        bindings: {DB: database},
        url: false,
      });

      await app.finalize();
    `,
  });
  await fs.mkdir(nestedCwd, {recursive: true});

  return {
    root,
    databaseSlug,
    nestedCwd,
    async runAlchemyDev() {
      const child = execa(
        'pnpm',
        [
          'exec',
          'alchemy',
          'dev',
          path.join(root, 'alchemy.run.mts'),
          '--cwd',
          root,
          '--root-dir',
          root,
          '--stage',
          stage,
        ],
        {
          cwd: repoRoot,
          all: true,
          reject: false,
          env: {
            CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
            CLOUDFLARE_API_TOKEN: 'test-api-token',
            DO_NOT_TRACK: '1',
          },
        },
      );
      const logs = captureOutput(child);

      try {
        return await waitForAlchemyD1Sqlite(root, logs);
      } finally {
        await stopProcess(child);
      }
    },
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}

async function createTempDirectory(slug: string) {
  const root = await createRepoTempDirectory(slug);

  return {
    root,
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}

async function createRepoTempDirectory(slug: string) {
  const root = path.join(repoRoot, 'tmp', `${slug}-ignoreme-${process.pid}-${Date.now()}`);
  await fs.mkdir(root, {recursive: true});
  return root;
}

async function writeFixtureFiles(root: string, files: Record<string, string>) {
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, content.trimStart());
  }
}

function openSqliteFile(dbPath: string) {
  const database = new BetterSqlite3(dbPath);
  return {
    prepare: database.prepare.bind(database),
    [Symbol.dispose]() {
      database.close();
    },
  };
}

async function waitForAlchemyD1Sqlite(root: string, logs: () => string) {
  const deadline = Date.now() + 15_000;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const dbPath = await findMigratedD1Sqlite(root);
      if (dbPath) {
        return dbPath;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(100);
  }

  throw new Error(
    [
      'Timed out waiting for Alchemy dev to create a migrated local D1 sqlite database.',
      lastError ? `Last inspection error: ${lastError}` : '',
      '',
      'Alchemy output:',
      logs().trim() || '(none)',
    ].join('\n'),
  );
}

async function findMigratedD1Sqlite(root: string) {
  const miniflareV3Root = path.join(root, '.alchemy', 'miniflare', 'v3');
  const sqliteFiles = await Array.fromAsync(
    fs.glob('d1/miniflare-D1DatabaseObject/*.sqlite', {cwd: miniflareV3Root}),
  ).catch(() => []);

  for (const sqliteFile of sqliteFiles) {
    const dbPath = path.join(miniflareV3Root, sqliteFile);
    using database = openSqliteFile(dbPath);
    try {
      const migrations = database
        .prepare<{name: string; type: string}>('select name, type from d1_migrations order by id')
        .all();
      if (migrations.some((migration) => migration.name === '0001_create_message.sql')) {
        return dbPath;
      }
    } catch {}
  }

  return undefined;
}

type ExecaProcess = ReturnType<typeof execa>;

function captureOutput(child: ExecaProcess) {
  const chunks: string[] = [];
  child.all?.on('data', (chunk: string | Buffer) => {
    chunks.push(String(chunk));
    if (chunks.length > 200) {
      chunks.shift();
    }
  });

  return () => chunks.join('');
}

async function stopProcess(child: ExecaProcess) {
  if (child.exitCode !== null || child.killed) {
    return;
  }

  child.kill('SIGINT');
  const exited = await Promise.race([
    child.then(
      () => true,
      () => true,
    ),
    delay(5_000).then(() => false),
  ]);

  if (!exited && child.exitCode === null && !child.killed) {
    child.kill('SIGKILL');
    await child.catch(() => undefined);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
