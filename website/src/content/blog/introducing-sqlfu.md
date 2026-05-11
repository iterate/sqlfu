---
title: "introducing sqlfu"
slug: "introducing-sqlfu"
date: "2026-04-23"
description: "sqlfu is a SQLite-first toolkit for writing schema, migrations, and queries in SQL, then generating the TypeScript around them."
heroImage: "/assets/blog/friendship-regain-sqlfu.png"
heroAlt: "SQL is back with sqlfu"
---

`sqlfu` is a SQLite-first toolkit for teams that want the data layer to stay in SQL.

The project starts from a blunt premise: if your schema is SQL, your migrations are SQL, and the query that runs in production is SQL, the source language of your database layer should probably be SQL too. TypeScript should still help. It should give you generated wrappers, typed params, typed rows, runtime validation if you ask for it, and a client that feels natural in application code. It just should not be the language you translate every query into before SQLite ever sees it.

At [iterate](https://iterate.com), this is partly about agents. Agents are good at SQL because SQL is old, stable, heavily documented, and explicit. They are much less reliable when they have to route a query through a library-specific DSL, infer the actual SQL from a long method chain, then guess what migration tool will generate from a separate schema language. A `.sql` file is a better review artifact. The diff is the query.

## The shape

A sqlfu project has four plain artifacts:

```
.
├── definitions.sql
├── migrations/
│   └── 20260422120000_add_posts.sql
├── sql/
│   ├── queries.sql
│   └── .generated/
│       └── queries.sql.ts
└── sqlfu.config.ts
```

`definitions.sql` is the schema you want. `migrations/` is the ordered history of how real databases got there. `sql/` contains checked-in queries. `.generated/` contains the TypeScript output you do not edit.

Write the query:

```sql
/** @name findPostBySlug */
select id, title, body, published
from posts
where slug = :slug;
```

Run `sqlfu generate`, then call the generated wrapper:

```ts
import {findPostBySlug} from './sql/.generated/queries.sql.ts';

const post = await findPostBySlug(client, {slug: 'hello-world'});
//    ^? {id: number; title: string; body: string; published: number} | undefined
```

That is the core promise: SQL in, TypeScript out, no query DSL between you and the database.

## Why not an ORM?

The pitch for an ORM is that you work in objects and the database is an implementation detail. In practice, [as Neon puts it](https://neon.com/blog/orms-vs-query-builders-for-your-typescript-application), it's a leaky abstraction: "while the theory is that you can treat the database as an implementation detail and work in TypeScript, in practice you need to know SQL, TypeScript, and how to use the ORM itself." You end up with three mental models instead of one.

That trade can still make sense. It is the wrong trade for sqlfu. If you are already going to review query plans, add indexes, debug migrations, and ask agents to modify schema, hiding SQL mostly moves the hard parts out of sight. sqlfu makes the opposite bet: put the database artifacts in files you can read.

This is also why sqlfu keeps `definitions.sql` as the target schema. You can ask an agent to add `published_at` to `posts`; it changes the SQL schema, `sqlfu draft` generates a SQL migration, and you review the actual file that will run. There is no model declaration plus generated migration plus hope that the two still mean the same thing.

## Why not a query builder?

Drizzle and Kysely are good tools. We use Drizzle at iterate, and [drizzle-kit studio](https://orm.drizzle.team/kit-docs/overview) directly influenced the [sqlfu UI](https://sqlfu.dev/ui). Query builders are much closer to sqlfu's taste than ORMs are: they respect SQL, expose composition, and have excellent TypeScript ergonomics.

The cost is transliteration. A `.select().from().innerJoin().where()` chain is SQL rewritten as method calls. That can be worth it for truly dynamic queries: search screens with many optional filters, user-configurable reporting, dynamic `order by`, dynamic projections. sqlfu is not trying to win those cases. Use a query builder there.

Most application queries are not like that. They are named operations with a stable shape: `findPostBySlug`, `listRecentInvoices`, `markJobStarted`. For those, sqlfu's answer is simpler. Put the SQL in a file, name it, generate a wrapper, and let the diff show the thing that will hit the database.

When a little dynamism is enough, sqlfu supports the same nullable-filter pattern that [PgTyped documents](https://pgtyped.dev/docs/dynamic-queries): express optional filters inside one static SQL query. When that gets ugly, stop and use the right tool for that one procedure.

## Migrations from the schema you want

sqlfu's [approach](https://sqlfu.dev/docs/migration-model) is closer to [Atlas](https://atlasgo.io/versioned/diff) or [Skeema](https://www.skeema.io): the desired schema is a real artifact. It's `definitions.sql`, one file, read top to bottom. It is what the database *should* look like. Migrations are the ordered record of how you got there.

When `definitions.sql` changes, `sqlfu draft` replays the existing migrations into a scratch database, compares that replayed schema with the desired schema, and writes the migration that closes the gap. You read it, edit it for renames or backfills, and commit it. The generated migration is not a decree. It is a draft in the language the database will execute.

This is the part that made sqlfu feel worth packaging. Once schema, migrations, and queries are all SQL, the same tool can answer useful questions: does the live database match the repo, what would need to change, which migration files have already run, and what TypeScript should a query return?

## What ships

`sqlfu` includes:

- a runtime client over SQLite-compatible drivers, including `better-sqlite3`, `node:sqlite`, libsql/Turso, Cloudflare D1, Durable Objects, Expo SQLite, and `sqlite-wasm`
- `sqlfu draft`, `migrate`, `check`, `sync`, `goto`, and `baseline` for schema work
- `sqlfu generate` for TypeScript wrappers from `.sql` files
- runtime validation output for ArkType, Valibot, Zod, or Zod Mini
- typed SQL errors with stable `SqlfuError.kind` values
- an opinionated SQLite formatter and eslint rule
- observability hooks for OpenTelemetry, Sentry, PostHog, and Datadog-style metrics
- an Admin UI for inspecting schema, migrations, queries, and data
- an experimental transactional outbox
- an agent skill that teaches coding agents the project layout

The runtime client deliberately stays thin. sqlfu does not ship a database driver; it adapts the driver you already use. Sync drivers stay sync, async drivers stay async, and generated wrappers follow the same shape.

## What it is not for

sqlfu is pre-alpha. The runtime surface is intentionally small, but the toolchain will still change.

It is also SQLite-first. There is active Postgres work in this repo and [pgkit](https://github.com/mmkal/pgkit) is the Postgres-shaped predecessor, but the public sqlfu toolchain is currently built around SQLite.

You should not adopt it to avoid learning SQL. That is the opposite of the point. sqlfu is for projects where SQL is welcome, reviewable, and central.

## Prior art and thanks

The query-codegen idea is not new. [sqlc](https://github.com/sqlc-dev/sqlc) has been doing it for Go for years. [PgTyped](https://pgtyped.dev) and [sqlc-gen-typescript](https://github.com/sqlc-dev/sqlc-gen-typescript) carry the idea into TypeScript. sqlfu's contribution is bundling that model with the SQLite pieces we kept needing around it: schema diffing, migrations, formatting, runtime adapters, observability, and a UI.

The package leans on a lot of existing work:

- [TypeSQL](https://github.com/wsporto/typesql), its parser, [antlr4](https://github.com/antlr/antlr4), and [code-block-writer](https://github.com/dsherret/code-block-writer) power most of `sqlfu generate`.
- [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) and [prettier-plugin-sql-cst](https://github.com/nene/prettier-plugin-sql-cst) shaped the formatter and its test fixtures.
- [Drizzle Studio](https://orm.drizzle.team/kit-docs/overview) shaped the local-backend, hosted-frontend model for the sqlfu UI.
- [CodeMirror](https://codemirror.net/), React, TanStack Query, Radix UI, `@silevis/reactgrid`, and `sqlite-wasm` do much of the browser-side heavy lifting.
- [Atlas](https://atlasgo.io/versioned/diff), [Skeema](https://www.skeema.io), `@pgkit/schemainspect`, `@pgkit/migra`, and Robert Lechte's original `schemainspect`/`migra` projects shaped the schema-diff model.

Vendored directories in the repo include attribution notes and local-change summaries so future updates can be applied deliberately.

Try it with `npm install sqlfu`. Docs are at [sqlfu.dev](https://sqlfu.dev). Source is at [github.com/iterate/sqlfu](https://github.com/iterate/sqlfu).
