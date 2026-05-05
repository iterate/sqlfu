# introducing sqlfu

Introducing `sqlfu` — a library that lets you and your agent *just write SQL* to build your application.

> We need to talk about data

It's 2026. After 3 agonising hours after asking Claude to submit your YC application, you've finally heard back. You're in. A relief, now you won't be the only one of your friends that didn't make it. But now, you actually need to tell claude to build your startup. You only know three things. 1: the world needs your agent-harness-todolist-llm-wiki app. 2: it's going to be written in TypeScript. 3: it's going to need a database.

So, which TypeScript-friendly database library do you choose? Prisma has a pretty readable schema definition language. Drizzle's performance is meant to be great, and you hear it "close to SQL". Or you could go with Kysely because you want full control over the queries your application runs. You argue with your cofounder. Let's say you settle on Prisma.

For the first week or so it's great. Your agent writes easy-to-review queries looking like `users.findMany({ where: ... })` and you get a PoC working. You hover over some types in your IDE, and occasionally even fiddle with a query yourself, enjoying your ability to press Cmd-space. You fondly remember how often you did that when you wrote code yourself.

A month in, and your enthusiastic AI companion has spewed hundreds of these queries across your codebase. And now you think you need a query that does `group by` with a window function and a `lateral` subquery. The agent can't find a way to get your ORM to express it cleanly, and it starts writing code to work around it. It writes a series of sequential queries, and does application-side filtering and aggregation. It works in your tests. You ship it to production and when your two customers try to use it at the same time, disaster strikes. It's horribly slow.

Two months in, schema changes are painful. A teammate tells their agent "add a `published_at` column to posts and backfill it from `created_at`." It updates the Prisma schema, runs `prisma migrate dev`, and produces a SQL migration that they're not used to reading, which drops and recreates the table instead of adding a column. You catch it on review. You hope you catch it every time.

Six months in, half of your codebase by lines of code are now deeply-nested arcane Prisma calls. You and your cofounder start to wonder whether you should have chosen Drizzle or Kysely after all. After all, they're *closer* to the SQL.

> SQL is all you need

![Friendship regain with SQL and sqlfu](/assets/blog/friendship-regain-sqlfu.png)

But what if you could get not *close* to SQL but just... into it? That's what `sqlfu` aims to help you do. It lets you use SQL to:

- Define your application's target schema in SQL. Not in a TypeScript DSL, not in a `schema.prisma` file, but as regular-old `create table` statements in a `definitions.sql`
- Derive and manage migrations from the target schema in SQL.
- Write your application's data-access layer as SQL queries, and generate strong TypeScript types from each, no matter how complex or which SQL features they use.
- Inspect your database in a web UI, run and author new queries as plain SQL.

A typical sqlfu project looks something like this:

```
.
├── definitions.sql            <- the schema you want
├── migrations/                <- ordered SQL files, applied in name order
│   └── 20260422120000_add_posts.sql
├── sql/                       <- checked-in queries, one or many per file
│   ├── find-post-by-slug.sql
│   └── .generated/            <- typed TypeScript wrappers, regenerated from the .sql files
│       └── find-post-by-slug.sql.ts
└── sqlfu.config.ts
```

You write a query like `sql/find-post-by-slug.sql`:

```sql
select id, title, body, published
from posts
where slug = :slug;
```

You run `sqlfu generate`. You get a typed wrapper file next to it. In your application code you call:

```ts
import {findPostBySlug} from './sql/.generated/find-post-by-slug.sql.ts';

const post = await findPostBySlug(client, {slug: 'hello-world'});
//    ^? {id: number; title: string; body: string; published: number} | undefined
```

The SQL is the query. The types are generated from it. There's no DSL between you and the query plan.

This idea is not new. [sqlc](https://github.com/sqlc-dev/sqlc) has been doing it for Go since 2019; [sqlc-gen-typescript](https://github.com/sqlc-dev/sqlc-gen-typescript) is a more recent effort. [PgTyped](https://pgtyped.dev) does a similar thing for Postgres in Node. What sqlfu does differently is bundle the codegen together with the other things you actually need to run a SQLite app: a schema diff engine, a migrator, a formatter, a runtime client, and a UI.

No [inner platform effect](https://en.wikipedia.org/wiki/Inner-platform_effect) — just you, your agent, and some lovely language for structured querying.

## Why not an ORM

The pitch for an ORM is that you work in objects and the database is an implementation detail. In practice, [as Neon puts it](https://neon.com/blog/orms-vs-query-builders-for-your-typescript-application), it's a leaky abstraction: "while the theory is that you can treat the database as an implementation detail and work in TypeScript, in practice you need to know SQL, TypeScript, and how to use the ORM itself." You end up with three mental models instead of one.

The classic ORM traps are well-documented: the N+1 query problem, the silent inclusion of columns you didn't ask for, the [~15MB Prisma install](https://dev.to/zenstack/prisma-vs-drizzle-vs-zenstack-choosing-a-typescript-orm-in-2026-5cba) with its Rust query engine. Those are symptoms. The deeper issue is philosophical: an ORM puts itself *between* you and your database, then asks you to trust it.

It's also a strange thing to ask for in 2026. The argument for an ORM used to be "not everyone on the team wants to learn SQL." That was defensible when the cost of teaching a junior engineer to write a five-way join was a week of pairing. It's harder to defend now that every code-editing tool in your stack, from Claude to Codex to whatever your team uses, generates SQL fluently on the first try.

And if you pair that with a `definitions.sql` file with the *exact* schema to use, the quality of LLM-written code gets really, really good. SQL has four decades of training data and a stable grammar. Your ORM's TypeScript DSL has neither, even if its maintainers have a few thousand X followers. The agent you're pairing with is *more* fluent in SQL than in Prisma's schema syntax, and the generated queries are more likely to be right the first time.

There's a related observation: ORMs keep having major-version-breaking releases every two years. SQL hasn't. The thing you're adopting to avoid learning SQL is less stable than SQL itself. That's upside-down.

## Why not a query builder

Quick aside before the critique: Drizzle is genuinely great. We use it at [iterate](https://iterate.com) in plenty of projects and it works. [drizzle-kit studio](https://orm.drizzle.team/kit-docs/overview) was a direct inspiration for the [sqlfu UI](https://sqlfu.dev/ui). The "open a web page, poke at your tables, see migrations as a first-class thing" ergonomic is a high bar that Drizzle cleared first. Nothing in this section is "query builders are bad"; it's "here's why sqlfu makes a different bet."

Query builders (Kysely, Drizzle) are a fair bit closer to what sqlfu wants than ORMs are. They don't hide SQL; they just let you write it in TypeScript function calls. The types are excellent. You get autocomplete. The leaky-abstraction problem is smaller because you're closer to the metal.

The tradeoff: if you end up writing SQL-ish TypeScript anyway, you're paying for the transliteration. The `.select().from().innerJoin().where()` chain is a rewrite of SQL using method calls. It's not an *abstraction over* SQL, it's a *translation of* SQL. The bet behind a query builder is "we can make SQL more typesafe by putting it in TypeScript." That bet pays off for the types and costs you: readability of the actual query, copy-pasteability from `psql`, and the fact that the query you wrote is now one layer removed from the query that runs.

Drizzle's own slogan is ["if you know SQL, you know Drizzle."](https://orm.drizzle.team) It's meant as a compliment to SQL, and it's fair. It's also a question worth asking for your own project: if you know SQL, how much of Drizzle are you using as SQL-with-types, and how much are you using for the runtime composition? If the answer is mostly the former, sqlfu can cover that with generated types on real `.sql` files.

sqlfu's answer to "what about dynamic queries, then?" is the [`IS NULL` pattern](https://sqlfu.dev/docs/dynamic-queries): a single static query with optional filters expressed inside the SQL, the same trick [pgTyped](https://pgtyped.dev/docs/dynamic-queries) uses. It works, and the generated wrapper types the parameters as nullable. It's more awkward than `.where(...)` chaining in a query builder, and at some point (lots of optional filters, dynamic `order by`, dynamic column selection) you should stop fighting it and reach for a query builder for that specific piece. sqlfu is perfectly happy to share an app with Drizzle or Kysely: wrap the dynamic handful of procedures in whichever one you prefer, keep the static 90% in `.sql` files.

There's a nice side-effect of the SQL-first layout when you're working with agents. A `.sql` file is an explicit, review-at-a-glance artifact. When an agent edits one, the diff is the actual query that's going to hit your database. No mentally unpacking method chains, no wondering whether a nested `with` clause collapsed into the shape you expected. You open the file, you read the SQL, you know what it does. Same for the human on the other side of the PR.

## Migrations by diff, not by chronology

Migrations are where most tools get philosophical and most users get frustrated. Prisma's `prisma migrate dev` tries to generate the migration for you, sometimes guesses wrong. Knex-style migrations are two JavaScript functions per file, `up` and `down`, and now your schema history is spread across 80 files of imperative code. You can't easily look at those files and *see* your schema.

sqlfu's [approach](https://sqlfu.dev/docs/migration-model) is closer to [Atlas](https://atlasgo.io/versioned/diff) or [Skeema](https://www.skeema.io): the desired schema is a real artifact. It's `definitions.sql`, one file, read top to bottom. It is what the database *should* look like. Migrations are the ordered record of how you got there.

When you change `definitions.sql`, you run `sqlfu draft`. sqlfu replays the existing migrations against a scratch database, compares the resulting schema to what's in `definitions.sql`, and writes the migration that closes the gap as plain SQL into a new file in `migrations/`. You read it. You edit it. You commit it.

You never `prisma migrate dev` and hope. You don't write the `up`/`down` yourself from scratch either. You review the proposed SQL and tweak it for renames or backfills that need preserving data. The hard part of migrations has always been reviewing a diff; sqlfu makes the diff the primary artifact.

This works especially well when an agent is in the loop. You tell the agent "add a `published_at` column and backfill it from `created_at`." It edits `definitions.sql`. `sqlfu draft` generates the migration. The agent can then tweak the backfill half of the migration file. You review the SQL, which is the actual thing that's going to run, rather than a Prisma model declaration plus an ORM-generated migration plus your trust that the two correspond.

## The rest of the owl

A few other things sqlfu ships with, each because they kept being the next problem after you commit to a SQL-first world:

- **A runtime client.** `sqlfu/client` is a thin layer over whichever SQLite driver you bring: `better-sqlite3`, `node:sqlite`, `@libsql/client`, `@tursodatabase/database`, Cloudflare D1, Durable Objects, Expo SQLite, or `sqlite-wasm`. See [the adapters page](https://sqlfu.dev/docs/adapters). Sync stays sync; async stays async; the generated wrappers follow suit.
- **A formatter.** `formatSql()` is a SQLite-dialect-aware formatter, descended from [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) but tuned for how sqlfu wants SQL to read. Opinionated, lowercase by default, less newline-happy than upstream.
- **An outbox.** Transactional outbox / job queue at `sqlfu/outbox`. See the [other post](https://sqlfu.dev/blog/outbox).
- **A UI.** `sqlfu/ui` is a web client for poking at your project: run queries, inspect tables, draft migrations, see schema diffs visually. The [demo](https://sqlfu.dev/ui?demo=1) runs entirely in the browser on sqlite-wasm.
- **Observability.** Each generated query carries its filename (or explicit name) to runtime as a `name` field. That name shows up in OpenTelemetry spans, Sentry errors, PostHog events, and Datadog metrics via a single `instrument()` call. Your dashboards know what query is slow, not just that *some* query is slow.
- **An agent skill.** `skills/using-sqlfu` primes Claude, Codex, Cursor, or any other agent that reads skill files with the project's conventions: where `.sql` files live, what `sqlfu draft` does, the difference between `definitions.sql` and the migrations folder. So the agent stops inventing the old-style Prisma layout the moment it sees a sqlfu project.

Nothing here is magic. Each piece is what you'd end up writing yourself after enough time in a SQL-first project. sqlfu is the result of writing it already.

## When sqlfu isn't for you

`sqlfu` might not be what you want, if:

- **You want to avoid unstable software** sqlfu is pre-alpha, at time of writing. At runtime/in production, you should just be using its client, which is a *very* thin wrapper around existing battle-tested clients like `better-sqlite3`, `libsql`, `node:sqlite` etc., and the idea behind the project is that you avoid any vendor lockin (the whole point is that you're just writing your data-access layer in a decades-old language!) - but using pre-alpha software always carries risk.
- **You're on Postgres, MySQL, or anything-but-SQLite.** sqlfu is SQLite-first. [pgkit](https://github.com/mmkal/pgkit) is the Postgres-focused sibling project (same author, same mental model). We do plan to grow sqlfu back to Postgres eventually, but that's eventually.
- **You genuinely need dynamic query construction at runtime for most of your queries.** An admin search UI with 20 optional filters, a user-configurable reporting tool, that kind of thing. Query builders are better for this. You can still use sqlfu for the static majority and drop to Kysely or Drizzle for the dynamic bits. See [docs/dynamic-queries](https://sqlfu.dev/docs/dynamic-queries) for how far you can push sqlfu alone before it's worth reaching for a builder.
- **You want the database to be "someone else's problem."** If your team's position is "I don't want to learn SQL, and I don't want to review SQL my agent wrote either," sqlfu is aggressively not for you. An ORM's whole value prop is letting that position exist.
- **You're already a few weeks into a project with Drizzle (or Kysely, or Prisma) and it's working fine.** Don't swap toolchains mid-flight. Drizzle in particular is a great stack, and if you've got a working schema, working migrations, and a team comfortable with the API, there's no reward here worth the churn. sqlfu makes most sense at the start of a project, or when you're reaching for a data layer for the first time in a codebase and want to pick the SQL-first shape deliberately.

For everything else (local-first apps, mid-scale SaaS, Durable Objects, Expo apps with a synced local DB, the whole "the database is a file" reality that SQLite made normal) writing SQL and generating TypeScript from it is the simplest arrangement that works. It scales down to hobby projects and up to production.

SQL is all you need. sqlfu is some plumbing for the parts around it.

---

Try it: `npm install sqlfu`. Docs at [sqlfu.dev](https://sqlfu.dev). Source at [github.com/mmkal/sqlfu](https://github.com/mmkal/sqlfu).

## Further reading

The arguments above are not original — there's a long thread of writing on why SQL keeps reasserting itself, and on the trade-offs between ORMs, query builders, and SQL-first tools. A few of the pieces I read while writing this:

- Dan Vanderkam — [TypeScript and SQL: Six Ways to Bridge the Divide](https://effectivetypescript.com/2023/08/29/sql/)
- michaelhaar — [Do we need an abstraction for SQL?](https://github.com/michaelhaar/type-safe-sql-query/blob/main/docs/do-we-need-an-abstraction-for-sql.md)
- phiresky — [An overview of typed SQL libraries for TypeScript](https://phiresky.github.io/blog/2020/sql-libs-for-typescript/)
- Neon — [ORMs vs. Query Builders for your TypeScript application](https://neon.com/blog/orms-vs-query-builders-for-your-typescript-application)
- Diploi — [Why we don't use an ORM and why you (probably) shouldn't](https://diploi.com/blog/why-we-dont-use-an-orm-and-why-you-probably-shouldnt-4cfo)
- Anders Swanson — [Using a modern database? You might not need that ORM anymore](https://andersswanson.dev/2025/08/25/using-a-modern-database-you-might-not-need-that-orm-anymore/)
- coffeeaddict.dev — [ORMs are overrated](https://coffeeaddict.dev/orm/)
- Solita — [Why avoid an ORM](https://dev.solita.fi/2021/06/01/why-avoid-an-orm.html)
- Kevin Conroy — [Introducing sqlc](https://conroy.org/introducing-sqlc)

And the prior art that sqlfu is most directly informed by:

- [sqlc](https://github.com/sqlc-dev/sqlc) — generate type-safe code from SQL (Go, since 2019; sqlc-gen-typescript more recently)
- [PgTyped](https://pgtyped.dev) — the same idea for Postgres in Node
- [Atlas](https://atlasgo.io/versioned/diff) — automatic schema migration planning
- [Drizzle](https://orm.drizzle.team) — "if you know SQL, you know Drizzle"
- [Kysely](https://kysely.dev)
