// Regenerate `expected.sql` for one or more migra fixtures by running
// our pg16-pinned diff and writing the actual output back into the .md.
// Useful when the only drift between us and pgkit's snapshot is pg
// version-specific output formatting (e.g. pg16's `pg_get_viewdef` no
// longer qualifies column references).
//
// Usage:
//   pnpm tsx packages/pg/test/scripts/regenerate-migra-expected.ts \
//     --fixture dependencies,dependencies2,enumdeps,triggers3
//
// Always inspect the resulting .md diff before committing — you're
// asserting that pg16's output is the new expected behavior.
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {pgDialect} from '../../src/index.js';
import {parseFixtureMd, updateFixtureOutputs} from '../fixture-md.js';
import {ensureFixtureRoles, TEST_ADMIN_URL} from '../pg-fixture.js';

const FIXTURES_DIR = new URL('../fixtures/migra/', import.meta.url).pathname;

const fixtureArg = process.argv.find((arg) => arg.startsWith('--fixture='));
if (!fixtureArg) {
  console.error('--fixture=<name>[,name,...] required');
  process.exit(1);
}
const names = fixtureArg.slice('--fixture='.length).split(',').map((s) => s.trim()).filter(Boolean);

await ensureFixtureRoles();

const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});

for (const name of names) {
  const fixturePath = join(FIXTURES_DIR, name + '.md');
  const cases = parseFixtureMd(readFileSync(fixturePath, 'utf8'));

  for (const fixtureCase of cases) {
    const aSql = fixtureCase.inputFiles.find((f) => f.path === 'a.sql')?.content ?? '';
    const bSql = fixtureCase.inputFiles.find((f) => f.path === 'b.sql')?.content ?? '';

    const statements = await dialect.diffSchema({} as never, {
      baselineSql: aSql,
      desiredSql: bSql,
      allowDestructive: true,
    });
    const actual = statements.join('\n');

    updateFixtureOutputs(fixturePath, fixtureCase.name, {'expected.sql': actual});
    console.log(`Regenerated ${name} (${actual.split('\n').length} lines)`);
  }

  // Also strip the data-skip attribute so the test runs the next time.
  const updated = readFileSync(fixturePath, 'utf8').replace(
    /<details data-skip="[^"]*">/,
    '<details>',
  );
  writeFileSync(fixturePath, updated);
}

process.exit(0);
