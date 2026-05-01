# Type generation

`sqlfu generate` reads checked-in `.sql` files and emits TypeScript wrappers under
`sql/.generated/`. The generated function name normally comes from the file path:
`sql/get-post.sql` becomes `getPost`.

```sql
-- sql/get-post.sql
select id, slug, title
from posts
where id = :id;
```

```ts
import {getPost} from './sql/.generated/get-post.sql';

const post = await getPost(client, {id: 123});
```

## Multiple queries in one file

Put `@name` in a block comment before each query when one `.sql` file contains more
than one query.

```sql
/** @name listPosts */
select id, slug, title
from posts
order by id;

/** @name findPostBySlug */
select id, slug, title
from posts
where slug = :slug;
```

This emits one generated module, `sql/.generated/posts.sql.ts`, with both
`listPosts` and `findPostBySlug` exports. If a file uses `@name`, every executable
statement in that file must have its own `@name`.

## Parameter forms

Plain params use sqlfu's normal `:name` placeholder syntax.

```sql
/** @name getPost */
select id, slug, title
from posts
where id = :id;
```

```ts
await getPost(client, {id: 123});
```

Use `IN (:ids)` or `NOT IN (:ids)` when one scalar param should expand into a
comma-separated placeholder list. TypeSQL infers the array type from the `IN`
operator, and sqlfu uses that inferred type to expand the runtime placeholders.

```sql
/** @name listPostsByIds */
select id, slug, title
from posts
where id in (:ids)
order by id;
```

```ts
await listPostsByIds(client, {ids: [1, 2, 3]});
```

At runtime sqlfu executes `where id in (?, ?, ?)` with `[1, 2, 3]`. Empty arrays
throw before the query reaches SQLite.

Use dot paths when a query naturally accepts one object.

```sql
/** @name insertPost */
insert into posts (slug, title)
values (:post.slug, :post.title)
returning id, slug, title;
```

```ts
await insertPost(client, {
  post: {
    slug: 'hello-world',
    title: 'Hello world',
  },
});
```

The generated params type is `{post: {slug: string; title: string}}`. One object
path segment is supported today; nested paths such as `:post.author.id` are
intentionally rejected until the type shape is designed.

Use an object param directly after `values` when an INSERT column list already
names the object fields. The generated param accepts either one object or a
non-empty array.

```sql
/** @name insertPosts */
insert into posts (slug, title)
values :posts;
```

```ts
await insertPosts(client, {
  posts: {slug: 'first', title: 'First'},
});

await insertPosts(client, {
  posts: [
    {slug: 'second', title: 'Second'},
    {slug: 'third', title: 'Third'},
  ],
});
```

At runtime sqlfu executes `values (?, ?)` for one object or `values (?, ?), (?, ?)`
for an array, and flattens values in the INSERT column-list order. Empty arrays
throw. This inferred INSERT shorthand does not support `RETURNING` yet; use
explicit dot-path values such as `values (:post.slug, :post.title)` for returning
single-row inserts.

Row-value `IN` lists also infer object-array params from the left-hand column
tuple.

```sql
/** @name listPostsByKeys */
select id, slug, title
from posts
where (slug, title) in (:keys)
order by id;
```

```ts
await listPostsByKeys(client, {
  keys: [
    {slug: 'first', title: 'First'},
    {slug: 'third', title: 'Third'},
  ],
});
```

## Typed JSON columns

Columns declared as `json` are serialized as JSON text and exposed as `unknown`.
For a stronger shape, add a reserved `sqlfu_types` metadata table to
`definitions.sql` and declare app columns with one of its `json_*` logical type
names.

```sql
create table sqlfu_types(
  json_slack_payload text default '{ "action": "''message'' | ''reaction''", "content": "string" }'
);

create table slack_webhooks(
  id integer primary key,
  payload json_slack_payload not null
);
```

The default value must be strict JSON. Object keys become TypeScript field names;
string values are Arktype-style type expressions. The example above generates a
payload type like this:

```ts
{
  action: 'message' | 'reaction';
  content: string;
}
```

Generated wrappers still store the value as JSON text in SQLite. Inputs are
validated, then `JSON.stringify`-ed before the driver call. Result rows are
`JSON.parse`-d before returning and before result validation. The configured
validator target can still be `arktype`, `valibot`, `zod`, or `zod-mini`.

The first slice supports `json_*` logical types stored as `text`. Generating the
SQL metadata table from TypeScript definitions, serializing runtime Arktype
`Type` instances, and non-JSON branded scalar types are future work.

## Limits

- Runtime-expanded params, currently inferred scalar `IN` lists, row-value `IN`
  lists, and INSERT `values :param` objects, can appear only
  once in a query. Reusing the same expanded array in two places would require
  duplicating the driver arguments, so sqlfu rejects that shape for now.
- Columns declared with the SQLite type name `json` get narrow logical-type
  handling: generated wrappers accept `unknown`, stringify JSON inputs before
  driver calls, and parse selected JSON result columns on the way out. Use
  `sqlfu_types` when a JSON column needs a precise generated object shape.
- Parameter shape is inferred from SQL shape, not comment metadata. `@name` names
  queries; `IN (:ids)`, `(slug, title) in (:keys)`, and `values :posts` describe
  runtime placeholder expansion where the SQL shape changes.
