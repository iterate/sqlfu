# Getting Started

This walkthrough builds a small posts app from scratch with the whole sqlfu project in one TypeScript module: schema, migrations, queries, generated query types, and the runtime wrapper. By the end you will have a working `db.listPosts({limit: 10})` call with full IDE types.

If you want to see the finished project running in your browser first, [open the demo](/ui?demo=1). It uses the same schema and queries with no install.

## What you will have

```
.
├── .sqlfu/
│   └── app.db
└── sqlfu.config.ts
```

That is the default shape: start inline, then split schema or query files out later when the file boundary helps your project.

## Install

```sh
pnpm add sqlfu
```

Optionally install the CLI globally so `sqlfu` is on your `PATH` anywhere:

```sh
npm install -g sqlfu
```

When you run `sqlfu` inside a project that already has it as a dependency, the global binary delegates to the project-local copy (`node_modules/sqlfu`). Each project runs the version it pinned. Your global install never has to match, and upgrading globally is not required to unstick a project.

## Initialize the project

```sh
npx sqlfu init
```

This creates `sqlfu.config.ts` and a `.gitignore` entry for `.sqlfu/`. The config starts with inline schema and query placeholders:

```ts
import {defineConfig, sql} from 'sqlfu';

export default defineConfig({
  definitions: sql`
    create table posts (
      id int,
      slug text,
      body text
    );
  `,
  queries: {
    listPosts: sql`
      select id, slug, body
      from posts
      order by id desc
    `,
  },
});
```

The config deliberately omits `db`: commands that need a local scratch database will use `.sqlfu/app.db`. Your app still chooses the real runtime client when it binds the inline config.

## Define your schema and query

Edit `sqlfu.config.ts` so the schema says what you want right now, and the query describes the data your code will call:

```ts
import {defineConfig, sql} from 'sqlfu';

export default defineConfig({
  definitions: sql`
    create table posts (
      id int,
      slug text,
      body text
    );
  `,
  queries: {
    listPosts: sql`
      select id, slug, body
      from posts
      order by id desc
      limit :limit
    `,
  },
});
```

`definitions` is the single source of truth for your desired schema. When you change it, sqlfu computes the diff and writes the next migration entry back into the inline config. Each key in `queries` is the query's identity: it shows up in generated types, observability spans, and error messages.

## Draft a migration

```sh
npx sqlfu draft
```

sqlfu replays the inline migration history into a scratch database, diffs it against `definitions`, and appends a migration entry to `sqlfu.config.ts`. Review that entry in code review like any hand-written migration.

The generated entry will look something like:

```ts
migrations: [
  {
    name: '20260101000000_create_posts',
    content: sql`
      create table posts (
        id int,
        slug text,
        body text
      );
    `,
  },
],
```

Looks right. Commit it as-is.

## Generate types

```sh
npx sqlfu generate
```

sqlfu reads the inline queries against the inline schema and writes compact type tags back into `sqlfu.config.ts`. For the `listPosts` query you get a generated mode and payload type:

```ts
listPosts: sql.many<{parameters: {limit: number}; result: {id: number | null; slug: string | null; body: string | null}}>`
  select id, slug, body
  from posts
  order by id desc
  limit :limit
`,
```

Because generation reads `definitions` by default, it does not need a live database.

## Call the wrapper

```ts
import {DatabaseSync} from 'node:sqlite';
import {createNodeSqliteClient} from 'sqlfu';
import dbConfig from './sqlfu.config.ts';

const sqlite = new DatabaseSync('./.sqlfu/app.db');
const client = createNodeSqliteClient(sqlite);
const db = dbConfig(client);

db.migrate();

const posts = db.listPosts({limit: 10});
//    ^? Array<{id: number | null, slug: string | null, body: string | null}>
```

Params and result rows are fully typed. Your IDE hover shows the inferred row type directly. The `listPosts` key travels with every call to OpenTelemetry spans, Sentry errors, and Datadog metrics -- see [Observability](/docs/observability).

`node:sqlite` is built into Node 22+. Using a different runtime or driver? See [Adapters](/docs/adapters) for Bun, Turso, D1, Expo, and others -- the same inline config binds to any sqlfu client.

## Change the schema

Add a column to `definitions`:

```ts
definitions: sql`
  create table posts (
    id int,
    slug text,
    body text,
    excerpt text
  );
`,
```

Then draft the migration:

```sh
npx sqlfu draft
```

The generated migration entry will contain:

```sql
alter table posts add column excerpt text;
```

That is one line, not a full table rebuild. The diff engine compares the schema you have now (replayed from inline migration history) against the schema you declared in `definitions`, and emits only the statements needed to close the gap. Adding a nullable column is a single `alter table` statement; SQLite supports it directly without recreating the table.

Review the migration entry, commit it, then run `npx sqlfu generate` to update the inline query types.

## Split files out later

Inline config keeps the first project small. When the schema or query list gets large enough that separate files are easier to review, move to file-backed config:

```ts
import {defineConfig} from 'sqlfu';

export default defineConfig({
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
});
```

Relative paths are resolved from the config file's directory. The query SQL moves into `.sql` files with `@name` comments, and generated wrappers are emitted under `sql/.generated/`. Use this shape when you want SQL files to be the authored artifacts across a larger project.

## Where to go next

Pick the path that matches where you are:

- **Need Turso, D1, Bun, Durable Objects, or another runtime?** [Guides](/docs/guides) has end-to-end setup pages; [Adapters](/docs/adapters) has the compact adapter reference.
- **Want to understand how migrations work?** [SQL migrations](/docs/migration-model): the replay-based model, what `sqlfu check` verifies, and what to do when a migration fails.
- **Want to handle adapter errors consistently?** [Errors](/docs/errors): normalized `SqlfuError.kind` values and handler examples.
- **Need validated rows for tRPC or forms?** [Runtime validation](/docs/runtime-validation): opt-in validation with arktype, valibot, or zod baked into the generated wrappers.
- **Need multiple queries or list params?** [Type generation from SQL](/docs/typegen): generated inline config tags, `@name` file-backed queries, inferred `IN (:ids)` lists, object dot paths, and inferred bulk inserts.
- **Need query telemetry?** [Observability](/docs/observability): query names in OpenTelemetry spans, Sentry errors, PostHog events, and Datadog metrics.
- **Want to see more generated type shapes?** [Generate examples](/docs/examples): real query fixtures showing param and result types for common patterns.
- **Want a visual interface for your database?** [Admin UI](/docs/ui): run queries, inspect tables, and draft migrations in the browser.
