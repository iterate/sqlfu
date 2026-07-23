#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$repo_root"

echo "==> Building sqlfu exactly the way the workspace build does"
pnpm --filter sqlfu build

echo
echo "==> Checking whether the built root import graph parses as ES2022"

cd "$repo_root/packages/sqlfu"

node --input-type=module <<'NODE'
import fs from 'node:fs/promises';
import path from 'node:path';

import {build} from 'esbuild';
import {Linter} from 'eslint';

const packageRoot = process.cwd();
const distRoot = path.join(packageRoot, 'dist') + path.sep;
const entryPoint = path.join(packageRoot, 'dist/index.js');

const graph = await build({
  entryPoints: [entryPoint],
  bundle: true,
  format: 'esm',
  logLevel: 'silent',
  metafile: true,
  packages: 'external',
  platform: 'node',
  target: 'esnext',
  write: false,
});

const distFiles = Object.keys(graph.metafile.inputs)
  .map((input) => path.resolve(packageRoot, input))
  .filter((input) => input.startsWith(distRoot) && input.endsWith('.js'))
  .sort((left, right) => left.localeCompare(right));

const linter = new Linter();
const failures = [];

for (const filePath of distFiles) {
  const code = await fs.readFile(filePath, 'utf8');
  const messages = linter.verify(
    code,
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {},
    },
    {filename: path.relative(packageRoot, filePath)},
  );
  const fatal = messages.find((message) => message.fatal);
  if (fatal) {
    const sourceLine = code.split('\n')[fatal.line - 1]?.trim() || '';
    failures.push({
      column: fatal.column,
      filePath,
      line: fatal.line,
      message: fatal.message,
      sourceLine,
    });
  }
}

if (failures.length === 0) {
  console.log(`OK: ${distFiles.length} built files reachable from dist/index.js parse as ES2022.`);
  process.exit(0);
}

const lowered = await build({
  entryPoints: [entryPoint],
  bundle: true,
  format: 'esm',
  logLevel: 'silent',
  packages: 'external',
  platform: 'node',
  target: 'es2022',
  write: false,
});
const loweredMessages = linter.verify(
  lowered.outputFiles[0].text,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {},
  },
  {filename: 'dist/index.es2022-bundle.js'},
);
const loweredFatal = loweredMessages.find((message) => message.fatal);

console.error('FAIL: built sqlfu root import graph contains syntax that an ES2022 parser rejects.');
console.error(`Checked ${distFiles.length} built files reachable from dist/index.js.`);
console.error('');
console.error('First failures:');
for (const failure of failures.slice(0, 10)) {
  console.error(
    `- ${path.relative(packageRoot, failure.filePath)}:${failure.line}:${failure.column} ${failure.message}`,
  );
  console.error(`  ${failure.sourceLine}`);
}
console.error('');
if (loweredFatal) {
  console.error('The esbuild target=es2022 probe also failed, so this repro does not prove a build-transform fix.');
  console.error(`- ${loweredFatal.line}:${loweredFatal.column} ${loweredFatal.message}`);
} else {
  console.error('An esbuild target=es2022 probe of the same root graph parses successfully.');
  console.error('That suggests the eventual fix can live in pnpm build as a dist transform instead of source edits.');
}

process.exit(1);
NODE
