import path from 'node:path';
import {expect, test} from 'vitest';

import dedent from 'dedent';
import {serve} from '../src/api/exports.js';
import {createTempFixtureRoot, writeFixtureFiles} from './fs-fixture.js';

test('serve rejects inline defineConfig modules up front instead of starting a broken server', async () => {
  const root = await createTempFixtureRoot('api-serve-inline');
  await writeFixtureFiles(root, {
    'post-module.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      export const app = defineConfig({
        definitions: sql\`
          create table posts (slug text primary key);
        \`,
        queries: {
          listPosts: sql\`select slug from posts\`,
        },
      });
    `,
  });

  // Guard against the red state leaking a listening server: if serve resolves,
  // stop it before asserting.
  const result: any = await serve({configPath: path.join(root, 'post-module.ts'), port: 0}).catch((error) => error);
  if (result && typeof result.stop === 'function') await result.stop();

  expect(result).toBeInstanceOf(Error);
  expect(String(result)).toMatch(/inline defineConfig modules support generate and draft/);
});
