# Postgres

Use this guide when your app talks to Postgres through
[`pg`](https://node-postgres.com) (node-postgres).

Postgres support comes in two parts:

- `createNodePostgresClient()`, in `sqlfu`, runs your queries at runtime.
- `pgDialect()`, in `@sqlfu/pg`, points the toolchain at Postgres: `draft`,
  `migrate`, `check`, `generate`, `format`, and the
  [Admin UI](../../../ui/README.md).

The loop is the same as for SQLite: `definitions.sql`, reviewed migrations,
`.sql` query files, generated wrappers.

Postgres support is early. Tables, `serial` and identity columns, enums,
domains, views, materialized views, functions, triggers, extensions and
multiple schemas work end to end. Read [Known gaps](#known-gaps) before you
adopt it.

## Install

```sh
npm install sqlfu pg
npm install --save-dev @sqlfu/pg
```

`@sqlfu/pg` is only loaded by `sqlfu.config.ts`, so it's a dev dependency. Your
app needs only `sqlfu` and `pg`.

## Config

```ts
import {Pool} from 'pg';
import {createNodePostgresClient, defineConfig} from 'sqlfu';
import {pgDialect} from '@sqlfu/pg';

const databaseUrl = process.env.DATABASE_URL!;

export default defineConfig({
  dialect: pgDialect({adminUrl: databaseUrl}),
  db: () => {
    const pool = new Pool({connectionString: databaseUrl});
    return {
      client: createNodePostgresClient(pool),
      [Symbol.asyncDispose]: () => pool.end(),
    };
  },
  definitions: './definitions.sql',
  migrations: './migrations',
  queries: './sql',
});
```

`dialect` is what switches the toolchain to Postgres. Leave it out and sqlfu
assumes SQLite.

`adminUrl` must connect as a role with `CREATEDB`. To draft migrations and
generate types, sqlfu creates throwaway `sqlfu_scratch_*` databases on that
server, then drops them. Your app's own URL works if its role can create
databases. If it can't, point `adminUrl` at a local Postgres instead.

`db` is the database that `migrate`, `check`, `sync` and the UI run against.
sqlfu calls the factory once per command and disposes the result afterwards, so
close the pool in `[Symbol.asyncDispose]`.

`sqlfu init` writes a SQLite config. For Postgres, write this file yourself.

## Schema and queries

Put the schema in `definitions.sql`:

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text,
  published_at timestamptz
);
```

Put queries in `sql/queries.sql`. Use sqlfu's `:name` parameters, not `$1`.
sqlfu rewrites them to `$1`, `$2`, ... in the generated code:

```sql
/** @name findPostBySlug */
select id, slug, title, body, published_at
from posts
where slug = :slug
limit 1;

/** @name insertPost */
insert into posts (slug, title, body)
values (:slug, :title, :body);
```

Then run the usual commands:

```sh
npx sqlfu draft --name create_posts
npx sqlfu migrate
npx sqlfu generate
```

Postgres drafts come from [migra](https://github.com/mmkal/pgkit/tree/main/packages/migra),
so they are more verbose than SQLite drafts. Expect qualified names, plus
separate statements for each index and constraint:

```sql
create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "body" text,
    "published_at" timestamp with time zone
      );
CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);
CREATE UNIQUE INDEX posts_slug_key ON public.posts USING btree (slug);
alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";
alter table "public"."posts" add constraint "posts_slug_key" UNIQUE using index "posts_slug_key";
```

As with any draft, it's yours to edit before you commit it.

## Runtime

```ts
import {Pool} from 'pg';
import {createNodePostgresClient} from 'sqlfu';

import {findPostBySlug, insertPost} from './sql/.generated/queries.sql.ts';

const pool = new Pool({connectionString: process.env.DATABASE_URL});
const client = createNodePostgresClient(pool);

await insertPost(client, {slug: 'hello-world', title: 'Hello world', body: null});
const [post] = await findPostBySlug(client, {slug: 'hello-world'});
```

Generated types follow the `pg` driver's defaults. `timestamptz` comes back as
`Date`, `uuid` as `string`.

Errors are `SqlfuError`s with the same `kind`s as SQLite, mapped from the
SQLSTATE. Inserting a duplicate slug throws `kind: 'unique_violation'`, with
`'23505'` on `error.cause.code`. See [Errors](../errors.md).

## What differs from SQLite

- **Scratch databases.** SQLite drafts in memory. Postgres creates and drops real
  databases on `adminUrl`.
- **Migration lock.** `sqlfu migrate` holds a Postgres advisory lock while it
  runs, so two deploys migrating at once don't race on the history table.
- **History table.** Same `sqlfu_migrations` table, but `applied_at` is
  `timestamptz`. The `d1` migrations preset is SQLite-only.
- **Async only.** `pg` is async, so `generate.sync` doesn't apply.
- **Formatting.** `sqlfu format` picks Postgres formatting from your config. The
  lint plugin needs `dialect: 'postgresql'` (see [Formatter](../formatter.md)).

## Known gaps

These are bugs, not design decisions.

Schema features. migra creates every function and composite type after the
tables, so a table that uses one fails. This hits drafts and `generate`:

| Feature | What happens |
| --- | --- |
| a function called in a column default, check constraint or generated column | `function ...() does not exist` |
| a composite type (`create type ... as (...)`) as a column type | `type "..." does not exist` |
| custom ICU collations | locale and `deterministic = false` are lost |
| comments, grants | never drafted |

Generated wrappers. These differ from SQLite output:

- `limit 1` queries return an array, not `Result | null`.
- `insert`/`update`/`delete ... returning` wrappers don't return rows.
- Parameters compared with `=` are typed as nullable (`slug: string | null`).
- Selects with no `from` (`select 1 as a`) get no result columns.

Not covered at all:

- Postgres drivers other than `pg`.
- Migrating an existing pgkit project. See
  [Coming from pgkit](./pgkit.md).

## Read next

- [Coming from pgkit](./pgkit.md) if you know sqlfu's Postgres predecessor.
- [SQL migrations](../migration-model.md) for how `draft`, `migrate` and `check`
  fit together.
- [Adapters](../adapters.md#postgres) for the runtime adapter alone.
