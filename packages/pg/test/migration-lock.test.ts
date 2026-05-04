// Real concurrency test for `pgDialect.withMigrationLock` — proves that
// two parallel calls *actually* serialize via `pg_advisory_xact_lock`.
//
// This was deferred under the previous pglite-socket setup because the
// socket bridge had a single global query queue, so any "concurrent"
// test would have trivially passed regardless of the lock. With the
// docker-compose pg server we can open two real pool connections and
// observe genuine wall-clock serialization.
import {expect, test} from 'vitest';
import {Pool} from 'pg';

import {createNodePostgresClient} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';

if (!(await isPgReachable())) {
  throw new Error(
    `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
      `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
  );
}

const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});

test('withMigrationLock serializes concurrent callers via pg_advisory_xact_lock', {timeout: 15_000}, async () => {
  // A single Pool with capacity for both connections so each
  // withMigrationLock call gets its own session (the advisory lock is
  // _xact_-scoped, so it needs distinct connections to actually contend).
  const pool = new Pool({connectionString: TEST_ADMIN_URL, max: 4});
  const client = createNodePostgresClient(pool);

  const HOLD_MS = 250;
  const events: string[] = [];

  const stamp = (label: string) => {
    events.push(`${label}@${Date.now()}`);
  };

  try {
    const a = dialect.withMigrationLock!(client, async () => {
      stamp('A:start');
      await new Promise((r) => setTimeout(r, HOLD_MS));
      stamp('A:end');
    });

    // Stagger B by a tiny amount to guarantee A acquires the lock first.
    // Without this we'd have a race over which acquires; both orderings
    // are valid serializations but the assertion below is easier to
    // reason about with a known winner.
    await new Promise((r) => setTimeout(r, 25));

    const b = dialect.withMigrationLock!(client, async () => {
      stamp('B:start');
      stamp('B:end');
    });

    await Promise.all([a, b]);

    const timestamps = Object.fromEntries(
      events.map((event) => {
        const [label, time] = event.split('@');
        return [label, Number(time)];
      }),
    ) as Record<'A:start' | 'A:end' | 'B:start' | 'B:end', number>;

    // The defining property: B can't start until A finishes. If the
    // lock weren't doing its job, B would start almost immediately
    // after the 25ms stagger and finish well before A:end.
    expect(timestamps['B:start']).toBeGreaterThanOrEqual(timestamps['A:end']);

    // Sanity: A actually held for ~HOLD_MS, so the lock is the thing
    // gating B (not just an arbitrarily slow B path). Allow some slop
    // for connection acquisition + transaction setup.
    const aHeldFor = timestamps['A:end'] - timestamps['A:start'];
    expect(aHeldFor).toBeGreaterThanOrEqual(HOLD_MS - 10);
  } finally {
    await pool.end();
  }
});
