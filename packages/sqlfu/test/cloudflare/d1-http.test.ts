import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import {expect, test} from 'vitest';

import {createD1Client} from '../../src/adapters/d1.js';
import {createD1HttpClient} from '../../src/cloudflare/d1-http.js';

test('createD1HttpClient.prepare().all() POSTs sql + params and decodes results', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery({sql, params}) {
      expect(sql).toBe('select id, name from message where id = ?');
      expect(params).toEqual([42]);
      return {results: [{id: 42, name: 'hello'}], meta: {}, success: true};
    },
  });

  const d1 = createD1HttpClient({
    accountId: 'acct-123',
    apiToken: 'tok-secret',
    databaseId: 'db-uuid-456',
    apiBase: cf.url,
    fetch: cf.fetch,
  });

  const result = await d1.prepare('select id, name from message where id = ?').bind(42).all<{id: number; name: string}>();
  expect(result).toEqual({results: [{id: 42, name: 'hello'}]});

  expect(cf.requests).toHaveLength(1);
  expect(cf.requests[0]).toMatchObject({
    method: 'POST',
    path: '/accounts/acct-123/d1/database/db-uuid-456/query',
    headers: {authorization: 'Bearer tok-secret', 'content-type': 'application/json'},
  });
});

test('createD1HttpClient.prepare().first() returns the first row or null', async () => {
  let canned: unknown[] = [];
  await using cf = await fakeCloudflareApi({
    onQuery: () => ({results: canned, meta: {}, success: true}),
  });

  const d1 = createD1HttpClient({
    accountId: 'acct', apiToken: 'tok', databaseId: 'db', apiBase: cf.url, fetch: cf.fetch,
  });

  canned = [{id: 1, name: 'first'}, {id: 2, name: 'second'}];
  await expect(d1.prepare('select * from message').first()).resolves.toEqual({id: 1, name: 'first'});

  canned = [];
  await expect(d1.prepare('select * from message').first()).resolves.toBeNull();
});

test('createD1HttpClient.prepare().run() exposes changes + last_row_id from meta', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery: () => ({results: [], meta: {changes: 3, last_row_id: 17}, success: true}),
  });

  const d1 = createD1HttpClient({
    accountId: 'acct', apiToken: 'tok', databaseId: 'db', apiBase: cf.url, fetch: cf.fetch,
  });

  const result = await d1.prepare("insert into message(body) values ('a'),('b'),('c')").run();
  expect(result).toMatchObject({success: true, meta: {changes: 3, last_row_id: 17}});
});

test('createD1HttpClient surfaces Cloudflare API errors actionably', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery: () => ({status: 400, body: {success: false, errors: [{code: 7500, message: 'no such table: nope'}], messages: [], result: []}}),
  });

  const d1 = createD1HttpClient({
    accountId: 'acct', apiToken: 'tok', databaseId: 'db', apiBase: cf.url, fetch: cf.fetch,
  });

  await expect(d1.prepare('select * from nope').all()).rejects.toThrow(/no such table: nope/);
});

test('createD1Client(createD1HttpClient(...)) is the full sqlfu D1 client', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery: ({sql, params}) => {
      if (sql.startsWith('select')) {
        return {results: [{n: params[0]}], meta: {}, success: true};
      }
      return {results: [], meta: {changes: 1, last_row_id: 5}, success: true};
    },
  });

  const sqlfuClient = createD1Client(createD1HttpClient({
    accountId: 'acct', apiToken: 'tok', databaseId: 'db', apiBase: cf.url, fetch: cf.fetch,
  }));

  await expect(sqlfuClient.all({sql: 'select ? as n', args: [99], name: 'echo'})).resolves.toEqual([{n: 99}]);
  await expect(sqlfuClient.run({sql: 'insert into message(body) values (?)', args: ['hi'], name: 'insertMsg'})).resolves.toMatchObject({rowsAffected: 1, lastInsertRowid: 5});
});

interface QueryRequest {
  sql: string;
  params: unknown[];
}

type QueryResponse =
  | {results: unknown[]; meta: {changes?: number; last_row_id?: number}; success: boolean}
  | {status: number; body: unknown};

async function fakeCloudflareApi(handlers: {onQuery: (req: QueryRequest) => QueryResponse}) {
  const requests: Array<{method: string; path: string; headers: Record<string, string>; body: unknown}> = [];
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const bodyText = Buffer.concat(chunks).toString('utf8');
      const body = bodyText ? JSON.parse(bodyText) : undefined;
      requests.push({
        method: req.method!,
        path: req.url!,
        headers: req.headers as Record<string, string>,
        body,
      });

      if (req.url?.endsWith('/query')) {
        const result = handlers.onQuery(body as QueryRequest);
        if ('status' in result) {
          res.writeHead(result.status, {'content-type': 'application/json'});
          res.end(JSON.stringify(result.body));
          return;
        }
        res.writeHead(200, {'content-type': 'application/json'});
        res.end(JSON.stringify({success: true, errors: [], messages: [], result: [result]}));
        return;
      }
      res.writeHead(404).end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    requests,
    url: `http://127.0.0.1:${port}`,
    fetch: globalThis.fetch.bind(globalThis),
    async [Symbol.asyncDispose]() {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    },
  };
}
