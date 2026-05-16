# Kysely

Use this when Kysely is already your query builder and you want sqlfu for the
parts Kysely deliberately leaves close to the database: SQL schema files,
migration drafting, migration checks, and checked-in SQL wrappers for queries
that read better as SQL than as a builder chain.

The split is:

- `definitions.sql` is the schema you want.
- sqlfu drafts and checks migrations from that schema.
- Kysely owns ad-hoc query building in application code.
- `sqlfu generate` owns wrappers for hand-written `.sql` files.

## Let Kysely keep its table interface

Kysely's type safety starts with the database type passed to `Kysely<DB>`.
That table interface is not just a selected row type: Kysely uses helpers such
as `Generated`, `Insertable`, and `Updateable` so insert and update shapes can
differ from select rows.

Keep that interface explicit when a table has generated columns or different
insert/update behavior:

```ts
import type {Generated, Insertable, Selectable, Updateable} from 'kysely';

export interface Database {
  posts: PostsTable;
}

export type PostsTable = {
  id: Generated<number>;
  slug: string;
  title: string;
  published_at: string | null;
};

export type Post = Selectable<PostsTable>;
export type NewPost = Insertable<PostsTable>;
export type PostPatch = Updateable<PostsTable>;
```

sqlfu's generated `tables.ts` row types are still useful as a cross-check and
for places that want the selected row shape:

```ts
import type {PostsRow} from './sql/.generated/tables.ts';

const fromSqlfu: PostsRow = {
  id: 1,
  slug: 'hello',
  title: 'Hello',
  published_at: null,
};
```

Do not blindly use `PostsRow` as Kysely's table type if the table has generated
columns. `PostsRow['id']` is the selected value type (`number`), while Kysely
needs `Generated<number>` to know `id` is optional on insert.

## Keep raw SQL where it pays for itself

Use Kysely for composable, application-shaped query building:

```ts
const posts = await db
  .selectFrom('posts')
  .select(['id', 'slug', 'title'])
  .where('published_at', 'is not', null)
  .orderBy('id')
  .execute();
```

Use `.sql` files when the SQL itself is the clearest artifact to review:

```sql
-- sql/queries.sql
/** @name listPublishedPosts */
select id, slug, title
from posts
where published_at is not null
order by id;
```

```ts
import {listPublishedPosts} from './sql/.generated/queries.sql.ts';

const posts = await listPublishedPosts(sqlfuClient);
```

That default generated wrapper takes a sqlfu client. If the production app
should not import `sqlfu`, set a native runtime target instead.

## Generate wrappers for the driver you already use

For SQLite runtimes, `generate.runtime` can emit wrappers that call the driver
directly:

```ts
export default {
  db: './app.db',
  definitions: './definitions.sql',
  migrations: './migrations',
  queries: './sql',
  generate: {
    runtime: 'better-sqlite3',
  },
};
```

Generated query modules import only the driver type:

```ts
import Database from 'better-sqlite3';
import {Kysely, SqliteDialect} from 'kysely';
import {listPublishedPosts} from './sql/.generated/queries.sql.ts';

import type {Database as AppDatabase} from './database.ts';

const sqlite = new Database('app.db');

export const db = new Kysely<AppDatabase>({
  dialect: new SqliteDialect({database: sqlite}),
});

const posts = listPublishedPosts(sqlite);
```

Native generated runtime targets:

- `node:sqlite`
- `better-sqlite3`
- `bun:sqlite`
- `libsql`
- `@libsql/client`

The sync drivers produce sync wrappers. `@libsql/client` produces async wrappers.
Those generated files keep the `sql`, `query`, `Params`, `Data`, `Result`, and
`mapResult` surface, but they do not import `sqlfu`. Native runtime targets are
experimental and cannot be combined with `generate.validator` yet.

## References

- [Kysely type safety](https://kysely-org-kysely.mintlify.app/core-concepts/type-safety)
- [Kysely `Generated`](https://kysely-org.github.io/kysely-apidoc/types/Generated.html)
- [Kysely `Insertable`](https://kysely-org.github.io/kysely-apidoc/types/Insertable.html)
- [Kysely `Updateable`](https://kysely-org.github.io/kysely-apidoc/types/Updateable.html)
