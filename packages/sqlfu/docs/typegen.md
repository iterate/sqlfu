# Type generation from SQL

`sqlfu generate` reads checked-in `.sql` files and emits TypeScript wrappers under
`sql/.generated/`. The generated function name normally comes from the file path:
`sql/get-post.sql` becomes `getPost`.

The goal is to write the data-access layer in plain SQL, then call it from
TypeScript with inferred params and rows.

```sql
-- sql/get-post.sql
select id, slug, title
from posts
where id = :id;
```

```ts
import {getPost} from './sql/.generated/get-post.sql.ts';

const post = await getPost(client, {id: 123});
```

## Generated casing

`generate.casing` controls generated SQL-derived property names. It defaults to
`'camel'`, so query wrappers expose application-shaped `Data` and `Result`
properties while the generated code shows the boundary explicitly:

```sql
/** @name listPosts */
select id, published_at
from posts
order by id;
```

```ts
function mapResult(row: listPosts.RawResult): listPosts.Result {
  return {
    id: row.id,
    publishedAt: row.published_at,
  };
}

export const listPosts = Object.assign(
  async function listPosts(client: Client): Promise<listPosts.Result[]> {
    const rows = await client.all<listPosts.RawResult>(listPosts.query);
    return rows.map(mapResult);
  },
  { sql, query, mapResult },
);

export namespace listPosts {
  export type RawResult = {
    id: number;
    published_at: string;
  };

  export type Result = {
    id: number;
    publishedAt: string;
  };
}
```

`RawResult` describes the database row. `mapResult` is the generated field-by-field
mapper from raw SQL shape to public TypeScript shape, and is attached so you can
reuse it with other clients. sqlfu emits that mapper only when there is a real
result transform, such as camelCasing or JSON logical-type decoding.

Placeholder params are different: they are names you wrote in SQL, so sqlfu
preserves them exactly. If you want a fully camelCase wrapper API, write
placeholders in camelCase:

```sql
select id, published_at
from posts
where published_at >= :publishedSince;
```

For update/insert data inferred from column names, sqlfu treats those properties
as column-derived and camelCases them:

```sql
update posts
set published_at = :published_at
where id = :post_id;
```

```ts
await publishPost(client, {publishedAt: '2026-05-12'}, {post_id: 1});
```

Use `generate.casing: 'preserve'` when you want generated properties to keep the
SQL-derived names. If two fields would collide after camelCasing, only the
clashing fields keep their raw names.

If the rest of your app uses Effect, set `generate.runtime: 'effect-v3'` to emit
functions that return Effect values and require Effect SQL's
`SqlClient.SqlClient` from the Effect environment:

```ts
const post = yield* getPost({id: 123});
```

See [Effect SQL runtime](./effect-sql.md) for the experimental native
Effect SQL generation modes, including Effect v4 beta's `effect-v4-unstable` target.

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

## Experimental JSON Logical Types

Set `generate.experimentalJsonTypes: true` to opt into experimental JSON
logical-type handling. Columns declared with the SQLite type name `json` are
stored as JSON text and generated as `unknown`. For a narrower TypeScript type,
add a reserved `sqlfu_types` metadata view. Each row maps a logical declared type
name to an encoding, a definition format, and a type definition:

```sql
create view sqlfu_types (name, encoding, format, definition) as
values
  (
    'slack_payload',
    'json',
    'typescript',
    '{
      action: "message" | "reaction";
      content: string
    }'
  );

create table slack_webhooks(
  id integer primary key,
  payload slack_payload not null
);
```

```ts
await recordSlackWebhook(client, {
  payload: {
    action: "message",
    content: "hello",
  },
});
```

The generated wrapper accepts the TypeScript `definition`, serializes inputs as
pretty-printed JSON text, and parses selected result columns before returning them.
The `definition` value is not a validator schema and sqlfu does not resolve
imports, aliases, or references from it. The `encoding` column controls how the
logical type is encoded for SQLite; this first experimental slice only supports
`json`. The `format` column says what language the definition uses; this first
experimental slice only supports `typescript`.

## Limits

- Runtime-expanded params, currently inferred scalar `IN` lists, row-value `IN`
  lists, and INSERT `values :param` objects, can appear only
  once in a query. Reusing the same expanded array in two places would require
  duplicating the driver arguments, so sqlfu rejects that shape for now.
- Set `generate.experimentalJsonTypes: true` to opt into experimental JSON
  logical-type handling. This includes columns declared with the SQLite type
  name `json` and any matching rows in the reserved `sqlfu_types` view.
- Plain `sqlfu_types.definition` values only describe generated TypeScript
  surfaces. They do not add runtime validation for JSON payload shape.
- Parameter shape is inferred from SQL shape, not comment metadata. `@name` names
  queries; `IN (:ids)`, `(slug, title) in (:keys)`, and `values :posts` describe
  runtime placeholder expansion where the SQL shape changes.
