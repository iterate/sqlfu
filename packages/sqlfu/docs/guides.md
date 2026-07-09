# Guides

Use these when you already know the runtime you want and need a complete
project shape: inline config, generated query types, adapter usage, and runtime
migration notes. File-backed examples are included where a larger project would
benefit from splitting schema and queries out.

For compact adapter snippets only, use [Adapters](./adapters.md). For external
tools and service-specific helper modules, use [Integrations](./integrations.md).

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

1. author inline `definitions: sql\`...\``;
2. write named inline queries under `queries`;
3. run `sqlfu draft`;
4. run `sqlfu generate`;
5. pass the generated wrapper a sqlfu client from the runtime adapter.

When the inline module gets too large, move the same SQL into
`definitions.sql`, `sql/queries.sql`, and `migrations/`.
