import {execa} from 'execa';
import path from 'node:path';

export const packageRoot = path.resolve(path.dirname(import.meta.filename), '../..');

let buildPromise: Promise<void> | undefined;

export function ensureBuilt() {
  buildPromise ??= execa('pnpm', ['build:runtime'], {
    cwd: packageRoot,
  }).then(() => undefined);

  return buildPromise;
}

