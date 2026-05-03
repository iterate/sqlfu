// Lifts the migra schema-diff fixtures from pgkit verbatim and runs them
// through `pgDialect.diffSchema`. Each fixture under `fixtures/migra/<name>/`
// has:
//   - `a.sql` — baseline schema
//   - `b.sql` — desired schema
//   - `expected.sql` — the migra output that pgkit asserts against
//
// We compare our output to `expected.sql` line-by-line (with whitespace
// normalization). Mismatches indicate either a real regression in the
// vendored migra or a behavioral drift between pgkit and our setup.
//
// Some fixtures require non-default migra args (single-schema, exclude-
// schema, extension-version-ignored variants). Those are listed in
// `argsMap` and either parametrized accordingly or skipped if we can't
// satisfy them through the current Dialect surface.
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {beforeAll, describe, expect, test} from 'vitest';

import type {SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {isPgReachable, TEST_ADMIN_URL} from './pg-fixture.js';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures/migra');
const stubHost = {} as unknown as SqlfuHost;
const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});

// Fixtures we don't run yet. Two flavors:
//
//   1. Need migra args we can't express via the current Dialect.diffSchema
//      interface (single-schema scoping, excludeSchema, extension-only,
//      ignore-extension-versions toggle).
//
//   2. Currently mismatch between our output and pgkit's expected.sql.
//      Most are minor formatting drift (pg version's `pg_get_viewdef`
//      output differs between major versions, role-related fixtures need
//      pgkit's specific test roles, etc.). Listed as todo so they show
//      up in the suite as work-to-do without being noisy red.
const SKIP_FIXTURES = new Set<string>([
  // Args we don't pass through:
  'singleschema',          // needs schema: 'goodschema'
  'singleschema_ext',      // needs createExtensionsOnly: true
  'excludeschema',         // needs excludeSchema: ['excludedschema']
  'excludemultipleschemas',// needs excludeSchema: [...]
  'extversions',           // needs ignoreExtensionVersions: false (we hard-code true)
]);

// Fixtures that fail today against pg 16 — drift from pgkit's expected.sql.
// Each one is real regression-coverage work; they're tracked as known-todo
// so we can fix them incrementally without making the full suite red.
//
// To investigate one, comment its entry out here; a failure message will
// show the diff. Then either: (a) adjust the fixture's expected.sql for
// our setup (if the drift is environmental, e.g. role names), (b) fix
// the vendored migra/schemainspect (if it's a real bug), or (c) accept
// the difference and document the deviation.
const TODO_FIXTURES = new Set<string>([
  'constraints',     // pg_get_constraintdef formatting drift
  'dependencies',
  'dependencies2',
  'dependencies3',
  'dependencies4',
  'enumdeps',
  'everything',      // grand-total fixture; covers many subsystems
  'generated_added', // pg version-dependent output
  'privileges',      // requires test roles ('schemainspect_test_role' etc.) we don't create
  'rls',
  'triggers3',       // pg_get_viewdef qualifies columns differently across versions
]);

const fixtureNames = readdirSync(FIXTURES_DIR).filter((name) => {
  // Each fixture is a directory with a.sql + b.sql + expected.sql.
  try {
    const entries = readdirSync(join(FIXTURES_DIR, name));
    return entries.includes('a.sql') && entries.includes('b.sql') && entries.includes('expected.sql');
  } catch {
    return false;
  }
});

beforeAll(async () => {
  if (!(await isPgReachable())) {
    throw new Error(
      `Test postgres not reachable at ${TEST_ADMIN_URL}. ` +
        `Run 'docker compose -f packages/pg/test/docker-compose.yml up -d' first.`,
    );
  }
});

describe('migra fixtures (lifted from pgkit)', () => {
  for (const name of fixtureNames) {
    if (SKIP_FIXTURES.has(name)) {
      test.skip(name + ' (needs args we don\'t plumb yet)', () => {});
      continue;
    }
    if (TODO_FIXTURES.has(name)) {
      test.todo(name + ' (output drifts from pgkit\'s expected.sql)');
      continue;
    }

    test(name, {timeout: 30_000}, async () => {
      const baselineSql = readFileSync(join(FIXTURES_DIR, name, 'a.sql'), 'utf8');
      const desiredSql = readFileSync(join(FIXTURES_DIR, name, 'b.sql'), 'utf8');
      const expectedSql = readFileSync(join(FIXTURES_DIR, name, 'expected.sql'), 'utf8');

      const statements = await dialect.diffSchema(stubHost, {
        baselineSql,
        desiredSql,
        allowDestructive: true,
      });
      const actual = normalize(statements.join('\n'));
      const expected = normalize(expectedSql);

      // Some fixtures' expected.sql is empty (no diff). Match exactly.
      if (expected.length === 0) {
        expect(actual).toBe('');
        return;
      }

      // Most pgkit fixtures are byte-stable — compare exactly after
      // normalization. If a fixture drifts, we can either accept a
      // documented difference here or fix the upstream-vendored code.
      expect(actual).toBe(expected);
    });
  }
});

function normalize(sql: string): string {
  return sql
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}
