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
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type {Client, ResultRow, RunResult, SqlQuery} from 'sqlfu';

export type EffectClient = {
	effect: true;
	all<TRow extends ResultRow = ResultRow>(query: SqlQuery): Effect.Effect<TRow[], unknown>;
	run(query: SqlQuery): Effect.Effect<RunResult, unknown>;
};

export class SqlfuClient extends Context.Tag("sqlfu/SqlfuClient")<SqlfuClient, EffectClient>() {
	static make() {
		return SqlfuClient;
	}

	static fromClient(client: Client): EffectClient {
		return {
			effect: true,
			all: (query) => Effect.promise(() => Promise.resolve(client.all(query))),
			run: (query) => Effect.promise(() => Promise.resolve(client.run(query))),
		};
	}

	static DefaultServices(client: Client) {
		return Layer.succeed(SqlfuClient, SqlfuClient.fromClient(client));
	}
}
```

```ts (sql/.generated/find-post-by-slug.sql.ts)
import * as Effect from 'effect/Effect';
import type {Client} from 'sqlfu';
import type {EffectClient} from "./effect.js";

const sql = `select id, slug, title from posts where slug = ? limit 1;`;
const query = (params: findPostBySlug.Params) => ({ sql, args: [params.slug], name: "findPostBySlug" });

type findPostBySlugFn = {
	(client: EffectClient, params: findPostBySlug.Params): Effect.Effect<findPostBySlug.Result | null, unknown>;
	(client: Client, params: findPostBySlug.Params): Promise<findPostBySlug.Result | null>;
};

export const findPostBySlug = Object.assign(
	function findPostBySlug(client: Client | EffectClient, params: findPostBySlug.Params) {
		if ((client as EffectClient).effect === true) {
			return Effect.map((client as EffectClient).all<findPostBySlug.Result>(query(params)), (rows) => rows.length > 0 ? rows[0] : null);
		}
		return Promise.resolve((client as Client).all<findPostBySlug.Result>(query(params))).then((rows) => rows.length > 0 ? rows[0] : null);
	} as findPostBySlugFn,
	{ sql, query },
);

export namespace findPostBySlug {
	export type Params = {
		slug: string;
	};
	export type Result = {
		id: number;
		slug: string;
		title?: string;
	};
}
```

```ts (sql/.generated/index.ts)
export * from "./tables.js";
export * from "./queries.js";
export * from "./effect.js";
```

</details>
