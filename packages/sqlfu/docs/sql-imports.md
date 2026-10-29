# Import .sql files directly

> Experimental. Needs TypeScript 7.1, which is in beta.

On TypeScript 7.1 you can skip `sqlfu generate`. Import the `.sql` file, and TypeScript types it from `definitions.sql`:

```sql
/** @name listPosts */
select id, slug, title
from posts
order by id desc;

/** @name findPostBySlug */
select id, slug, title
from posts
where slug = :slug
limit 1;
```

```ts
import {findPostBySlug, listPosts} from './sql/queries.sql';

const posts = await listPosts(client);
//    ^? {id: number; slug: string; title?: string}[]

const post = await findPostBySlug(client, {slug: 'hello'});
//    ^? {id: number; slug: string; title?: string} | null
```

There's no generated file. The type check reads the SQL every time, so types can't go stale, and there's no `.generated/` folder to commit or review.

A query that doesn't fit the schema is a type error in the `.sql` file, at the query:

```
sql/queries.sql(5,1): error sqlfu1: listAuthors: no such table: authors
```

Like `sqlfu generate`, this needs no database. Types come from your [`generate.authority`](/docs/sqlfu#generateauthority), which is `definitions.sql` by default.

## Setup

Install TypeScript 7.1:

```sh
npm install -D typescript@beta
```

Hand `.sql` files to sqlfu in `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    // ...
  },
  "contentMappers": [{"package": "sqlfu", "extensions": [".sql"]}]
}
```

Type check with `--runExternalCode`, which lets `tsc` run sqlfu:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit --runExternalCode"
  }
}
```

Load `sqlfu/register` where your code runs, so the imports work at run time too:

```sh
node --import sqlfu/register main.ts
```

VS Code runs content mappers only in trusted workspaces.

## How it works

TypeScript 7.1 added [content mappers](https://github.com/microsoft/typescript-go/pull/4712): a package can tell `tsc` and the editor what TypeScript a foreign file stands for. sqlfu answers each `.sql` file under your `queries` folder with the module `sqlfu generate` would have written to `.generated/`. Same wrappers, same `generate` options (`validator`, `runtime`, `casing`, `sync`). `definitions.sql`, migrations, and any other `.sql` file become empty modules.

`sqlfu/register` does the same at run time. A Node loader hook builds each module as the file loads, and Node strips its types.

## Switching

The `.sql` files are the same either way. Only the imports change:

```ts
// with sqlfu generate
import {listPosts} from './sql/.generated/queries.sql.ts';

// with the content mapper
import {listPosts} from './sql/queries.sql';
```

## Limits

- Query wrappers only. Table row types (`sql/.generated/tables.ts`), the migrations bundle, and the query catalog still come from `sqlfu generate`.
- File-backed configs only. `sql` tags in an [inline config](/docs/sqlfu#inline-durable-object-configs) are TypeScript, which content mappers never see. Keep running `sqlfu generate` for those.
- Run time is Node only for now. Bundlers (Vite, esbuild, wrangler) have no sqlfu plugin yet, so keep generated wrappers there.
- The loader analyzes queries when the first `.sql` file loads. That's fine in development and tests. In production, either ship it (the analyzer is part of `sqlfu`) or use generated wrappers.
- An error spans the whole query, not the exact token.

[reylo](https://github.com/colinhacks/reylo) did `.sql` imports with content mappers first. It types queries against a running database; sqlfu types them from `definitions.sql`.
