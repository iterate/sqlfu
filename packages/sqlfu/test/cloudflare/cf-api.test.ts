import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import {expect, test} from 'vitest';

import {findCloudflareD1ByName} from '../../src/cloudflare/cf-api.js';

test('findCloudflareD1ByName returns a single matching database', async () => {
  await using cf = await fakeCloudflareApi({
    onListD1: ({accountId, name, authorization}) => {
      expect(accountId).toBe('acct-123');
      expect(name).toBe('my-app-prod-database');
      expect(authorization).toBe('Bearer tok-secret');
      return [{uuid: 'db-uuid-001', name: 'my-app-prod-database'}];
    },
  });

  const result = await findCloudflareD1ByName({
    accountId: 'acct-123',
    apiToken: 'tok-secret',
    name: 'my-app-prod-database',
    apiBase: cf.url,
    fetch: cf.fetch,
  });

  expect(result).toEqual({
    databaseId: 'db-uuid-001',
    databaseName: 'my-app-prod-database',
    accountId: 'acct-123',
  });
});

test('findCloudflareD1ByName throws when no database matches', async () => {
  await using cf = await fakeCloudflareApi({onListD1: () => []});

  await expect(
    findCloudflareD1ByName({
      accountId: 'acct',
      apiToken: 'tok',
      name: 'missing-db',
      apiBase: cf.url,
      fetch: cf.fetch,
    }),
  ).rejects.toThrow(/No Cloudflare D1 database found for name "missing-db"/);
});

test('findCloudflareD1ByName throws when multiple databases match', async () => {
  await using cf = await fakeCloudflareApi({
    onListD1: () => [
      {uuid: 'db-1', name: 'shared'},
      {uuid: 'db-2', name: 'shared'},
    ],
  });

  await expect(
    findCloudflareD1ByName({
      accountId: 'acct',
      apiToken: 'tok',
      name: 'shared',
      apiBase: cf.url,
      fetch: cf.fetch,
    }),
  ).rejects.toThrow(/Multiple Cloudflare D1 databases match name "shared".*db-1.*db-2/s);
});

test('findCloudflareD1ByName surfaces Cloudflare API errors', async () => {
  await using cf = await fakeCloudflareApi({
    onListD1: () => ({
      status: 401,
      body: {success: false, errors: [{code: 10000, message: 'Authentication error'}], messages: [], result: null},
    }),
  });

  await expect(
    findCloudflareD1ByName({
      accountId: 'acct',
      apiToken: 'bad-token',
      name: 'whatever',
      apiBase: cf.url,
      fetch: cf.fetch,
    }),
  ).rejects.toThrow(/Authentication error/);
});

interface ListRequest {
  accountId: string;
  name: string | null;
  authorization: string;
}

type ListResponse = Array<{uuid: string; name: string}> | {status: number; body: unknown};

async function fakeCloudflareApi(handlers: {onListD1: (req: ListRequest) => ListResponse}) {
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url!, 'http://localhost');
    const match = url.pathname.match(/^\/accounts\/([^/]+)\/d1\/database$/);
    if (req.method === 'GET' && match) {
      const result = handlers.onListD1({
        accountId: match[1]!,
        name: url.searchParams.get('name'),
        authorization: req.headers.authorization || '',
      });
      if (Array.isArray(result)) {
        res.writeHead(200, {'content-type': 'application/json'});
        res.end(JSON.stringify({success: true, errors: [], messages: [], result}));
      } else {
        res.writeHead(result.status, {'content-type': 'application/json'});
        res.end(JSON.stringify(result.body));
      }
      return;
    }
    res.writeHead(404).end();
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
