import {expect, test} from 'vitest';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

import {checkStrictImports, formatViolations} from '../scripts/check-strict-imports.js';
import type {Confirm} from '../src/api/exports.js';

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

test('built api entry exposes only the command facade', async () => {
  const apiEntry = path.join(packageRoot, 'dist/api/exports.js');
  const api = await import(pathToFileURL(apiEntry).href);
  expect(Object.keys(api).sort()).toEqual([
    'applied',
    'baseline',
    'check',
    'config',
    'createSqlfuApi',
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
    'sync',
  ]);
});

test('built api core entry exposes the host-explicit facade', async () => {
  const coreEntry = path.join(packageRoot, 'dist/api/core.js');
  const api = await import(pathToFileURL(coreEntry).href);
  expect(Object.keys(api).sort()).toEqual(['autoAcceptConfirm', 'createSqlfuApi']);
});

test('built node entry exposes only node helpers', async () => {
  const nodeEntry = path.join(packageRoot, 'dist/node/exports.js');
  const node = await import(pathToFileURL(nodeEntry).href);
  expect(Object.keys(node).sort()).toEqual(['findMiniflareD1Path']);
});

test('confirm type accepts inline auto-accept callbacks', () => {
  const confirm: Confirm = (params) => params.body;
  expect(confirm({title: 'Apply SQL?', body: 'select 1;'})).toBe('select 1;');
});
