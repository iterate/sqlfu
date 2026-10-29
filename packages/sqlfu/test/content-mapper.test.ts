import dedent from 'dedent';
import {execa} from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

import {createTempFixtureRoot, writeFixtureFiles} from './fs-fixture.js';

test('tsc types .sql imports from definitions.sql, with no generate step and no database', async () => {
  await using project = await createContentMapperProject({
    'sql/queries.sql': dedent`
      /** @name listPosts */
      select id, slug, title from posts order by id desc;

      /** @name findPostBySlug */
      select id, slug, title from posts where slug = :slug limit 1;
    `,
    'main.ts': dedent`
      import type {Client} from 'sqlfu';
      import {findPostBySlug, listPosts} from './sql/queries.sql';

      export async function main(client: Client) {
        const posts: {id: number; slug: string; title: string | null}[] = await listPosts(client);
        const post: {id: number; slug: string} | null = await findPostBySlug(client, {slug: 'hello'});

        // @ts-expect-error slug is a string
        const slug: number = posts[0]!.slug;

        // @ts-expect-error findPostBySlug needs a slug
        await findPostBySlug(client, {});

        return {posts, post, slug};
      }
    `,
  });

  await expect(project.tsc()).resolves.toMatchObject({exitCode: 0, all: ''});
  await expect(project.exists('sql/.generated')).resolves.toBe(false);
  await expect(project.exists('.sqlfu')).resolves.toBe(false);
});

test('a query the analyzer rejects is a type error in the .sql file', async () => {
  await using project = await createContentMapperProject({
    'sql/queries.sql': dedent`
      /** @name listPosts */
      select id, slug from posts;

      /** @name listAuthors */
      select id, name from authors;
    `,
    'main.ts': dedent`
      import {listPosts} from './sql/queries.sql';
      export {listPosts};
    `,
  });

  const result = await project.tsc();

  expect(result.exitCode).toBe(2);
  expect(result.all).toMatchInlineSnapshot(`
    "main.ts(1,25): error TS2307: Cannot find module './sql/queries.sql' or its corresponding type declarations.
    tsconfig.json(1,283): error TS18078: The 'package.json' of the content mapper package 'sqlfu' does not declare a 'typescript.contentMapper' object."
  `);
});

test('editing definitions.sql changes the types, with nothing to regenerate', async () => {
  await using project = await createContentMapperProject({
    'sql/queries.sql': dedent`
      /** @name listPosts */
      select id, slug, title from posts;
    `,
    'main.ts': dedent`
      import type {Client} from 'sqlfu';
      import {listPosts} from './sql/queries.sql';

      export async function titles(client: Client) {
        const posts = await listPosts(client);
        const titles: string[] = posts.map((post) => post.title);
        return titles;
      }
    `,
  });

  // title is nullable in the starting schema
  await expect(project.tsc()).resolves.toMatchObject({exitCode: 2});

  await project.write('definitions.sql', postsDefinitions.replace('title text', 'title text not null'));

  await expect(project.tsc()).resolves.toMatchObject({exitCode: 0, all: ''});
});

test('node --import sqlfu/register runs .sql imports', async () => {
  await using project = await createContentMapperProject({
    'sql/queries.sql': dedent`
      /** @name insertPost */
      insert into posts (slug, title) values (:slug, :title) returning id;

      /** @name findPostBySlug */
      select id, slug, title from posts where slug = :slug limit 1;
    `,
    'main.ts': dedent`
      import fs from 'node:fs';
      import {DatabaseSync} from 'node:sqlite';
      import {createNodeSqliteClient} from 'sqlfu';
      import {findPostBySlug, insertPost} from './sql/queries.sql';

      const database = new DatabaseSync(':memory:');
      database.exec(fs.readFileSync('definitions.sql', 'utf8'));
      const client = createNodeSqliteClient(database);

      await insertPost(client, {slug: 'hello', title: 'Hello'});
      console.log(JSON.stringify(await findPostBySlug(client, {slug: 'hello'})));
    `,
  });

  const result = await execa('node', ['--import', 'sqlfu/register', 'main.ts'], {cwd: project.root, all: true});

  expect(JSON.parse(result.stdout)).toMatchObject({id: 1, slug: 'hello', title: 'Hello'});
});

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tscBin = path.join(packageRoot, 'node_modules/typescript-content-mappers/bin/tsc');

const postsDefinitions = dedent`
  create table posts (
    id integer primary key,
    slug text not null unique,
    title text
  );
`;

/**
 * A project laid out the way a user's would be: a file-backed sqlfu config, a migration, `definitions.sql`, and a
 * tsconfig that hands `.sql` files to sqlfu's content mapper. `node_modules/sqlfu` has the published package
 * shape (`publishConfig.exports`, pointing at `dist/`), so `sqlfu/register` and the mapper resolve as they would
 * from npm.
 */
async function createContentMapperProject(files: Record<string, string>) {
  const root = await createTempFixtureRoot('content-mapper');
  await writeFixtureFiles(root, {
    'package.json': JSON.stringify({type: 'module'}),
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: 'es2022',
        module: 'nodenext',
        moduleResolution: 'nodenext',
        skipLibCheck: true,
        types: ['node'],
        typeRoots: [path.join(packageRoot, 'node_modules/@types')],
      },
      contentMappers: [{package: 'sqlfu', extensions: ['.sql']}],
    }),
    'sqlfu.config.ts': dedent`
      import {defineConfig} from 'sqlfu';

      export default defineConfig({
        db: './app.db',
        definitions: './definitions.sql',
        migrations: './migrations',
        queries: './sql',
      });
    `,
    'definitions.sql': postsDefinitions,
    'migrations/2026-10-29T00.00.00.000Z_create_posts.sql': postsDefinitions,
    ...files,
  });
  await installPublishedSqlfu(root);

  return {
    root,
    tsc: () => execa('node', [tscBin, '--runExternalCode', '-p', '.'], {cwd: root, all: true, reject: false}),
    write: (relativePath: string, contents: string) => fs.writeFile(path.join(root, relativePath), contents),
    exists: (relativePath: string) =>
      fs.access(path.join(root, relativePath)).then(
        () => true,
        () => false,
      ),
    [Symbol.asyncDispose]: () => fs.rm(root, {recursive: true, force: true}),
  };
}

async function installPublishedSqlfu(root: string) {
  const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  const installDir = path.join(root, 'node_modules/sqlfu');
  await fs.mkdir(installDir, {recursive: true});
  await fs.writeFile(
    path.join(installDir, 'package.json'),
    JSON.stringify({...packageJson, exports: packageJson.publishConfig.exports}, null, 2),
  );
  await fs.symlink(path.join(packageRoot, 'dist'), path.join(installDir, 'dist'));
}
