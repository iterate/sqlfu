// Schema-diff regression suite. Each `.md` under `fixtures/migra/` is one
// case lifted from pgkit's migra test fixtures (which were themselves
// lifted from upstream Python migra). The `a.sql`/`b.sql`/`expected.sql`
// trio is encoded inside the markdown — see `fixture-md.ts` for the format.
//
// Mismatches on the line-normalized comparison indicate either a real
// regression in the vendored migra or a behavioral drift between pgkit's
// snapshots and our pg setup. The few cases that still drift today are
// marked with `data-skip="…"` on their input `<details>` tag.
import {readFileSync} from 'node:fs';
import {basename} from 'node:path';
import {beforeAll, describe, expect, test} from 'vitest';

import type {SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {listFixtureFiles, parseFixtureMd} from './fixture-md.js';
import {ensureFixtureRoles, isPgReachable, MISSING_PG_MESSAGE, TEST_ADMIN_URL} from './pg-fixture.js';

const FIXTURES_DIR = new URL('./fixtures/migra/', import.meta.url).pathname;
const stubHost = {} as unknown as SqlfuHost;
const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});

const pgReachable = await isPgReachable();
const pgTest = test.skipIf(!pgReachable);

beforeAll(async () => {
  if (pgReachable) await ensureFixtureRoles();
});

describe('migra fixtures (lifted from pgkit)', () => {
  for (const fixturePath of listFixtureFiles(FIXTURES_DIR)) {
    const cases = parseFixtureMd(readFileSync(fixturePath, 'utf8'));
    const fileName = basename(fixturePath);

    for (const fixtureCase of cases) {
      const label = `${fileName} › ${fixtureCase.name}`;

      if (fixtureCase.skip) {
        test.skip(`${label} (${fixtureCase.skip})`, () => {});
        continue;
      }

      pgTest(label, {timeout: 30_000}, async () => {
        const aSql = fixtureCase.inputFiles.find((f) => f.path === 'a.sql')?.content;
        const bSql = fixtureCase.inputFiles.find((f) => f.path === 'b.sql')?.content;
        const expectedSql = fixtureCase.outputFiles.find((f) => f.path === 'expected.sql')?.content;

        if (aSql === undefined || bSql === undefined || expectedSql === undefined) {
          throw new Error(`Fixture ${label} must declare a.sql + b.sql in <input> and expected.sql in <output>`);
        }

        const statements = await dialect.diffSchema(stubHost, {
          baselineSql: aSql,
          desiredSql: bSql,
          allowDestructive: true,
        });
        const actual = normalize(statements.join('\n'));
        const expected = normalize(expectedSql);

        // Empty-diff cases must produce empty output — anything else is a
        // false positive.
        if (expected.length === 0) {
          expect(actual).toBe('');
          return;
        }

        expect(actual).toBe(expected);
      });
    }
  }
});

if (!pgReachable) {
  test.skip(MISSING_PG_MESSAGE, () => {});
}

function normalize(sql: string): string {
  return sql
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}
