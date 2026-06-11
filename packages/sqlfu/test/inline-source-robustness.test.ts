import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import dedent from 'dedent';
import {sql} from '../src/index.js';
import {loadProjectStateFromConfigPath} from '../src/node/config.js';
import {appendInlineMigration, parseInlineConfigSources} from '../src/node/inline-source.js';
import {createTempFixtureRoot, writeFixtureFiles} from './fs-fixture.js';

test('parses an inline config in a module containing regex literals and division', () => {
  // Plain template literal (not dedent) so the regex escapes below land in the
  // module source exactly as written here.
  const source = `
import {defineConfig, sql} from 'sqlfu';

const cleanName = (name: string) => name.replace(/['"]/g, '_');
const dedupeBraces = (value: string) => value.replace(/\\{+/g, '{');
const half = (limit: number) => limit / 2;

export const app = defineConfig({
  definitions: sql\`
    create table posts (slug text primary key);
  \`,
  queries: {
    listPosts: sql\`select slug from posts\`,
  },
});
`;

  const sources = parseInlineConfigSources('post-module.ts', source);
  expect(sources).toMatchObject([{name: 'app', queries: [{name: 'listPosts'}]}]);
});

test('a file-backed config containing a regex literal still loads', async () => {
  const root = await createTempFixtureRoot('inline-robustness-file-config');
  await writeFixtureFiles(root, {
    'sqlfu.config.ts': dedent`
      const cleanName = (name: string) => name.replace(/['"]/g, '_');

      export default {
        definitions: './definitions.sql',
        queries: './sql',
        db: () => {
          throw new Error(cleanName('unused in this test'));
        },
      };
    `,
    'definitions.sql': 'create table t (id integer primary key);',
    'sql/.gitkeep': '',
  });

  const project = await loadProjectStateFromConfigPath(path.join(root, 'sqlfu.config.ts'), root);
  expect(project).toMatchObject({initialized: true});
  expect('inline' in project).toBe(false);
});

test('a file-backed defineConfig call using spread is not misparsed as inline', () => {
  const source = dedent`
    import {defineConfig, sql} from 'sqlfu';

    const shared = {migrations: './migrations'};

    export default defineConfig({
      ...shared,
      definitions: './definitions.sql',
      queries: './sql',
      db: () => createClientThatRuns(sql\`pragma busy_timeout = 1000\`),
    });
  `;

  expect(parseInlineConfigSources('sqlfu.config.ts', source)).toEqual([]);
});

test('parses a compact query tag whose type argument contains an arrow function type', () => {
  const source = dedent`
    import {defineConfig, sql} from 'sqlfu';

    export const app = defineConfig({
      definitions: sql\`
        create table posts (slug text primary key);
      \`,
      queries: {
        listPosts: sql.many<{ result: { slug: string; render: () => string } }>\`
          select slug from posts
        \`,
      },
    });
  `;

  const sources = parseInlineConfigSources('post-module.ts', source);
  expect(sources).toMatchObject([{name: 'app', queries: [{name: 'listPosts'}]}]);
});

test('an inline config with hoisted definitions fails loudly instead of falling back to file-backed loading', () => {
  const source = dedent`
    import {defineConfig, sql} from 'sqlfu';

    const ddl = sql\`create table posts (slug text primary key);\`;

    export const app = defineConfig({
      definitions: ddl,
      queries: {
        listPosts: sql\`select slug from posts\`,
      },
    });
  `;

  // Silently returning no sources here means the CLI would dynamic-import the module
  // as a file-backed config and crash on e.g. `import 'cloudflare:workers'` with an
  // error naming neither the cause nor the fix.
  expect(() => parseInlineConfigSources('post-module.ts', source)).toThrow(/"definitions" is not a literal sql/);
});

test('appendInlineMigration keeps the separating comma out of trailing line comments', async () => {
  const root = await createTempFixtureRoot('inline-robustness-append');
  const modulePath = path.join(root, 'post-module.ts');
  await writeFixtureFiles(root, {
    'post-module.ts': dedent`
      import {defineConfig, sql} from 'sqlfu';

      export const app = defineConfig({
        definitions: sql\`create table posts (slug text primary key)\`,
        migrations: [
          {name: '0001_init', content: sql\`create table posts (slug text primary key)\`} // initial schema
        ],
        queries: {
          listPosts: sql\`select slug from posts\`
        }
      });
    `,
  });

  await appendInlineMigration(modulePath, {
    name: '0002_add_title',
    content: 'alter table posts add column title text;',
  });

  const output = await fs.readFile(modulePath, 'utf8');
  expect(output).toContain('}, // initial schema');
  expect(output).not.toContain('// initial schema,');
});

test('static SQL is decoded from template escapes so it matches the runtime SQL', () => {
  // Plain template literal (not dedent): \\\\ below cooks to \\ in the module
  // source, which the module's own runtime template would cook to a single \.
  const source = `
import {defineConfig, sql} from 'sqlfu';

export const app = defineConfig({
  definitions: sql\`create table files (path text primary key)\`,
  queries: {
    findEscaped: sql\`select 'a\\\\b' as x\`,
  },
});
`;

  const runtime = sql`select 'a\\b' as x`;
  const [inline] = parseInlineConfigSources('file-module.ts', source);
  expect(inline.queries[0].content.sql).toBe(runtime.sql);
});
