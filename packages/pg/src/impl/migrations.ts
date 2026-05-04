// Postgres migration-bookkeeping. Two pieces:
//
//   1. `pgDefaultMigrationTableDdl` — DDL for the default `'sqlfu'` migrations
//      preset, in postgres flavor (timestamptz instead of text for applied_at).
//   2. `pgWithMigrationLock` — wraps migration application in a transaction
//      that holds a postgres advisory lock until the transaction commits/rolls
//      back. Prevents concurrent runners from racing on the bookkeeping table.
//
// SQLite is single-writer at the file level so its dialect omits the lock.
import type {Dialect} from 'sqlfu';

// 64-bit advisory-lock key. Generated as a stable hash of the literal string
// "sqlfu/migrations" to avoid colliding with anyone else's advisory locks on
// the same database. Recomputed at module-load via FNV-1a so we don't have
// to ship a magic number with no provenance.
const ADVISORY_LOCK_KEY = fnv1aHash64('sqlfu/migrations');

export const pgDefaultMigrationTableDdl: Dialect['defaultMigrationTableDdl'] = (tableName) =>
  `create table if not exists ${tableName} (\n  name text primary key check (name not like '%.sql'),\n  checksum text not null,\n  applied_at timestamptz not null\n);`;

export const pgWithMigrationLock: NonNullable<Dialect['withMigrationLock']> = async (client, fn) => {
  // The advisory lock has to live on the same session as the surrounding
  // transaction — `pg_advisory_xact_lock` is bound to the *connection*
  // running it, and is released when that connection's transaction
  // commits/rolls back. So we acquire the lock via the transaction's
  // `tx` client (which is session-bound to a single PoolClient), not
  // via the outer `client` (whose `raw` checks out a fresh pool
  // connection per call — that connection would return to the pool
  // immediately, releasing the lock before `fn` even starts).
  return client.transaction(async (tx) => {
    await tx.raw(`select pg_advisory_xact_lock(${ADVISORY_LOCK_KEY})`);
    return fn();
  });
};

// Stable 64-bit-ish hash for the advisory-lock key. Not security-critical;
// the only requirement is "deterministic and unlikely to collide with other
// users of advisory locks on the same database".
function fnv1aHash64(input: string): string {
  // Two 32-bit FNV-1a halves combined into a single bigint, then rendered
  // as a signed 64-bit integer for postgres `bigint` consumption.
  const FNV_OFFSET = 2_166_136_261;
  const FNV_PRIME = 16_777_619;
  let high = FNV_OFFSET;
  let low = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    high = Math.imul(high ^ code, FNV_PRIME) >>> 0;
    low = Math.imul(low ^ ((code * 31) >>> 0), FNV_PRIME) >>> 0;
  }
  const combined = (BigInt(high) << 32n) | BigInt(low);
  // Postgres `bigint` is signed; coerce into the signed range.
  const signed = combined >= 1n << 63n ? combined - (1n << 64n) : combined;
  return signed.toString();
}
