# Runtime

## src/app.ts

```ts artifact=app speed=fast
import type {Client} from "sqlfu";
import {getPosts} from "./.generated/queries.sql.ts";

export async function renderFeed(client: Client) {
  const posts = await getPosts(client, {limit: 10});

  return posts.map((post) => {
    return "<article><h2>" + post.title + "</h2></article>";
  }).join("");
}
```

## node:sqlite

```ts artifact=node
import {DatabaseSync} from "node:sqlite";
import {createNodeSqliteClient} from "sqlfu";
import {renderFeed} from "./src/app.ts";

const db = createNodeSqliteClient(
  new DatabaseSync("app.db"),
);
const html = await renderFeed(db);
```

## bun:sqlite

```ts artifact=bun
import {Database} from "bun:sqlite";
import {createBunClient} from "sqlfu";
import {renderFeed} from "./src/app.ts";

const db = createBunClient(
  new Database("app.db"),
);
const html = await renderFeed(db);
```

## better-sqlite3

```ts artifact=better
import Database from "better-sqlite3";
import {createBetterSqlite3Client} from "sqlfu";
import {renderFeed} from "./src/app.ts";

const db = createBetterSqlite3Client(
  new Database("app.db"),
);
const html = await renderFeed(db);
```

## libsql

```ts artifact=libsql
import Database from "libsql";
import {createLibsqlSyncClient} from "sqlfu";
import {renderFeed} from "./src/app.ts";

const db = createLibsqlSyncClient(
  new Database("app.db"),
);
const html = await renderFeed(db);
```

## sqlite-wasm

```ts artifact=wasm
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {createSqliteWasmClient} from "sqlfu";
import {renderFeed} from "./src/app.ts";

const sqlite3 = await sqlite3InitModule();
const db = createSqliteWasmClient(
  new sqlite3.oo1.DB(":memory:"),
);
const html = await renderFeed(db);
```

## expo-sqlite

```ts artifact=expo
import * as SQLite from "expo-sqlite";
import {createExpoSqliteClient} from "sqlfu";
import {renderFeed} from "./src/app.ts";

const db = createExpoSqliteClient(
  await SQLite.openDatabaseAsync("app.db"),
);
const html = await renderFeed(db);
```

## durable object

```ts artifact=do
import {DurableObject} from "cloudflare:workers";
import {createDurableObjectClient} from "sqlfu";
import {renderFeed} from "./src/app.ts";

export class Blog extends DurableObject {
  async fetch() {
    const db = createDurableObjectClient(this.ctx.storage);
    return new Response(await renderFeed(db));
  }
}
```
