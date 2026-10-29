import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import dedent from 'dedent';
import {execa, type ResultPromise} from 'execa';
import {expect, test} from 'vitest';

import {ensureBuilt, packageRoot} from './ensure-built.js';

// These tests start a real celld process, so `celld` (v0.6.3+) must be on PATH:
// https://github.com/denoland/celld#install. To skip them, pass
// `--exclude test/adapters/celld.test.ts` to vitest.

test('sqlfu migrates and queries isolated durable object cells in real celld', async () => {
  await using fixture = await createCelldFixture();

  expect(await fixture.createPost('/durable-object/alpha', {slug: 'hello', title: 'Hello from celld'})).toMatchObject({
    rowsAffected: 1,
  });
  expect(await fixture.createPost('/durable-object/beta', {slug: 'other', title: 'Another cell'})).toMatchObject({
    rowsAffected: 1,
  });

  expect(await fixture.listPosts('/durable-object/alpha')).toMatchObject([{slug: 'hello', title: 'Hello from celld'}]);
  expect(await fixture.listPosts('/durable-object/beta')).toMatchObject([{slug: 'other', title: 'Another cell'}]);
});

test('sqlfu migrates and queries a D1 database in real celld', async () => {
  await using fixture = await createCelldFixture();

  // Each request builds a fresh D1 client and migrates, so the second request
  // also proves the migration is a no-op once applied.
  expect(await fixture.createPost('/d1', {slug: 'hello', title: 'Hello from D1'})).toMatchObject({rowsAffected: 1});
  expect(await fixture.listPosts('/d1')).toMatchObject([{slug: 'hello', title: 'Hello from D1'}]);
});

async function createCelldFixture() {
  await ensureBuilt();

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sqlfu-celld-'));
  const projectRoot = path.join(root, 'project');
  const celldPort = await findAvailablePort();
  const celldUrl = `http://127.0.0.1:${celldPort}`;
  let celld: ResultPromise | null = null;

  try {
    await fs.mkdir(projectRoot, {recursive: true});
    await fs.cp(path.join(packageRoot, 'dist'), path.join(projectRoot, 'runtime'), {recursive: true});
    await writeCelldProject(projectRoot);

    // `celld dev` deploys the project to one real celld node backed by a local
    // object store, so no S3-compatible server is needed.
    celld = execa('celld', ['dev', projectRoot, '--port', String(celldPort), '--no-watch'], {
      env: {CELLD_ESBUILD: path.join(packageRoot, 'node_modules', '.bin', 'esbuild')},
      forceKillAfterDelay: 1_000,
      reject: false,
    });
    await waitForHealthy(`${celldUrl}/.well-known/celld/health`, celld);

    return {
      async createPost(route: string, post: {slug: string; title: string}) {
        const response = await fetch(`${celldUrl}${route}/posts`, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify(post),
        });
        expect(response).toMatchObject({ok: true, status: 200});
        return response.json();
      },
      async listPosts(route: string) {
        const response = await fetch(`${celldUrl}${route}/posts`);
        expect(response).toMatchObject({ok: true, status: 200});
        return response.json();
      },
      async [Symbol.asyncDispose]() {
        await stopProcess(celld);
        await fs.rm(root, {recursive: true, force: true});
      },
    };
  } catch (error) {
    await stopProcess(celld);
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
          d1_databases: [{binding: 'DB', database_name: 'sqlfu-posts', database_id: 'sqlfu-posts'}],
        },
        null,
        2,
      ),
    ),
    fs.writeFile(
      path.join(projectRoot, 'worker.js'),
      dedent`
        import {createD1Client, createDurableObjectClient, defineConfig, sql} from './runtime/index.js';

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
          async fetch(request, env) {
            const [, binding, cell] = new URL(request.url).pathname.split('/');
            if (binding === 'durable-object') {
              return env.POSTS.get(env.POSTS.idFromName(cell)).fetch(request);
            }
            if (binding === 'd1') {
              const db = posts(createD1Client(env.DB));
              await db.migrate();
              if (request.method === 'POST') {
                return Response.json(await db.createPost(await request.json()));
              }
              return Response.json(await db.listPosts());
            }
            return new Response('not found', {status: 404});
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

async function waitForHealthy(url: string, process: ResultPromise) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      const result: any = await process;
      if (result.code === 'ENOENT') {
        throw new Error('celld is not on PATH. Install celld v0.6.3+: https://github.com/denoland/celld#install');
      }
      throw new Error(`celld exited before becoming ready:\n${result.stderr || result.stdout}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for celld at ${url}.`);
}

async function stopProcess(process: ResultPromise | null) {
  if (!process) return;
  process.kill('SIGTERM');
  await process;
}
