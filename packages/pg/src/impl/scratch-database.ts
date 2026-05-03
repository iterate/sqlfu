// Helpers for spinning up ephemeral postgres databases via CREATE DATABASE
// + DROP DATABASE. Used by every pgDialect method that needs scratch space:
// schemadiff (two scratch dbs for migra), typegen materialize (one scratch
// db with the user's schema applied), materializeSchemaSql (apply DDL,
// extract schema, throw the db away).
//
// Usage:
//
//   await using temp = await createTempDatabase(adminUrl);
//   const client = createClient(temp.url);
//   try {
//     await client.query(client.sql.raw('create table ...'));
//     // ...
//   } finally {
//     await client.end();
//   }
//
// The handle is `AsyncDisposable` — `await using` drops the database when
// the block exits, no matter how the block exits (early return, throw,
// success). No env-var indirection; the admin URL is supplied by the
// dialect factory's config.
import {createClient, type Client as PgkitClient} from '@pgkit/client';

export interface TempDatabaseHandle extends AsyncDisposable {
  /** Connection URL pointing at the freshly-created database. */
  readonly url: string;
  /** The chosen database name (random suffix for collision-safety). */
  readonly databaseName: string;
}

/**
 * Open an admin connection to `adminUrl`, `CREATE DATABASE` a uniquely-named
 * scratch db, and return a handle whose disposal `DROP DATABASE`s it. The
 * admin connection is closed before returning — we don't hold an idle
 * connection for the lifetime of the handle.
 *
 * The scratch db's URL points at the same server with the new database
 * name swapped into the path. Authentication and other URL parameters are
 * preserved verbatim.
 */
export async function createTempDatabase(adminUrl: string): Promise<TempDatabaseHandle> {
  const databaseName = uniqueDatabaseName();
  const adminClient = createClient(adminUrl);
  try {
    await adminClient.query(adminClient.sql.raw(`create database ${quoteIdent(databaseName)}`));
  } finally {
    await adminClient.end();
  }
  const url = swapDatabasePath(adminUrl, databaseName);
  return {
    url,
    databaseName,
    [Symbol.asyncDispose]: async () => {
      // Postgres refuses to drop a database while connections to it exist.
      // The dialect impls own their connections and must close them before
      // disposal. As a belt-and-braces, we issue a `with (force)` drop
      // (pg14+) so any leftover idle session gets terminated.
      const cleanup = createClient(adminUrl);
      try {
        await cleanup.query(cleanup.sql.raw(`drop database if exists ${quoteIdent(databaseName)} with (force)`));
      } finally {
        await cleanup.end();
      }
    },
  };
}

/**
 * Open `count` parallel scratch databases. Returns a handle whose disposal
 * drops all of them. Used by `pgDialect.diffSchema` which needs two
 * databases at once for migra (baseline + desired).
 */
export async function createTempDatabasePair(
  adminUrl: string,
): Promise<{baseline: TempDatabaseHandle; desired: TempDatabaseHandle} & AsyncDisposable> {
  const baseline = await createTempDatabase(adminUrl);
  let desired: TempDatabaseHandle;
  try {
    desired = await createTempDatabase(adminUrl);
  } catch (error) {
    await baseline[Symbol.asyncDispose]();
    throw error;
  }
  return {
    baseline,
    desired,
    [Symbol.asyncDispose]: async () => {
      // Dispose in reverse order. Errors in one disposal don't block the
      // other — both run, the worst error wins.
      const errors: unknown[] = [];
      try {
        await desired[Symbol.asyncDispose]();
      } catch (error) {
        errors.push(error);
      }
      try {
        await baseline[Symbol.asyncDispose]();
      } catch (error) {
        errors.push(error);
      }
      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) throw new AggregateError(errors, 'Failed to dispose pg scratch database pair');
    },
  };
}

/** Convenience: open a scratch db, hand a connected client to `fn`, dispose. */
export async function withTempDatabaseClient<T>(
  adminUrl: string,
  fn: (client: PgkitClient) => Promise<T>,
): Promise<T> {
  await using temp = await createTempDatabase(adminUrl);
  const client = createClient(temp.url);
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function uniqueDatabaseName(): string {
  // Random lowercase suffix to avoid clashes between concurrent sqlfu
  // invocations against the same scratch admin URL.
  return `sqlfu_scratch_${Math.random().toString(36).slice(2, 12)}`;
}

function swapDatabasePath(url: string, databaseName: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}
