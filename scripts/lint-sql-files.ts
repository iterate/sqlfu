#!/usr/bin/env tsx

/*
 * Dogfoods the `format-sql` lint rule on standalone `.sql` files in the repo.
 *
 * ESLint/oxlint only parse JS/TS, so the `sqlfu/format-sql` rule only fires
 * on inline SQL template literals. This script runs the same underlying
 * formatter (`formatSqlFileContents` from `sqlfu/lint-plugin`) on every
 * checked-in `.sql` file whose content is meant to be real SQL (i.e. queries,
 * definitions, and migrations — not formatter/schemadiff fixture files,
 * which deliberately contain before/after blocks with malformed input).
 *
 * Usage:
 *   tsx scripts/lint-sql-files.ts          # report mismatches, exit 1 if any
 *   tsx scripts/lint-sql-files.ts --fix    # rewrite files in place
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {formatSqlFileContents} from '../packages/sqlfu/src/lint-plugin.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Ignore globs are anchored to the repo root. Fixture files contain
// intentionally-unformatted SQL (before/after blocks, malformed input) and
// must not be rewritten. Generated SQL output is also skipped — the
// generator owns its formatting.
const ignorePatterns = [
  /\/node_modules\//,
  /\/dist\//,
  /\/\.generated\//,
  /\/packages\/sqlfu\/test\/formatter\//,
  /\/packages\/sqlfu\/test\/schemadiff\/fixtures\//,
  /\/packages\/sqlfu\/src\/vendor\//,
];

const fix = process.argv.includes('--fix');

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});

async function main() {
  const files = await walkSqlFiles(repoRoot);
  const mismatches: {path: string; before: string; after: string}[] = [];

  for (const file of files) {
    const contents = await fs.readFile(file, 'utf8');
    const formatted = formatSqlFileContents(contents);
    if (formatted !== contents) {
      mismatches.push({path: file, before: contents, after: formatted});
    }
  }

  if (mismatches.length === 0) {
    console.log(`sqlfu/format-sql (files): ${files.length} .sql file(s) already formatted`);
    return;
  }

  if (fix) {
    for (const mismatch of mismatches) {
      await fs.writeFile(mismatch.path, mismatch.after);
    }
    console.log(`sqlfu/format-sql (files): rewrote ${mismatches.length} file(s)`);
    for (const mismatch of mismatches) {
      console.log(`  ${path.relative(repoRoot, mismatch.path)}`);
    }
    return;
  }

  console.error(`sqlfu/format-sql (files): ${mismatches.length} file(s) need formatting`);
  for (const mismatch of mismatches) {
    console.error(`  ${path.relative(repoRoot, mismatch.path)}`);
  }
  console.error(`\nRun 'pnpm lint:fix:sql' to rewrite them.`);
  process.exit(1);
}

async function walkSqlFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (ignorePatterns.some((pattern) => pattern.test(full))) continue;
    if (entry.isDirectory()) {
      out.push(...(await walkSqlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.sql')) {
      out.push(full);
    }
  }
  return out;
}
