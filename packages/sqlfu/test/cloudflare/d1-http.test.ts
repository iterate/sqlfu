import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import {expect, test} from 'vitest';

import {createD1HttpClient} from '../../src/cloudflare/d1-http.js';

test('createD1HttpClient.all() POSTs sql + params and decodes results', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery({sql, params}) {
      expect(sql).toBe('select id, name from message where id = ?');
      expect(params).toEqual([42]);
      return {results: [{id: 42, name: 'hello'}], meta: {}, success: true};
    },
  });

  const client = createD1HttpClient({
    accountId: 'acct-123',
    apiToken: 'tok-secret',
    databaseId: 'db-uuid-456',
    apiBase: cf.url,
    fetch: cf.fetch,
  });

  const rows = await client.all<{id: number; name: string}>({
    sql: 'select id, name from message where id = ?',
    args: [42],
    name: 'getById',
  });
  expect(rows).toEqual([{id: 42, name: 'hello'}]);

  expect(cf.requests).toHaveLength(1);
  expect(cf.requests[0]).toMatchObject({
    method: 'POST',
    path: '/accounts/acct-123/d1/database/db-uuid-456/query',
    headers: {authorization: 'Bearer tok-secret', 'content-type': 'application/json'},
    body: {sql: 'select id, name from message where id = ?', params: [42]},
  });
});

test('createD1HttpClient.run() exposes rowsAffected + lastInsertRowid', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery: () => ({results: [], meta: {changes: 3, last_row_id: 17}, success: true}),
  });

  const client = createD1HttpClient({
    accountId: 'acct',
    apiToken: 'tok',
    databaseId: 'db',
    apiBase: cf.url,
    fetch: cf.fetch,
  });

  const result = await client.run({
    sql: "insert into message(body) values ('a'),('b'),('c')",
    args: [],
    name: 'insertMessages',
  });
  expect(result).toMatchObject({rowsAffected: 3, lastInsertRowid: 17});
});

test('createD1HttpClient surfaces Cloudflare API errors actionably', async () => {
  await using cf = await fakeCloudflareApi({
    onQuery: () => ({
      status: 400,
      body: {success: false, errors: [{code: 7500, message: 'no such table: nope'}], messages: [], result: []},
    }),
  });

  const client = createD1HttpClient({
    accountId: 'acct',
    apiToken: 'tok',
    databaseId: 'db',
    apiBase: cf.url,
    fetch: cf.fetch,
  });

  await expect(client.all({sql: 'select * from nope', args: [], name: 'q'})).rejects.toThrow(/no such table: nope/);
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
