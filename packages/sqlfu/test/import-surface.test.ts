import {expect, test} from 'vitest';
import {checkStrictImports, formatViolations} from '../scripts/check-strict-imports.js';

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
