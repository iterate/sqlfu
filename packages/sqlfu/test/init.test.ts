import fs from 'node:fs/promises';
import path from 'node:path';

import {expect, test} from 'vitest';

import {createSqlfuApi} from '../src/api/core.js';
import {createNodeHost} from '../src/node/host.js';
import {createTempFixtureRoot, dumpFixtureFs, writeFixtureFiles} from './fs-fixture.js';

test('sqlfu init creates the default scaffold in a fresh directory', async () => {
  const root = await createTempFixtureRoot('init-command');
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  const files = await dumpFixtureFs(root);
  expect(files).toContain('sqlfu.config.ts');
  expect(files).toContain('definitions.sql');
  expect(files).toContain('migrations/');
  expect(files).toContain('sql/');
  expect(files).toContain(`migrations: './migrations'`);
  expect(files).toContain(`definitions: './definitions.sql'`);
  expect(files).toContain(`queries: './sql'`);
  expect(files).not.toContain('db/');
  expect(files).not.toContain('db:');
  expect(files).toContain('.gitignore');
  expect(files).toContain('.sqlfu/');
  expect(files).toContain('.gitkeep');
});

test('sqlfu init appends local sqlfu artifacts to an existing gitignore', async () => {
  const root = await createTempFixtureRoot('init-command-gitignore');
  await writeFixtureFiles(root, {
    '.gitignore': 'node_modules/\n',
  });
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  await expect(fs.readFile(path.join(root, '.gitignore'), 'utf8')).resolves.toBe('node_modules/\n.sqlfu/\n');
});

test('sqlfu init does not duplicate the local sqlfu artifacts gitignore entry', async () => {
  const root = await createTempFixtureRoot('init-command-gitignore-existing');
  await writeFixtureFiles(root, {
    '.gitignore': 'node_modules/\n.sqlfu/\n',
  });
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  await expect(fs.readFile(path.join(root, '.gitignore'), 'utf8')).resolves.toBe('node_modules/\n.sqlfu/\n');
});

test('sqlfu init preserves gitignore line endings when appending local artifacts', async () => {
  const root = await createTempFixtureRoot('init-command-gitignore-crlf');
  await writeFixtureFiles(root, {
    '.gitignore': 'node_modules/\r\ndist/\r\n',
  });
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  await expect(fs.readFile(path.join(root, '.gitignore'), 'utf8')).resolves.toBe(
    'node_modules/\r\ndist/\r\n.sqlfu/\r\n',
  );
});

test('sqlfu init writes the local artifacts entry without a leading blank line in an empty gitignore', async () => {
  const root = await createTempFixtureRoot('init-command-gitignore-empty');
  await fs.writeFile(path.join(root, '.gitignore'), '');
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  await expect(fs.readFile(path.join(root, '.gitignore'), 'utf8')).resolves.toBe('.sqlfu/\n');
});
