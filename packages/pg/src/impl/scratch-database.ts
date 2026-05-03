// Helpers for spinning up ephemeral postgres databases via CREATE DATABASE
// + DROP DATABASE. Used by every pgDialect method that needs scratch space:
// schemadiff (two scratch dbs for migra), typegen materialize (one scratch
// db with the user's schema applied), materializeSchemaSql (apply DDL,
// extract schema, throw the db away).
//
// Usage:
//
//   await using temp = await createTempDatabase(adminUrl);
//   // ... connect to temp.url, do work ...
//
// The handle is `AsyncDisposable` — `await using` drops the database when
// the block exits, no matter how the block exits (early return, throw,
// success). No env-var indirection; the admin URL is supplied by the
// dialect factory's config.
//
// Uses `pg` directly (not `@pgkit/client`) to keep the scratch-management
// layer light. Dialect modules that need richer query ergonomics still
// reach for pgkit when they construct their own per-task clients against
// the scratch URL.
import {Client as PgClient} from 'pg';

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
  await runOnAdmin(adminUrl, async (admin) => {
    await admin.query(`create database ${quoteIdent(databaseName)}`);
  });
  const url = swapDatabasePath(adminUrl, databaseName);
  return {
    url,
    databaseName,
    [Symbol.asyncDispose]: async () => {
      // Postgres refuses to drop a database while connections to it exist.
      // The dialect impls own their connections and must close them before
      // disposal. As a belt-and-braces, we issue a `with (force)` drop
      // (pg14+) so any leftover idle session gets terminated.
      await runOnAdmin(adminUrl, async (admin) => {
        await admin.query(`drop database if exists ${quoteIdent(databaseName)} with (force)`);
      });
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

async function runOnAdmin<T>(adminUrl: string, fn: (admin: PgClient) => Promise<T>): Promise<T> {
  const admin = new PgClient({connectionString: adminUrl});
  await admin.connect();
  try {
    return await fn(admin);
  } finally {
    await admin.end();
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
