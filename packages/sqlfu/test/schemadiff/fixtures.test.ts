import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

import {
  listFixtureFiles,
  parseSchemadiffFixture,
  rewriteSchemadiffFixtures,
  runFixtureCase,
} from './fixture-helpers.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const shouldUpdateFixtures = process.env.SQLFU_SCHEMADIFF_UPDATE === '1';

if (shouldUpdateFixtures) {
  await rewriteSchemadiffFixtures(fixturesDir);
}

for (const fixturePath of await listFixtureFiles(fixturesDir)) {
  describe(path.basename(fixturePath), async () => {
    const cases = parseSchemadiffFixture(await fs.readFile(fixturePath, 'utf8'));

    for (const fixtureCase of cases) {
      test(fixtureCase.name, async () => {
        if (fixtureCase.error) {
          await expect(runFixtureCase(fixtureCase)).rejects.toThrow(fixtureCase.error);
          return;
        }

        await expect(runFixtureCase(fixtureCase)).resolves.toBe(fixtureCase.output);
      });
    }
  });
}
