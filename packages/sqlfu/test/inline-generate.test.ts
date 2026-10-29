import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import dedent from 'dedent';
import {createNodeHost} from '../src/node/host.js';
import {generateInlineConfigTypes} from '../src/typegen/index.js';
import {createTempFixtureRoot, writeFixtureFiles} from './fs-fixture.js';

test('one failing query does not abort type generation for the others', async () => {
  const root = await createTempFixtureRoot('inline-generate-partial');
  const modulePath = path.join(root, 'post-module.ts');
  await writeFixtureFiles(root, {
    'post-module.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      export const app = defineConfig({
        definitions: sql\`
          create table posts (slug text primary key not null);
        \`,
        migrations: [],
        queries: {
          listPosts: sql\`
            select slug from posts
          \`,
          brokenQuery: sql\`
            selec slug from posts
          \`,
        },
      });
    `,
  });
  const host = await createNodeHost();

  // The bad query should be reported (by name), but the good query's types
  // should still be written — in watch mode especially, one mid-edit typo must
  // not stale every other query's types.
  await expect(generateInlineConfigTypes({modulePath, projectRoot: root, host})).rejects.toThrow(/brokenQuery/);

  const updated = await fs.readFile(modulePath, 'utf8');
  expect(updated).toContain('sql.many<{ result: { slug: string } }>');
});

test('generate rejects .map on a query that returns no rows instead of writing a self-invalidating tag', async () => {
  const root = await createTempFixtureRoot('inline-generate-map-on-rowless');
  const modulePath = path.join(root, 'post-module.ts');
  await writeFixtureFiles(root, {
    'post-module.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      export const app = defineConfig({
        definitions: sql\`
          create table posts (slug text primary key not null);
        \`,
        migrations: [],
        queries: {
          deleteAllPosts: sql\`
            delete from posts
          \`.map((row) => row),
        },
      });
    `,
  });
  const host = await createNodeHost();
  const original = await fs.readFile(modulePath, 'utf8');

  // The parser rejects .map(...) on sql.run queries, so writing the run tag
  // while keeping the .map call would corrupt the module: every subsequent
  // command — including the next watch-mode generate — would fail to parse
  // the file generate itself just wrote.
  await expect(generateInlineConfigTypes({modulePath, projectRoot: root, host})).rejects.toThrow(
    /deleteAllPosts[\s\S]*\.map/,
  );
  await expect(fs.readFile(modulePath, 'utf8')).resolves.toBe(original);
});
