import {Linter} from 'eslint';
import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

const packageRoot = path.resolve(path.dirname(import.meta.filename), '..');

// Source uses `await using` (ES2026), which Node 22 and some consumer
// bundlers (e.g. Next.js) can't parse. Both build configs (tsconfig.build.json
// and src/vendor/tsconfig.build.json) target ES2025 so the published dist
// lowers it to try/finally.
test('published dist files parse as ES2025', async () => {
  const distFiles = (await fs.readdir(path.join(packageRoot, 'dist'), {recursive: true}))
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join('dist', file));
  expect(distFiles).toContain('dist/index.js');
  expect(distFiles).toContain('dist/vendor/migra/index.js');

  const linter = new Linter();
  const parseErrors = [];
  for (const file of distFiles) {
    const code = await fs.readFile(path.join(packageRoot, file), 'utf8');
    const messages = linter.verify(code, {languageOptions: {ecmaVersion: 2025, sourceType: 'module'}}, file);
    const fatal = messages.find((message) => message.fatal);
    if (fatal) {
      parseErrors.push(`${file}:${fatal.line}:${fatal.column} ${fatal.message}`);
    }
  }
  expect(parseErrors).toEqual([]);
});
