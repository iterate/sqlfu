// One-shot conversion: read each migra fixture directory and emit a
// markdown-formatted fixture in its place. Run via:
//
//   pnpm tsx packages/pg/test/scripts/convert-migra-fixtures.ts
//
// Drops `additions.sql` and `expected2.sql` — those are vestigial copies
// from the upstream Python migra tests and are never read by pgkit's
// runner (or ours).
import {readdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const FIXTURES_DIR = new URL('../fixtures/migra/', import.meta.url).pathname;

function fenced(lang: string, path: string, body: string): string {
  const trimmed = body.endsWith('\n') ? body : body + '\n';
  return '```' + lang + ' (' + path + ')\n' + trimmed + '```';
}

function buildMd(name: string, aSql: string, bSql: string, expectedSql: string): string {
  const blocks = [
    '# Migra fixture: ' + name,
    '',
    'Lifted from `pgkit/packages/migra/test/fixtures/' + name + '/`.',
    '',
    '## ' + name,
    '',
    '<details>',
    '<summary>input</summary>',
    '',
    fenced('sql', 'a.sql', aSql),
    '',
    fenced('sql', 'b.sql', bSql),
    '',
    '</details>',
    '',
    '<details>',
    '<summary>output</summary>',
    '',
    fenced('sql', 'expected.sql', expectedSql),
    '',
    '</details>',
    '',
  ];
  return blocks.join('\n');
}

const entries = readdirSync(FIXTURES_DIR).filter((name) => {
  const p = join(FIXTURES_DIR, name);
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
});

let converted = 0;
for (const name of entries) {
  const dir = join(FIXTURES_DIR, name);
  const aPath = join(dir, 'a.sql');
  const bPath = join(dir, 'b.sql');
  const expectedPath = join(dir, 'expected.sql');

  let aSql: string;
  let bSql: string;
  let expectedSql: string;
  try {
    aSql = readFileSync(aPath, 'utf8');
    bSql = readFileSync(bPath, 'utf8');
    expectedSql = readFileSync(expectedPath, 'utf8');
  } catch (error) {
    console.warn(`Skipping ${name}: ${(error as Error).message}`);
    continue;
  }

  const md = buildMd(name, aSql, bSql, expectedSql);
  writeFileSync(join(FIXTURES_DIR, name + '.md'), md);
  rmSync(dir, {recursive: true, force: true});
  converted++;
}

console.log(`Converted ${converted} fixtures.`);
