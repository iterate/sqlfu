// Type-only test: `createDurableObjectClient(ctx.storage)` must typecheck
// against the shape of `@cloudflare/workers-types`'s `DurableObjectStorage`,
// not just our internal `DurableObjectClientInput`. We don't depend on
// `@cloudflare/workers-types` directly; instead we mirror the parts of its
// `SqlStorage` / `DurableObjectStorage` shape that exercise the variance
// hole that was tripping users up — specifically `SqlStorage.exec`'s
// stricter generic constraint.
//
// Source for the shapes below: `@cloudflare/workers-types` index.d.ts
// (SqlStorage / SqlStorageCursor / DurableObjectStorage), kept structurally
// in sync. If CF's API drifts, update here and at the call site.

import {createDurableObjectClient} from '../../src/adapters/durable-object.js';

type SqlStorageValue = ArrayBuffer | string | number | null;

declare abstract class SqlStorageCursor<T extends Record<string, SqlStorageValue>> {
  next(): {done?: false; value: T} | {done: true; value?: never};
  toArray(): T[];
  one(): T;
  raw<U extends SqlStorageValue[]>(): IterableIterator<U>;
  columnNames: string[];
  get rowsRead(): number;
  get rowsWritten(): number;
  [Symbol.iterator](): IterableIterator<T>;
}

interface CfSqlStorage {
  exec<T extends Record<string, SqlStorageValue>>(query: string, ...bindings: any[]): SqlStorageCursor<T>;
}

interface CfDurableObjectStorage {
  sql: CfSqlStorage;
  transactionSync<T>(closure: () => T): T;
  // The real type has many more members (get/put/list/etc.); we only need
  // the ones `createDurableObjectClient` reads.
}

declare const ctx: {storage: CfDurableObjectStorage};

// The headline ergonomic promise: pass ctx.storage straight in.
// This was failing with "TRow could be instantiated with a different
// subtype of constraint 'ResultRow'" before the interface was loosened.
createDurableObjectClient(ctx.storage);

// Also: the explicit-shape form continues to typecheck.
createDurableObjectClient({sql: ctx.storage.sql});
createDurableObjectClient({
  sql: ctx.storage.sql,
  transactionSync: ctx.storage.transactionSync.bind(ctx.storage),
});
