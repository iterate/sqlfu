// Vitest globalSetup. Runs once per `vitest` invocation, before any
// worker starts, so the filesystem-touching build steps aren't racing
// across workers.
//
// `ensureBuilt` / `ensureBuiltFull` still memoize within a worker for
// cheap re-use; this hook exists to guarantee the vendor bundle +
// analyze shim land in dist before parallel test files start reading
// from it. Without this, tests that `rm -rf dist/vendor` (via
// build:vendor-typesql) can race adapter tests loading other dist
// artifacts.

import {execa} from 'execa';
import {existsSync} from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(path.dirname(import.meta.filename), '..');

export default async function setup() {
  const sentinel = path.join(packageRoot, 'dist/typegen/analyze-vendored-typesql-with-client.js');
  if (existsSync(sentinel)) {
    // dist is already in the post-full-build state — assume CI / the
    // developer ran `pnpm build` recently enough.
    return;
  }
  await execa('pnpm', ['build'], {cwd: packageRoot, stdio: 'inherit'});
}
