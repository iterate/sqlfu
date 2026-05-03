// Query-analysis regression suite. Each `.md` under `fixtures/typegen/`
// holds N focused tests; the format is one `## case-name` heading per
// case, immediately followed by a `sql` query block and a `yaml`
// expected block. A file-level `sql definitions` block above the
// first heading sets up the schema once for every case in the file.
//
// Cases are lifted in spirit from `pgkit/packages/typegen/test/*.test.ts`
// — we extract the SQL queries pgkit cared about and the per-column
// nullability/type expectations, then re-encode them in our format.
//
// To regenerate expected YAML after a deliberate behavior change:
//   pnpm tsx packages/pg/test/scripts/regenerate-typegen-expected.ts --all
import {describe, expect, test} from 'vitest';

import {ensureFixtureRoles, isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';
import {loadFixtures, materializeFor, runCase} from './typegen-fixture-runner.js';

if (!(await isPgReachable())) {
  throw new Error(
    `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
      `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
  );
}
await ensureFixtureRoles();

for (const loaded of loadFixtures()) {
  describe(loaded.name, () => {
    for (const fixtureCase of loaded.fixture.cases) {
      if (fixtureCase.skip) {
        test.skip(`${fixtureCase.name} (${fixtureCase.skip})`, () => {});
        continue;
      }
      test(fixtureCase.name, {timeout: 60_000}, async () => {
        await using handle = await materializeFor(loaded.fixture.definitions);
        const actual = await runCase(handle.materialized, fixtureCase);
        expect(actual, `query under test:\n${fixtureCase.query}`).toEqual(fixtureCase.expected);
      });
    }
  });
}
