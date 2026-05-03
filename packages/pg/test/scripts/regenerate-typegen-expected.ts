// Regenerate `analyses/*.json` for one or more typegen fixtures by running
// our analyzer and writing the actual JSON back into the .md.
//
// Usage:
//   pnpm tsx packages/pg/test/scripts/regenerate-typegen-expected.ts \
//     --fixture=primitives,joins,cte
//   pnpm tsx packages/pg/test/scripts/regenerate-typegen-expected.ts \
//     --all
//
// Always inspect the resulting .md diff before committing.
import {readFileSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';

import {parseFixtureMd, updateFixtureOutputs, listFixtureFiles} from '../fixture-md.js';
import {ensureFixtureRoles} from '../pg-fixture.js';
import {FIXTURES_DIR, runTypegenCase} from '../typegen-fixture-runner.js';

const argMap = new Map(process.argv.slice(2).map((arg) => arg.split('=') as [string, string]));
const all = argMap.has('--all');
const fixtureArg = argMap.get('--fixture');
if (!all && !fixtureArg) {
  console.error('Pass --fixture=name1,name2 or --all');
  process.exit(1);
}

await ensureFixtureRoles();

const targets = all
  ? listFixtureFiles(FIXTURES_DIR).map((p) => basename(p).replace(/\.md$/, ''))
  : fixtureArg!.split(',').map((s) => s.trim()).filter(Boolean);

for (const name of targets) {
  const fixturePath = join(FIXTURES_DIR, name + '.md');
  const cases = parseFixtureMd(readFileSync(fixturePath, 'utf8'));
  for (const fixtureCase of cases) {
    const {actual} = await runTypegenCase(fixtureCase);
    const outputs: Record<string, string> = {};
    for (const [queryName, analysis] of Object.entries(actual)) {
      outputs[`analyses/${queryName}.json`] = JSON.stringify(analysis, null, 2);
    }
    updateFixtureOutputs(fixturePath, fixtureCase.name, outputs);
    console.log(`Regenerated ${name} :: ${fixtureCase.name} (${Object.keys(outputs).length} queries)`);
  }
  // Strip data-skip if present.
  const updated = readFileSync(fixturePath, 'utf8').replace(/<details data-skip="[^"]*">/g, '<details>');
  writeFileSync(fixturePath, updated);
}

process.exit(0);
