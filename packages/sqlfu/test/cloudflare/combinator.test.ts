import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import {createAlchemyD1Client} from '../../src/cloudflare/combinator.js';

const repoRoot = path.resolve(path.dirname(import.meta.filename), '../../../..');

test('createAlchemyD1Client composes alchemy state + HTTP client into a sqlfu D1 client', async () => {
  await using fixture = await alchemyStateFixture({
    'state/my-app/dev/database.json': JSON.stringify({
      id: 'database',
      type: 'Cloudflare.D1Database',
      props: {},
      attr: {
        databaseId: 'db-uuid-from-state',
        databaseName: 'my-app-dev-database',
        accountId: 'acct-from-state',
      },
    }),
  });

  await using cf = await fakeCloudflareApi({
    onQuery({path: requestPath, body, authorization}) {
      expect(requestPath).toBe('/accounts/acct-from-state/d1/database/db-uuid-from-state/query');
      expect(authorization).toBe('Bearer tok-from-arg');
      expect(body).toMatchObject({sql: 'select count(*) as n from message'});
      return {results: [{n: 7}], meta: {}, success: true};
    },
  });

  const {client} = createAlchemyD1Client({
    stack: 'my-app',
    stage: 'dev',
    fqn: 'database',
    cwd: fixture.cwd,
    apiToken: 'tok-from-arg',
    apiBase: cf.url,
    fetch: cf.fetch,
  });

  const rows = await client.all({sql: 'select count(*) as n from message', args: [], name: 'count'});
  expect(rows).toEqual([{n: 7}]);
});

test('createAlchemyD1Client falls back to CLOUDFLARE_API_TOKEN env var', async () => {
  await using fixture = await alchemyStateFixture({
    'state/app/stg/db.json': JSON.stringify({
      id: 'db',
      type: 'Cloudflare.D1Database',
      props: {},
      attr: {databaseId: 'db-uuid', databaseName: 'name', accountId: 'acct'},
    }),
  });
  await using cf = await fakeCloudflareApi({
    onQuery: ({authorization}) => {
      expect(authorization).toBe('Bearer tok-from-env');
      return {results: [], meta: {}, success: true};
    },
  });

  const previous = process.env.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_API_TOKEN = 'tok-from-env';
  try {
    const {client} = createAlchemyD1Client({
      stack: 'app',
      stage: 'stg',
      fqn: 'db',
      cwd: fixture.cwd,
      apiBase: cf.url,
      fetch: cf.fetch,
    });
    await client.all({sql: 'select 1', args: [], name: 'q'});
  } finally {
    if (previous === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    else process.env.CLOUDFLARE_API_TOKEN = previous;
  }
});

test('createAlchemyD1Client throws when no apiToken is available', async () => {
  await using fixture = await alchemyStateFixture({
    'state/app/stg/db.json': JSON.stringify({
      id: 'db',
      type: 'Cloudflare.D1Database',
      props: {},
      attr: {databaseId: 'db-uuid', databaseName: 'name', accountId: 'acct'},
    }),
  });

  const previous = process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_API_TOKEN;
  try {
    expect(() => createAlchemyD1Client({stack: 'app', stage: 'stg', fqn: 'db', cwd: fixture.cwd})).toThrow(
      /requires an apiToken/,
    );
  } finally {
    if (previous !== undefined) process.env.CLOUDFLARE_API_TOKEN = previous;
  }
});

interface QueryHandlerArgs {
  path: string;
  body: {sql: string; params: unknown[]};
  authorization: string;
}

async function fakeCloudflareApi(handlers: {
  onQuery: (req: QueryHandlerArgs) => {
    results: unknown[];
    meta: {changes?: number; last_row_id?: number};
    success: boolean;
  };
}) {
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const result = handlers.onQuery({
        path: req.url!,
        body,
        authorization: req.headers.authorization || '',
      });
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({success: true, errors: [], messages: [], result: [result]}));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    fetch: globalThis.fetch.bind(globalThis),
    async [Symbol.asyncDispose]() {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

async function alchemyStateFixture(files: Record<string, string>) {
  const root = path.join(
    repoRoot,
    'tmp',
    `alchemy-combinator-fixture-ignoreme-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const alchemyDir = path.join(root, '.alchemy');
  await fs.mkdir(alchemyDir, {recursive: true});
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(alchemyDir, relativePath);
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, content);
  }
  return {
    cwd: root,
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}
