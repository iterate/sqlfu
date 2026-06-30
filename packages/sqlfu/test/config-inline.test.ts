import {DatabaseSync} from 'node:sqlite';
import {expect, expectTypeOf, test} from 'vitest';

import {createNodeSqliteClient, defineConfig, sql, type QueryMetadata, type SyncClient} from '../src/index.js';

test('defineConfig accepts compact generated query tags', () => {
  using fixture = createInlineConfigFixture();

  class PostObject {
    static dbConfig = defineConfig({
      definitions: sql`
        create table posts (slug text primary key, title text not null);
      `,
      migrations: [
        {
          name: '0001_create_posts',
          content: sql`
            create table posts (slug text primary key, title text not null);
          `,
        },
      ],
      queries: {
        listPosts: sql.many<{parameters: {limit: number}; result: {slug: string; title: string}}>`
          select slug, title
          from posts
          order by slug
          limit :limit
        `,
        createPost: sql.run<{parameters: {slug: string; title: string}}>`
          insert into posts (slug, title)
          values (:slug, :title)
        `,
      },
    });

    db: ReturnType<typeof PostObject.dbConfig<SyncClient>>;

    constructor(client: SyncClient) {
      this.db = PostObject.dbConfig(client);
    }
  }

  const postObject = new PostObject(fixture.client);
  postObject.db.migrate();

  const created: QueryMetadata = postObject.db.createPost({slug: 'hello-world', title: 'Hello, World!'});
  expect(created).toMatchObject({rowsAffected: 1});

  const posts: {slug: string; title: string}[] = postObject.db.listPosts({limit: 10});
  expect(posts).toEqual([{slug: 'hello-world', title: 'Hello, World!'}]);
});

test('defineConfig works with a class', () => {
  using fixture = createInlineConfigFixture();

  class PostObject {
    static dbConfig = defineConfig({
      definitions: sql`
        create table posts (slug text primary key, title text not null);
      `,
      migrations: [
        {
          name: '0001_create_posts',
          content: sql`
            create table posts (slug text primary key, title text not null);
          `,
        },
      ],
      queries: {
        listPosts: sql.many<{parameters: {limit: number}; result: {slug: string; title: string}}>`
          select slug, title
          from posts
          order by slug
          limit :limit
        `,
        createPost: sql.run<{parameters: {slug: string; title: string}}>`
          insert into posts (slug, title)
          values (:slug, :title)
        `,
      },
    });

    db: ReturnType<typeof PostObject.dbConfig<SyncClient>>;

    constructor(client: SyncClient) {
      this.db = PostObject.dbConfig(client);
    }
  }

  const postObject = new PostObject(fixture.client);

  postObject.db.migrate();
  const tables = fixture.client.all(sql`select name from sqlite_schema where type = 'table'`);
  expect(tables).toContainEqual({name: 'posts'});

  postObject.db.createPost({slug: 'hello-world', title: 'Hello, World!'});

  const rawPosts = fixture.client.all(sql`select slug, title from posts`);
  expect(rawPosts).toHaveLength(1);

  const posts = postObject.db.listPosts({limit: 10});

  expect(posts).toEqual(rawPosts);
  expect(posts).toMatchObject([{slug: 'hello-world'}]);

  postObject.db.createPost({slug: 'hello-world-2', title: 'Hello, World 2!'});

  const onePost = postObject.db.listPosts({limit: 1});
  expect(onePost).toHaveLength(1);
});

test('defineConfig works without having generated types yet', () => {
  using fixture = createInlineConfigFixture();

  class PostObject {
    static dbConfig = defineConfig({
      definitions: sql`
        create table posts (slug text primary key, title text not null);
      `,
      queries: {
        listPosts: sql.many`
          select slug, title from posts limit :limit
        `,
      },
    });

    db: ReturnType<typeof PostObject.dbConfig<SyncClient>>;

    constructor(client: SyncClient) {
      this.db = PostObject.dbConfig(client);
    }
  }

  const postObject = new PostObject(fixture.client);
  expectTypeOf(postObject.db.listPosts).toBeCallableWith({limit: 10});
});

test('defineConfig works with a class without migrations via sync(...)', async () => {
  using fixture = createInlineConfigFixture();
  const {sync} = await import('../src/api/sync.js'); // separate import because it's a bit more heavyweight than the client adapters

  class PostObject {
    static dbConfig = defineConfig({
      definitions: sql`
        create table posts (slug text primary key, title text not null);
      `,
      queries: {
        listPosts: sql.many<{parameters: {limit: number}; result: {slug: string; title: string}}>`
          select slug, title
          from posts
          order by slug
          limit :limit
        `,
        createPost: sql.run<{parameters: {slug: string; title: string}}>`
          insert into posts (slug, title)
          values (:slug, :title)
        `,
      },
    });

    db: ReturnType<typeof PostObject.dbConfig<SyncClient>>;

    constructor(client: SyncClient) {
      this.db = PostObject.dbConfig(client);
    }
  }

  const postObject = new PostObject(fixture.client);

  sync(fixture.client, {definitions: PostObject.dbConfig.config.definitions.sql});
  const tables = fixture.client.all(sql`select name from sqlite_schema where type = 'table'`);
  expect(tables).toContainEqual({name: 'posts'});

  postObject.db.createPost({slug: 'hello-world', title: 'Hello, World!'});

  const rawPosts = fixture.client.all(sql`select slug, title from posts`);
  expect(rawPosts).toHaveLength(1);

  const posts = postObject.db.listPosts({limit: 10});

  expect(posts).toEqual(rawPosts);
  expect(posts).toMatchObject([{slug: 'hello-world'}]);

  postObject.db.createPost({slug: 'hello-world-2', title: 'Hello, World 2!'});

  const onePost = postObject.db.listPosts({limit: 1});
  expect(onePost).toHaveLength(1);
});

test('static inline defineConfig binds generated query methods to a sync client', () => {
  using fixture = createInlineConfigFixture();

  class PostObject {
    static dbConfig = defineConfig({
      definitions: sql`
        create table posts (slug text primary key, title text not null);
      `,
      migrations: [
        {
          name: '0001_create_posts',
          content: sql`
            create table posts (slug text primary key, title text not null);
          `,
        },
      ],
      queries: {
        listPosts: sql.many<{parameters: {limit: number}; result: {slug: string; title: string}}>`
          select slug, title
          from posts
          order by slug
          limit :limit
        `,
        findPost: sql.nullableOne<{parameters: {slug: string}; result: {slug: string; title: string}}>`
          select slug, title
          from posts
          where slug = :slug
        `,
        getPost: sql.one<{parameters: {slug: string}; result: {slug: string; title: string}}>`
          select slug, title
          from posts
          where slug = :slug
        `,
        createPost: sql.run<{parameters: {slug: string; title: string}}>`
          insert into posts (slug, title)
          values (:slug, :title)
        `,
      },
    });

    db: PostDatabase;

    constructor(client: SyncClient) {
      this.db = PostObject.dbConfig(client);
    }
  }

  type PostDatabase = ReturnType<typeof PostObject.dbConfig<SyncClient>>;

  const postObject = new PostObject(fixture.client);
  const migrated: void = postObject.db.migrate();

  expect(migrated).toBeUndefined();
  const tables = fixture.client.all(sql`select name from sqlite_schema where type = 'table' order by name`);
  expect(tables).toContainEqual({name: 'posts'});

  const missingPost: {slug: string; title: string} | null = postObject.db.findPost({slug: 'hello-world'});
  expect(missingPost).toBeNull();

  const created: QueryMetadata = postObject.db.createPost({slug: 'hello-world', title: 'Hello, World!'});
  expect(created).toMatchObject({rowsAffected: 1});

  const posts: {slug: string; title: string}[] = postObject.db.listPosts({limit: 10});
  expect(posts).toEqual([{slug: 'hello-world', title: 'Hello, World!'}]);

  const foundPost: {slug: string; title: string} | null = postObject.db.findPost({slug: 'hello-world'});
  expect(foundPost).toEqual({slug: 'hello-world', title: 'Hello, World!'});

  const requiredPost: {slug: string; title: string} = postObject.db.getPost({slug: 'hello-world'});
  expect(requiredPost).toEqual({slug: 'hello-world', title: 'Hello, World!'});
});

test('inline queries can map row results', () => {
  using fixture = createInlineConfigFixture();

  const app = defineConfig({
    definitions: sql`
      create table posts (slug text primary key, title text not null);
    `,
    migrations: [
      {
        name: '0001_create_posts',
        content: sql`
          create table posts (slug text primary key, title text not null);
        `,
      },
    ],
    queries: {
      listPosts: sql.many<{result: {slug: string; title: string}}>`
        select slug, title
        from posts
        order by slug
      `.map((result) => ({slug: result.slug, headline: result.title})),
      getPostCount: sql.one<{result: {post_count: number}}>`
        select count(*) as post_count
        from posts
      `.map((result) => ({postCount: result.post_count})),
      findPost: sql.nullableOne<{parameters: {slug: string}; result: {slug: string; title: string}}>`
        select slug, title
        from posts
        where slug = :slug
      `.map((result) => ({slug: result.slug, headline: result.title})),
    },
  });

  const db = app(fixture.client);
  db.migrate();
  fixture.client.run(sql`insert into posts (slug, title) values ('hello-world', 'Hello, World!')`);

  const posts: {slug: string; headline: string}[] = db.listPosts();
  expect(posts).toEqual([{slug: 'hello-world', headline: 'Hello, World!'}]);

  const count: {postCount: number} = db.getPostCount();
  expect(count).toEqual({postCount: 1});

  const foundPost: {slug: string; headline: string} | null = db.findPost({slug: 'hello-world'});
  expect(foundPost).toEqual({slug: 'hello-world', headline: 'Hello, World!'});

  const missingPost: {slug: string; headline: string} | null = db.findPost({slug: 'missing'});
  expect(missingPost).toBeNull();
});

test('inline migrations and queries tolerate sql line comments', () => {
  using fixture = createInlineConfigFixture();

  const app = defineConfig({
    definitions: sql`
      create table posts (slug text primary key);
    `,
    migrations: [
      {
        name: '0001_create_posts',
        content: sql`
          -- create the posts table
          create table posts (slug text primary key);
        `,
      },
    ],
    queries: {
      listPosts: sql.many<{result: {slug: string}}>`
        -- list every post
        select slug
        from posts
        order by slug
      `,
    },
  });

  const db = app(fixture.client);
  db.migrate();

  // The runtime sql tag collapses whitespace; if the `--` comment swallows the
  // rest of the migration, the table never gets created even though the
  // migration is recorded as applied.
  const tables = fixture.client.all(sql`select name from sqlite_schema where type = 'table'`);
  expect(tables).toContainEqual({name: 'posts'});

  fixture.client.run(sql`insert into posts (slug) values ('hello-world')`);
  expect(db.listPosts()).toEqual([{slug: 'hello-world'}]);
});

test('defineConfig rejects configs that mix inline and file-backed shapes', () => {
  // Compile-time overloads already reject these; the runtime guard is for
  // untyped callers, who otherwise get a plain object back and a confusing
  // "db is not a function" far away from the config.
  expect(() =>
    defineConfig({
      definitions: sql`create table posts (slug text primary key)`,
      queries: './sql',
    } as any),
  ).toThrow(/mixes inline and file-backed/);

  expect(() =>
    defineConfig({
      definitions: './definitions.sql',
      queries: {listPosts: sql`select slug from posts`},
    } as any),
  ).toThrow(/mixes inline and file-backed/);
});

function createInlineConfigFixture() {
  const database = new DatabaseSync(':memory:');
  const client = createNodeSqliteClient(database);
  return {
    client,
    [Symbol.dispose]() {
      database.close();
    },
  };
}
