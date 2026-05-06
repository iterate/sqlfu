# Guides

Use these when you already know the runtime you want and need a complete
project shape: config, schema files, query files, generated wrappers, adapter
usage, and runtime migration notes.

For compact adapter snippets only, use [Adapters](./adapters.md).

| Runtime | Guide |
| --- | --- |
| Cloudflare Durable Objects | [Durable Objects](./guides/durable-objects.md) |
| Cloudflare D1 | [Cloudflare D1](./guides/cloudflare-d1.md) |
| Node SQLite, better-sqlite3, native libsql | [Node SQLite](./guides/node-sqlite.md) |
| Bun SQLite | [Bun SQLite](./guides/bun-sqlite.md) |
| Turso Cloud and libSQL | [Turso and libSQL](./guides/turso-libsql.md) |
| Expo SQLite | [Expo SQLite](./guides/expo-sqlite.md) |
| sqlite-wasm in the browser | [sqlite-wasm](./guides/sqlite-wasm.md) |

Every guide follows the same SQL-first loop:

1. author `definitions.sql`;
2. write runtime queries in a small `queries.sql` file;
3. run `sqlfu draft`;
4. run `sqlfu generate`;
5. pass the generated wrapper a sqlfu client from the runtime adapter.

