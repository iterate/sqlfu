import {expect, test} from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

import {checkStrictImports, formatViolations} from '../scripts/check-strict-imports.js';
import type {Confirm} from '../src/api/core.js';

const packageRoot = path.resolve(path.dirname(import.meta.filename), '..');

// dist/ is built by test/global-setup.ts (vitest globalSetup) before any
// test file runs. That keeps the vendor-bundle step — which `rm -rf`'s
// dist/vendor/ — from racing parallel adapter tests reading dist.
test('strict-tier entries import no node:* or disallowed bare specifiers', async () => {
  const violations = await checkStrictImports();
  if (violations.length > 0) {
    throw new Error(formatViolations(violations));
  }
  expect(violations).toEqual([]);
});

test('built api entry exposes commands plus sql helper', async () => {
  const apiEntry = path.join(packageRoot, 'dist/api/exports.js');
  const api = await import(pathToFileURL(apiEntry).href);
  expect(Object.keys(api).sort()).toEqual([
    'applied',
    'baseline',
    'check',
    'config',
    'draft',
    'find',
    'format',
    'generate',
    'goto',
    'init',
    'kill',
    'migrate',
    'pending',
    'serve',
    'sql',
    'sync',
  ]);
});

test('built api core entry exposes the host-explicit facade', async () => {
  const coreEntry = path.join(packageRoot, 'dist/api/core.js');
  const api = await import(pathToFileURL(coreEntry).href);
  expect(Object.keys(api).sort()).toEqual(['autoAcceptConfirm', 'createSqlfuApi']);
});

test('built api sync entry exposes the runtime sync primitive', async () => {
  const syncEntry = path.join(packageRoot, 'dist/api/sync.js');
  const api = await import(pathToFileURL(syncEntry).href);
  expect(Object.keys(api).sort()).toEqual(['sync']);
});

test('built cloudflare entry exposes the D1 helpers', async () => {
  const cloudflareEntry = path.join(packageRoot, 'dist/cloudflare/exports.js');
  const cloudflare = await import(pathToFileURL(cloudflareEntry).href);
  expect(Object.keys(cloudflare).sort()).toEqual([
    'DEFAULT_CLOUDFLARE_API_BASE',
    'createAlchemyD1Client',
    'createD1HttpClient',
    'findCloudflareD1ByName',
    'findMiniflareD1Path',
    'readAlchemyD1State',
  ]);
});

test('built root runtime entry is parseable by bundlers without explicit resource management syntax', async () => {
  const runtimeFiles = await collectRelativeImportGraph('dist/index.js');
  for (const runtimeFile of runtimeFiles) {
    const text = await fs.readFile(path.join(packageRoot, runtimeFile), 'utf8');
    expect(text).not.toMatch(/\b(?:await\s+)?using\s+\w+\s*=/);
  }

  const rootEntry = path.join(packageRoot, 'dist/index.js');
  const sqlfu = await import(pathToFileURL(rootEntry).href);
  expect(sqlfu).toMatchObject({
    applyMigrations: expect.any(Function),
    createD1Client: expect.any(Function),
    defineConfig: expect.any(Function),
    sql: expect.any(Function),
  });
});

async function collectRelativeImportGraph(entry: string): Promise<string[]> {
  const seen = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const runtimeFile = pending.pop()!;
    if (seen.has(runtimeFile)) continue;
    seen.add(runtimeFile);

    const text = await fs.readFile(path.join(packageRoot, runtimeFile), 'utf8');
    const importMatches = text.matchAll(/(?:import|export)\s+(?:[^'"]*?from\s*)?['"](\.\/[^'"]+)['"]/g);
    for (const match of importMatches) {
      const specifier = match[1].endsWith('.js') ? match[1] : `${match[1]}.js`;
      const resolved = path.normalize(path.join(path.dirname(runtimeFile), specifier));
      try {
        await fs.access(path.join(packageRoot, resolved));
      } catch {
        continue;
      }
      pending.push(resolved);
    }
  }
  return [...seen].sort();
}

test('confirm type accepts inline auto-accept callbacks', () => {
  const confirm: Confirm = (params) => params.body;
  expect(confirm({title: 'Apply SQL?', body: 'select 1;'})).toBe('select 1;');
});
