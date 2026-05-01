Effect integration fixtures. Runtime behaviour lives in `runtime.test.ts`; this page pins the
generated source shape.

## generate.effect: true emits an Effect service for query wrappers

<details>
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  slug text not null,
  title text
);
```

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {effect: true},
};
```

```sql (sql/list-posts.sql)
select id, slug, title from posts order by id;
```

```sql (sql/find-post-by-slug.sql)
select id, slug, title from posts where slug = :slug limit 1;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/effect.ts)
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import type {Client} from 'sqlfu';
import {findPostBySlug, listPosts} from "./queries.js";

type BindSqlfuClient<TQuery> = TQuery extends (client: Client, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;

export class SqlfuQueries extends Context.Tag("sqlfu/SqlfuQueries")<SqlfuQueries, SqlfuQueries.Service>() {
	static make() {
		return SqlfuQueries;
	}

	static fromClient(client: Client): SqlfuQueries.Service {
		return {
			findPostBySlug: (...args) => findPostBySlug(client, ...args),
			listPosts: (...args) => listPosts(client, ...args),
		};
	}

	static DefaultServices(client: Client) {
		return Layer.succeed(SqlfuQueries, SqlfuQueries.fromClient(client));
	}
}

export namespace SqlfuQueries {
	export type Service = {
		findPostBySlug: BindSqlfuClient<typeof findPostBySlug>;
		listPosts: BindSqlfuClient<typeof listPosts>;
	};
}
```

```ts (sql/.generated/index.ts)
export * from "./tables.js";
export * from "./queries.js";
export * from "./effect.js";
```

</details>
