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

// The factories below are serialized into the Worker module, which imports these from the built sqlfu runtime.
declare const createD1Client: typeof import('../../src/index.ts').createD1Client;
declare const createDurableObjectClient: typeof import('../../src/index.ts').createDurableObjectClient;
declare const defineConfig: typeof import('../../src/index.ts').defineConfig;
declare const sql: typeof import('../../src/index.ts').sql;

test('createDurableObjectClient migrates and queries isolated durable objects in real celld', async () => {
  await using celld = await createCelldFixture(() => {
    const posts = defineConfig({
      definitions: sql`
        create table posts (slug text primary key not null, title text not null);
      `,
      migrations: [
        {
          name: '20260807000000_create_posts',
          content: sql`
            create table posts (slug text primary key not null, title text not null);
          `,
        },
      ],
      queries: {
        createPost: sql.run`
          insert into posts (slug, title)
          values (:slug, :title)
        `,
        listPosts: sql.many`
          select slug, title
          from posts
          order by slug
        `,
      },
    });

    return class Posts {
      db: typeof posts.$type;

      constructor(ctx: any) {
        this.db = posts(createDurableObjectClient(ctx.storage));
        this.db.migrate();
      }

      createPost(post: {slug: string; title: string}) {
        return this.db.createPost(post);
      }

      listPosts() {
        return this.db.listPosts();
      }
    };
  });

  const alpha = celld.durableObject('alpha');
  const beta = celld.durableObject('beta');

  expect(await alpha.createPost({slug: 'hello', title: 'Hello from celld'})).toMatchObject({rowsAffected: 1});
  expect(await beta.createPost({slug: 'other', title: 'Another cell'})).toMatchObject({rowsAffected: 1});

  expect(await alpha.listPosts()).toMatchObject([{slug: 'hello', title: 'Hello from celld'}]);
  expect(await beta.listPosts()).toMatchObject([{slug: 'other', title: 'Another cell'}]);
});

test('createD1Client migrates and queries a D1 database in real celld', async () => {
  await using celld = await createCelldFixture(() => {
    const posts = defineConfig({
      definitions: sql`
        create table posts (slug text primary key not null, title text not null);
      `,
      migrations: [
        {
          name: '20260807000000_create_posts',
          content: sql`
            create table posts (slug text primary key not null, title text not null);
          `,
        },
      ],
      queries: {
        createPost: sql.run`
          insert into posts (slug, title)
          values (:slug, :title)
        `,
        listPosts: sql.many`
          select slug, title
          from posts
          order by slug
        `,
      },
    });

    return class Posts {
      db: typeof posts.$type;

      constructor(_ctx: unknown, env: {DB: any}) {
        this.db = posts(createD1Client(env.DB));
      }

      migrate() {
        return this.db.migrate();
      }

      createPost(post: {slug: string; title: string}) {
        return this.db.createPost(post);
      }

      listPosts() {
        return this.db.listPosts();
      }
    };
  });

  await celld.worker.migrate();

  expect(await celld.worker.createPost({slug: 'hello', title: 'Hello from D1'})).toMatchObject({rowsAffected: 1});
  expect(await celld.worker.listPosts()).toMatchObject([{slug: 'hello', title: 'Hello from D1'}]);
});

/**
 * Deploys a Worker to a real `celld dev` node. `factory` runs at the Worker's module scope and returns a class, which
 * is both a SQLite-backed Durable Object (`durableObject(name)`) and a per-request Worker instance (`worker`). Both
 * construct it with `(ctx, env)`, as Cloudflare does, and `env.DB` is a D1 database.
 */
async function createCelldFixture<TApp extends object>(factory: () => new (ctx: any, env: any) => TApp) {
  await ensureBuilt();

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sqlfu-celld-'));
  const projectRoot = path.join(root, 'project');
  const celldPort = await findAvailablePort();
  const celldUrl = `http://127.0.0.1:${celldPort}`;
  let celld: ResultPromise | null = null;

  try {
    await fs.mkdir(projectRoot, {recursive: true});
    await fs.cp(path.join(packageRoot, 'dist'), path.join(projectRoot, 'runtime'), {recursive: true});
    await writeCelldProject(projectRoot, factory);

    // `celld dev` deploys the project to one real celld node backed by a local
    // object store, so no S3-compatible server is needed.
    celld = execa('celld', ['dev', projectRoot, '--port', String(celldPort), '--no-watch'], {
      env: {CELLD_ESBUILD: path.join(packageRoot, 'node_modules', '.bin', 'esbuild')},
      forceKillAfterDelay: 1_000,
      reject: false,
    });
    await waitForHealthy(`${celldUrl}/.well-known/celld/health`, celld);

    return {
      durableObject: (name: string) => createRpcStub<TApp>(`${celldUrl}/durable-object/${name}`),
      worker: createRpcStub<TApp>(`${celldUrl}/worker`),
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

async function writeCelldProject(projectRoot: string, factory: () => unknown) {
  await Promise.all([
    fs.writeFile(
      path.join(projectRoot, 'wrangler.jsonc'),
      JSON.stringify(
        {
          name: 'sqlfu-celld-fixture',
          main: 'worker.js',
          compatibility_date: '2026-08-05',
          durable_objects: {bindings: [{name: 'FIXTURE_OBJECT', class_name: 'FixtureObject'}]},
          migrations: [{tag: 'v1', new_sqlite_classes: ['FixtureObject']}],
          d1_databases: [{binding: 'DB', database_name: 'fixture', database_id: 'fixture'}],
        },
        null,
        2,
      ),
    ),
    fs.writeFile(
      path.join(projectRoot, 'worker.js'),
      dedent`
        import {createD1Client, createDurableObjectClient, defineConfig, sql} from './runtime/index.js';

        const App = (${factory.toString()})();

        export class FixtureObject extends App {
          fetch(request) {
            return callMethod(this, request);
          }
        }

        export default {
          fetch(request, env, ctx) {
            const [, target, name] = new URL(request.url).pathname.split('/');
            if (target === 'durable-object') {
              return env.FIXTURE_OBJECT.get(env.FIXTURE_OBJECT.idFromName(name)).fetch(request);
            }
            return callMethod(new App(ctx, env), request);
          },
        };

        async function callMethod(app, request) {
          const {method, args} = await request.json();
          try {
            return Response.json({ok: true, value: await app[method](...args)});
          } catch (error) {
            return Response.json({ok: false, error: String(error?.stack || error)});
          }
        }
      ` + '\n',
    ),
  ]);
}

function createRpcStub<TApp extends object>(url: string) {
  return new Proxy({} as Promisified<TApp>, {
    get(_target, method) {
      if (typeof method !== 'string') return undefined;
      return async (...args: unknown[]) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({method, args}),
        });
        const text = await response.text();
        if (!response.ok) throw new Error(`${method} failed with ${response.status}: ${text}`);
        const payload = JSON.parse(text);
        if (!payload.ok) throw new Error(`${method} failed: ${payload.error}`);
        return payload.value;
      };
    },
  });
}

type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;
};

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
