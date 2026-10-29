// `sqlfu generate` should emit the same wrappers whichever dialect analyzed
// the queries. Each test generates one project twice, once with SQLite and
// once with `pgDialect`, and compares the wrapper signatures and namespace
// types. Schemas stick to `integer` and `text`, which map to the same
// TypeScript types in both dialects.
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generate} from 'sqlfu/api';
import {expect, test} from 'vitest';

import {TEST_ADMIN_URL} from './pg-fixture.js';

const definitions = `
  create table posts (
    id integer primary key,
    slug text not null unique,
    title text not null,
    body text
  );
`;

test('limit 1 returns one row or null', async () => {
  const shapes = await generateWithBothDialects(`
    /** @name latestPost */
    select id, slug from posts order by id desc limit 1;
  `);

  expect(shapes.sqlite).toMatchInlineSnapshot(`
    "async function latestPost(client: Client): Promise<latestPost.Result | null>
    export namespace latestPost {
    	export type Result = {
    		id: number;
    		slug: string;
    	};
    }"
  `);
  expect(shapes.pg).toEqual(shapes.sqlite);
});

test('select without from returns one row or null', async () => {
  const shapes = await generateWithBothDialects(`
    /** @name answer */
    select 42 as answer;
  `);

  expect(shapes.sqlite).toMatchInlineSnapshot(`
    "async function answer(client: Client): Promise<answer.Result | null>
    export namespace answer {
    	export type Result = {
    		answer: number;
    	};
    }"
  `);
  expect(shapes.pg).toEqual(shapes.sqlite);
});

test('aggregate without group by returns one row or null', async () => {
  const shapes = await generateWithBothDialects(`
    /** @name newestPostId */
    select coalesce(max(id), 0) as newest from posts;
  `);

  expect(shapes.sqlite).toMatchInlineSnapshot(`
    "async function newestPostId(client: Client): Promise<newestPostId.Result | null>
    export namespace newestPostId {
    	export type Result = {
    		newest: number;
    	};
    }"
  `);
  expect(shapes.pg).toEqual(shapes.sqlite);
});

test('insert and delete with returning return the row', async () => {
  const shapes = await generateWithBothDialects(`
    /** @name insertPost */
    insert into posts (slug, title, body)
    values (:slug, :title, :body)
    returning id, slug;

    /** @name deletePost */
    delete from posts where id = :id returning id, slug;
  `);

  expect(shapes.sqlite).toMatchInlineSnapshot(`
    "async function insertPost(client: Client, params: insertPost.Params): Promise<insertPost.Result>
    export namespace insertPost {
    	export type Params = {
    		slug: string;
    		title: string;
    		body: string | null;
    	};
    	export type Result = {
    		id: number;
    		slug: string;
    	};
    }

    async function deletePost(client: Client, params: deletePost.Params): Promise<deletePost.Result>
    export namespace deletePost {
    	export type Params = {
    		id: number;
    	};
    	export type Result = {
    		id: number;
    		slug: string;
    	};
    }"
  `);
  expect(shapes.pg).toEqual(shapes.sqlite);
});

test('update with returning takes set values as data and returns the row', async () => {
  const shapes = await generateWithBothDialects(`
    /** @name retitlePost */
    update posts set title = :title where slug = :slug returning id, title;
  `);

  expect(shapes.sqlite).toMatchInlineSnapshot(`
    "async function retitlePost(client: Client, data: retitlePost.Data, params: retitlePost.Params): Promise<retitlePost.Result>
    export namespace retitlePost {
    	export type Data = {
    		title: string;
    	};
    	export type Params = {
    		slug: string;
    	};
    	export type Result = {
    		id: number;
    		title: string;
    	};
    }"
  `);
  expect(shapes.pg).toEqual(shapes.sqlite);
});

test('params compared in a where clause are not nullable', async () => {
  const shapes = await generateWithBothDialects(`
    /** @name postsByTitle */
    select id from posts where title = :title;

    /** @name postsByBody */
    select id from posts where body = :body;

    /** @name postsAfter */
    select id from posts where id > :id;
  `);

  expect(shapes.sqlite).toMatchInlineSnapshot(`
    "async function postsByTitle(client: Client, params: postsByTitle.Params): Promise<postsByTitle.Result[]>
    export namespace postsByTitle {
    	export type Params = {
    		title: string;
    	};
    	export type Result = {
    		id: number;
    	};
    }

    async function postsByBody(client: Client, params: postsByBody.Params): Promise<postsByBody.Result[]>
    export namespace postsByBody {
    	export type Params = {
    		body: string;
    	};
    	export type Result = {
    		id: number;
    	};
    }

    async function postsAfter(client: Client, params: postsAfter.Params): Promise<postsAfter.Result[]>
    export namespace postsAfter {
    	export type Params = {
    		id: number;
    	};
    	export type Result = {
    		id: number;
    	};
    }"
  `);
  expect(shapes.pg).toEqual(shapes.sqlite);
});

async function generateWithBothDialects(queries: string) {
  const root = await mkdtemp(join(tmpdir(), 'sqlfu-pg-parity-'));
  try {
    const pgDialectModule = new URL('../src/index.ts', import.meta.url).href;
    return {
      sqlite: await generateProject(
        join(root, 'sqlite'),
        queries,
        `export default {db: './app.db', definitions: './definitions.sql', queries: './sql'};`,
      ),
      pg: await generateProject(
        join(root, 'pg'),
        queries,
        [
          `import {pgDialect} from ${JSON.stringify(pgDialectModule)};`,
          `export default {definitions: './definitions.sql', queries: './sql', dialect: pgDialect({adminUrl: ${JSON.stringify(TEST_ADMIN_URL)}})};`,
        ].join('\n'),
      ),
    };
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

async function generateProject(projectRoot: string, queries: string, config: string) {
  await mkdir(join(projectRoot, 'sql'), {recursive: true});
  await writeFile(join(projectRoot, 'sqlfu.config.ts'), config);
  await writeFile(join(projectRoot, 'definitions.sql'), definitions);
  await writeFile(join(projectRoot, 'sql', 'queries.sql'), queries);
  await generate({projectRoot});
  return wrapperShapes(await readFile(join(projectRoot, 'sql', '.generated', 'queries.sql.ts'), 'utf8'));
}

/** Each wrapper's signature plus its `export namespace` types. Drops the SQL text, which differs (`?` vs `$1`). */
function wrapperShapes(source: string) {
  const namespaces = [...source.matchAll(/^export namespace (\w+) \{$[\s\S]*?^\}$/gm)];
  return namespaces
    .map(([namespace, name]) => {
      const signature = source.split('\n').find((line) => line.includes(`async function ${name}(`))!;
      return `${signature.trim().replace(/ \{$/, '')}\n${namespace}`;
    })
    .join('\n\n');
}
