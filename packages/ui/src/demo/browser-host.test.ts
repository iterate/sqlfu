import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import {expect, test} from 'vitest';
import {createSqliteWasmClient} from 'sqlfu';

test('demo-mode sql runner path binds named params using the UI form key names', async () => {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB(':memory:');
  const client = createSqliteWasmClient(db);

  db.exec(`create table posts (id integer primary key, slug text)`);
  db.exec(`insert into posts (slug) values ('a'), ('b'), ('c')`);

  // The SQL runner form uses the bare name as the key (matches
  // detectNamedParameters in client.tsx and the labels rendered by
  // buildSqlRunnerParamsSchema), so browser-host.execAdHocSql passes a bare
  // object key through the adapter's prepared-statement path.
  const stmt = client.prepare(`select * from posts limit @limitt`);
  const rows = await stmt.all({limitt: 2});

  expect(rows).toHaveLength(2);
});
