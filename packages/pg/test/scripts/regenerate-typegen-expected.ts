// Regenerate the `yaml` expected blocks in one or more typegen fixtures
// by running our analyzer and writing the actual analysis back into
// the .md.
//
// Usage:
//   pnpm tsx packages/pg/test/scripts/regenerate-typegen-expected.ts \
//     --fixture=primitives,joins,cte
//   pnpm tsx packages/pg/test/scripts/regenerate-typegen-expected.ts --all
//
// Always inspect the resulting .md diff before committing.
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {ensureFixtureRoles} from '../pg-fixture.js';
import {parseTypegenFixture, stringifyExpected} from '../typegen-fixture-md.js';
import {FIXTURES_DIR, loadFixtures, materializeFor, runCase} from '../typegen-fixture-runner.js';

const argMap = new Map(process.argv.slice(2).map((arg) => arg.split('=') as [string, string]));
const all = argMap.has('--all');
const fixtureArg = argMap.get('--fixture');
if (!all && !fixtureArg) {
  console.error('Pass --fixture=name1,name2 or --all');
  process.exit(1);
}

await ensureFixtureRoles();

const targetNames = all
  ? loadFixtures().map((f) => f.name)
  : fixtureArg!.split(',').map((s) => s.trim()).filter(Boolean);

for (const name of targetNames) {
  const fixturePath = join(FIXTURES_DIR, name + '.md');
  const fixture = parseTypegenFixture(readFileSync(fixturePath, 'utf8'));

  await using handle = await materializeFor(fixture.definitions);
  const actuals = new Map<string, unknown>();
  for (const fixtureCase of fixture.cases) {
    if (fixtureCase.skip) continue;
    actuals.set(fixtureCase.name, await runCase(handle.materialized, fixtureCase));
  }

  writeFileSync(fixturePath, rewriteExpectedBlocks(readFileSync(fixturePath, 'utf8'), actuals));
  console.log(`Regenerated ${name} (${actuals.size} cases)`);
}

process.exit(0);

/**
 * Rewrite the body of every `## case-name` block's ```yaml``` fence to
 * match the freshly-computed expected value. Cases without an entry
 * in `actuals` (skipped, or not yet present) are left alone.
 *
 * If no ```yaml``` fence exists yet for a case, append one after the
 * existing ```sql``` block — that's the "scaffold a new fixture"
 * affordance.
 */
function rewriteExpectedBlocks(contents: string, actuals: ReadonlyMap<string, unknown>): string {
  const headings = [...contents.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)];
  let out = '';
  let cursor = 0;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const sectionStart = heading.index!;
    const sectionEnd = headings[i + 1]?.index ?? contents.length;
    out += contents.slice(cursor, sectionStart);

    const name = heading[1].trim();
    const actual = actuals.get(name);
    let body = contents.slice(sectionStart, sectionEnd);

    if (actual !== undefined) {
      const yamlBlock = '```yaml\n' + stringifyExpected(actual) + '\n```';
      if (/^```yaml\b/m.test(body)) {
        body = body.replace(/^```yaml(?:[ \t]+\w+)?[ \t]*\n[\s\S]*?^```[ \t]*$/m, yamlBlock);
      } else {
        // No yaml block yet — append after the sql block.
        body = body.replace(
          /^(```sql[\s\S]*?^```[ \t]*$)/m,
          (sqlBlock) => `${sqlBlock}\n\n${yamlBlock}`,
        );
      }
    }

    out += body;
    cursor = sectionEnd;
  }
  out += contents.slice(cursor);
  return out;
}
