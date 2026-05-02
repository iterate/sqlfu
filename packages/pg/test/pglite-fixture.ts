// Spins up pglite-backed pg socket servers on random ports. Tests connect
// to them via standard pg connection strings (e.g. through @pgkit/client).
//
// Each pglite instance is a fully isolated database — perfect for the
// migra-style "two databases each with their own schema" pattern.
//
// Usage:
//
//   await using fixture = await startPgliteFixture();
//   process.env.SQLFU_PG_DIFF_BASELINE_URL = fixture.url;
//   // ...run dialect methods...
//
//   await using pair = await startPglitePairFixture();
//   process.env.SQLFU_PG_DIFF_BASELINE_URL = pair.baselineUrl;
//   process.env.SQLFU_PG_DIFF_DESIRED_URL = pair.desiredUrl;
//
// Each fixture disposes on `await using`.
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {createServer} from 'node:net';

export interface PgliteFixture extends AsyncDisposable {
  url: string;
}

export interface PglitePairFixture extends AsyncDisposable {
  baselineUrl: string;
  desiredUrl: string;
}

export async function startPgliteFixture(): Promise<PgliteFixture> {
  const port = await findFreePort();
  const db = new PGlite();
  await db.waitReady;
  const server = new PGLiteSocketServer({
    db,
    port,
    host: '127.0.0.1',
    debug: process.env.SQLFU_PG_TEST_DEBUG === '1',
    inspect: process.env.SQLFU_PG_TEST_DEBUG === '1',
  });
  await server.start();

  return {
    url: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
    [Symbol.asyncDispose]: async () => {
      await server.stop();
      await db.close();
    },
  };
}

export async function startPglitePairFixture(): Promise<PglitePairFixture> {
  const baseline = await startPgliteFixture();
  const desired = await startPgliteFixture();
  return {
    baselineUrl: baseline.url,
    desiredUrl: desired.url,
    [Symbol.asyncDispose]: async () => {
      await baseline[Symbol.asyncDispose]();
      await desired[Symbol.asyncDispose]();
    },
  };
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address !== 'object' || address == null) {
        reject(new Error('Could not determine free port'));
        return;
      }
      const port = address.port;
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}
