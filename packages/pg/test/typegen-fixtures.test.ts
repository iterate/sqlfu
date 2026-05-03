// Query-analysis regression suite. Each `.md` under `fixtures/typegen/`
// holds N test cases; the format mirrors the migra fixtures (input has
// `definitions.sql` plus one or more `sql/<name>.sql` query files;
// output has matching `analyses/<name>.json` files describing the
// expected per-column type + nullability).
//
// Cases are lifted in spirit from pgkit/packages/typegen/test/*.test.ts
// — we extract the SQL queries pgkit cared about and the per-column
// nullability/type expectations, then re-encode them in our format.
//
// To regenerate expected JSON after a deliberate behavior change, run:
//   pnpm tsx packages/pg/test/scripts/regenerate-typegen-expected.ts --all
import {readFileSync} from 'node:fs';
import {basename} from 'node:path';
import {beforeAll, describe, expect, test} from 'vitest';

import {listFixtureFiles, parseFixtureMd} from './fixture-md.js';
import {ensureFixtureRoles, isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';
import {FIXTURES_DIR, runTypegenCase} from './typegen-fixture-runner.js';

beforeAll(async () => {
  if (!(await isPgReachable())) {
    throw new Error(
      `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
        `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
    );
  }
  await ensureFixtureRoles();
});

describe('typegen fixtures (lifted from pgkit)', () => {
  for (const fixturePath of listFixtureFiles(FIXTURES_DIR)) {
    const cases = parseFixtureMd(readFileSync(fixturePath, 'utf8'));
    const fileName = basename(fixturePath);

    for (const fixtureCase of cases) {
      const label = `${fileName} › ${fixtureCase.name}`;

      if (fixtureCase.skip) {
        test.skip(`${label} (${fixtureCase.skip})`, () => {});
        continue;
      }

      test(label, {timeout: 60_000}, async () => {
        const {actual, expected} = await runTypegenCase(fixtureCase);
        for (const queryName of Object.keys(expected)) {
          expect(actual[queryName], `analysis mismatch for ${queryName}`).toEqual(expected[queryName]);
        }
        // Catch the case where the fixture declares a query but no expected
        // analysis exists (the runner would silently skip otherwise).
        for (const queryName of Object.keys(actual)) {
          expect(
            expected[queryName],
            `actual produced an analysis for ${queryName} but the fixture has no expected JSON for it`,
          ).toBeDefined();
        }
      });
    }
  }
});
