import fs from 'node:fs/promises';
import path from 'node:path';

import {expect, test} from 'vitest';

import {createSqlfuApi} from '../src/api/core.js';
import {loadProjectStateFrom} from '../src/node/config.js';
import {createNodeHost} from '../src/node/host.js';
import {generateInlineConfigTypes} from '../src/typegen/index.js';
import {createTempFixtureRoot, dumpFixtureFs, writeFixtureFiles} from './fs-fixture.js';

test('sqlfu init scaffold round-trips: the fresh project loads and generates', async () => {
  const root = await createTempFixtureRoot('init-command-roundtrip');
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  const configPath = path.join(root, 'sqlfu.config.ts');
  await expect(loadProjectStateFrom(root)).resolves.toMatchObject({
    initialized: true,
    inline: {modulePath: configPath},
  });

  await generateInlineConfigTypes({modulePath: configPath, projectRoot: root, host});
  const updated = await fs.readFile(configPath, 'utf8');
  expect(updated).toContain('listPosts: sql.many<');
});

test('init scaffolds companion files for the config the user actually confirms', async () => {
  const root = await createTempFixtureRoot('init-command-edited-to-file-backed');
  const host = await createNodeHost();

  // The confirm prompt is editable: the preview shown is the inline scaffold,
  // but the user replaces it with a file-backed config. The companion files
  // must follow the confirmed contents, not the preview.
  await createSqlfuApi({projectRoot: root, host}).init({
    confirm: async () =>
      [
        'export default {',
        `  migrations: './migrations',`,
        `  definitions: './definitions.sql',`,
        `  queries: './sql',`,
        '};',
      ].join('\n'),
  });

  const files = await dumpFixtureFs(root);
  expect(files).toContain('definitions.sql');
  expect(files).toContain('migrations/');
  expect(files).toContain('sql/');
});

test('init does not scaffold companion files when the user confirms an inline config', async () => {
  const root = await createTempFixtureRoot('init-command-edited-to-inline');
  const host = await createNodeHost();

  // Reverse of the above: a file-backed preview (the Admin UI default) edited
  // into an inline config must not leave stray definitions.sql/migrations/sql.
  await createSqlfuApi({projectRoot: root, initPreviewFormat: 'file-backed', host}).init({
    confirm: async () =>
      [
        `import {defineConfig, sql} from 'sqlfu';`,
        '',
        'export default defineConfig({',
        '  definitions: sql`create table posts (slug text primary key)`,',
        '  queries: {',
        '    listPosts: sql`select slug from posts`,',
        '  },',
        '});',
      ].join('\n'),
  });

  const files = await dumpFixtureFs(root);
  expect(files).not.toContain('definitions.sql');
  expect(files).not.toContain('migrations/');
  expect(files).not.toContain('.gitkeep');
});

test('sqlfu init creates the default scaffold in a fresh directory', async () => {
  const root = await createTempFixtureRoot('init-command');
  const host = await createNodeHost();

  await createSqlfuApi({projectRoot: root, host}).init({confirm: async (params) => params.body});

  const files = await dumpFixtureFs(root);
  expect(files).toContain('sqlfu.config.ts');
  expect(files).toContain(`import {defineConfig, sql} from 'sqlfu';`);
  expect(files).toContain('export default defineConfig({');
  expect(files).toContain('definitions: sql`');
  expect(files).toContain('listPosts: sql`');
  expect(files).not.toContain('definitions.sql');
  expect(files).not.toContain('migrations/');
  expect(files).not.toContain('sql/');
  expect(files).not.toContain('db/');
  expect(files).not.toContain('db:');
  expect(files).toContain('.gitignore');
  expect(files).toContain('.sqlfu/');
  expect(files).not.toContain('.gitkeep');
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
