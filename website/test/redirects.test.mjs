import assert from 'node:assert/strict';
import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(testDir, '..');
const distDir = path.join(websiteRoot, 'dist');

test('/docs is an edge redirect, not a rendered redirect page', async () => {
  const redirects = await readFile(path.join(distDir, '_redirects'), 'utf8');
  const rules = redirects
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  assert.ok(
    rules.includes('/docs /docs/getting-started 301'),
    'expected Cloudflare _redirects to redirect /docs before asset serving',
  );

  await assert.rejects(
    () => stat(path.join(distDir, 'docs.html')),
    {code: 'ENOENT'},
    'Astro should not emit docs.html because that renders a visible meta-refresh redirect page',
  );

  assert.deepEqual(
    await findFilesContaining(distDir, 'Redirecting to: /docs/getting-started'),
    [],
    'the built artifact should not contain a visible redirect page for /docs',
  );
});

async function findFilesContaining(root, needle) {
  const matches = [];
  const entries = await readdir(root, {withFileTypes: true});

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      matches.push(...(await findFilesContaining(entryPath, needle)));
      continue;
    }

    if (!entry.name.endsWith('.html')) {
      continue;
    }

    const contents = await readFile(entryPath, 'utf8');
    if (contents.includes(needle)) {
      matches.push(path.relative(distDir, entryPath));
    }
  }

  return matches;
}
