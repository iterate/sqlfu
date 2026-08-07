import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import dedent from 'dedent';
import {execa, type ResultPromise} from 'execa';
import {expect, test as baseTest} from 'vitest';

import {ensureBuilt, packageRoot} from './ensure-built.js';

// Opt in because this starts real celld and MinIO processes. With `celld`,
// `minio`, and `mc` on PATH, run:
// CELLD_TEST=1 pnpm --dir packages/sqlfu exec vitest --run test/adapters/celld.test.ts
const test = baseTest.skipIf(!process.env.CELLD_TEST);

test('sqlfu migrates and queries isolated durable object cells in real celld', async () => {
  await using fixture = await createCelldFixture();

  expect(await fixture.createPost('alpha', {slug: 'hello', title: 'Hello from celld'})).toMatchObject({
    rowsAffected: 1,
  });
  expect(await fixture.createPost('beta', {slug: 'other', title: 'Another cell'})).toMatchObject({rowsAffected: 1});

  expect(await fixture.listPosts('alpha')).toMatchObject([{slug: 'hello', title: 'Hello from celld'}]);
  expect(await fixture.listPosts('beta')).toMatchObject([{slug: 'other', title: 'Another cell'}]);
}, 30_000);

async function createCelldFixture() {
  await ensureBuilt();

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sqlfu-celld-'));
  const projectRoot = path.join(root, 'project');
  const minioData = path.join(root, 'minio-data');
  const minioConfig = path.join(root, 'minio-config');
  const celldState = path.join(root, 'celld-state');
  const [minioPort, minioConsolePort, celldPort] = await Promise.all([
    findAvailablePort(),
    findAvailablePort(),
    findAvailablePort(),
  ]);
  const minioUrl = `http://127.0.0.1:${minioPort}`;
  const celldUrl = `http://127.0.0.1:${celldPort}`;
  const bucket = `sqlfu-celld-${Date.now()}`;
  const accessKey = 'sqlfu-celld-access';
  const secretKey = 'sqlfu-celld-secret-key';
  const binaries = {
    celld: process.env.CELLD_BIN || 'celld',
    mc: process.env.MINIO_MC_BIN || 'mc',
    minio: process.env.MINIO_BIN || 'minio',
  };
  const storageEnv = {
    AWS_ACCESS_KEY_ID: accessKey,
    AWS_SECRET_ACCESS_KEY: secretKey,
    AWS_REGION: 'us-east-1',
  };
  let minio: ResultPromise | null = null;
  let celld: ResultPromise | null = null;

  try {
    await Promise.all([
      fs.mkdir(projectRoot, {recursive: true}),
      fs.mkdir(minioData, {recursive: true}),
      fs.mkdir(minioConfig, {recursive: true}),
      fs.mkdir(celldState, {recursive: true}),
      fs.cp(path.join(packageRoot, 'dist'), path.join(projectRoot, 'runtime'), {recursive: true}),
    ]);
    await writeCelldProject(projectRoot);

    minio = execa(
      binaries.minio,
      [
        'server',
        minioData,
        '--address',
        `127.0.0.1:${minioPort}`,
        '--console-address',
        `127.0.0.1:${minioConsolePort}`,
      ],
      {
        env: {MINIO_ROOT_USER: accessKey, MINIO_ROOT_PASSWORD: secretKey},
        forceKillAfterDelay: 1_000,
        reject: false,
      },
    );
    await waitForUrl(`${minioUrl}/minio/health/live`, minio, 'MinIO');

    await execa(binaries.mc, [
      '--config-dir',
      minioConfig,
      'alias',
      'set',
      'sqlfu-celld',
      minioUrl,
      accessKey,
      secretKey,
    ]);
    await execa(binaries.mc, ['--config-dir', minioConfig, 'mb', `sqlfu-celld/${bucket}`]);

    const deploy = await execa(
      binaries.celld,
      ['deploy', projectRoot, '--bucket', `s3://${bucket}`, '--endpoint', minioUrl, '--region', 'us-east-1'],
      {
        env: {...storageEnv, CELLD_ESBUILD: path.join(packageRoot, 'node_modules', '.bin', 'esbuild')},
        extendEnv: true,
      },
    );
    expect(deploy.stdout).toContain('env.POSTS (Posts)');

    celld = execa(
      binaries.celld,
      [
        '--bucket',
        `s3://${bucket}`,
        '--endpoint',
        minioUrl,
        '--region',
        'us-east-1',
        '--listen',
        `127.0.0.1:${celldPort}`,
        '--advertise',
        `127.0.0.1:${celldPort}`,
      ],
      {
        env: {...storageEnv, CELLD_WATCH: celldState},
        extendEnv: true,
        forceKillAfterDelay: 1_000,
        reject: false,
      },
    );
    await waitForUrl(celldUrl, celld, 'celld');

    return {
      async createPost(cell: string, post: {slug: string; title: string}) {
        const response = await fetch(`${celldUrl}/${cell}/posts`, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify(post),
        });
        expect(response).toMatchObject({ok: true, status: 200});
        return response.json();
      },
      async listPosts(cell: string) {
        const response = await fetch(`${celldUrl}/${cell}/posts`);
        expect(response).toMatchObject({ok: true, status: 200});
        return response.json();
      },
      async [Symbol.asyncDispose]() {
        await stopProcess(celld);
        await stopProcess(minio);
        await fs.rm(root, {recursive: true, force: true});
      },
    };
  } catch (error) {
    await stopProcess(celld);
    await stopProcess(minio);
    await fs.rm(root, {recursive: true, force: true});
    throw error;
  }
}

async function writeCelldProject(projectRoot: string) {
  await Promise.all([
    fs.writeFile(
      path.join(projectRoot, 'wrangler.jsonc'),
      JSON.stringify(
        {
          name: 'sqlfu-celld-compatibility',
          main: 'worker.js',
          compatibility_date: '2026-08-05',
          durable_objects: {bindings: [{name: 'POSTS', class_name: 'Posts'}]},
          migrations: [{tag: 'v1', new_sqlite_classes: ['Posts']}],
        },
        null,
        2,
      ),
    ),
    fs.writeFile(
      path.join(projectRoot, 'worker.js'),
      dedent`
        import {createDurableObjectClient, defineConfig, sql} from './runtime/index.js';

        const posts = defineConfig({
          definitions: sql\`
            create table posts (
              slug text primary key not null,
              title text not null
            );
          \`,
          migrations: [
            {
              name: '20260807000000_create_posts',
              content: sql\`
                create table posts (
                  slug text primary key not null,
                  title text not null
                );
              \`,
            },
          ],
          queries: {
            createPost: sql.run\`
              insert into posts (slug, title)
              values (:slug, :title)
            \`,
            listPosts: sql.many\`
              select slug, title
              from posts
              order by slug
            \`,
          },
        });

        export class Posts {
          constructor(state) {
            this.db = posts(createDurableObjectClient(state.storage));
            this.db.migrate();
          }

          async fetch(request) {
            if (request.method === 'POST') {
              return Response.json(this.db.createPost(await request.json()));
            }
            return Response.json(this.db.listPosts());
          }
        }

        export default {
          fetch(request, env) {
            const cell = new URL(request.url).pathname.split('/')[1] || 'default';
            return env.POSTS.get(env.POSTS.idFromName(cell)).fetch(request);
          },
        };
      ` + '\n',
    ),
  ]);
}

async function findAvailablePort() {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  if (!address || typeof address === 'string') throw new Error('Could not reserve a local test port.');
  return address.port;
}

async function waitForUrl(url: string, process: ResultPromise, name: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      const result = await process;
      throw new Error(`${name} exited before becoming ready:\n${result.all || result.stderr || result.stdout}`);
    }
    try {
      await fetch(url);
      return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${name} at ${url}.`);
}

async function stopProcess(process: ResultPromise | null) {
  if (!process) return;
  process.kill('SIGTERM');
  await process;
}
