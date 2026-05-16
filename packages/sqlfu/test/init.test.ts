import {expect, test} from 'vitest';

import {createSqlfuApi} from '../src/api/core.js';
import {createNodeHost} from '../src/node/host.js';
import {createTempFixtureRoot, dumpFixtureFs} from './fs-fixture.js';

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
  expect(files).toContain('.gitkeep');
});
