Native runtime fixtures: `generate.runtime` can emit wrappers that call a user's
existing SQLite driver directly, so generated production query modules do not
import `sqlfu`.

## emits node:sqlite wrappers

<details data-outputs="sql/.generated/list-posts.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  slug text not null,
  title text not null
);
```

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: 'node:sqlite',
  },
};
```

```sql (sql/list-posts.sql)
select id, slug, title from posts order by id limit :limit;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/list-posts.sql.ts)
import type {DatabaseSync as Database} from 'node:sqlite';

const sql = `select id, slug, title from posts order by id limit ?;`;
const query = (params: listPosts.Params) => ({ name: "listPosts", sql, args: [params.limit] });

export const listPosts = Object.assign(
	function listPosts(database: Database, params: listPosts.Params): listPosts.Result[] {
		const generatedQuery = query(params);
		const rows = database.prepare(generatedQuery.sql).all(...generatedQuery.args) as listPosts.Result[];
		return rows;
	},
	{ sql, query },
);

export namespace listPosts {
	export type Params = {
		limit: number;
	};
	export type Result = {
		id: number;
		slug: string;
		title: string;
	};
}
```

</details>

## emits better-sqlite3 wrappers

<details data-outputs="sql/.generated/list-posts.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  slug text not null,
  title text not null
);
```

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: 'better-sqlite3',
  },
};
```

```sql (sql/list-posts.sql)
select id, slug, title from posts order by id limit :limit;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/list-posts.sql.ts)
import type Database from 'better-sqlite3';

const sql = `select id, slug, title from posts order by id limit ?;`;
const query = (params: listPosts.Params) => ({ name: "listPosts", sql, args: [params.limit] });

export const listPosts = Object.assign(
	function listPosts(database: Database, params: listPosts.Params): listPosts.Result[] {
		const generatedQuery = query(params);
		const rows = database.prepare(generatedQuery.sql).all(...generatedQuery.args) as listPosts.Result[];
		return rows;
	},
	{ sql, query },
);

export namespace listPosts {
	export type Params = {
		limit: number;
	};
	export type Result = {
		id: number;
		slug: string;
		title: string;
	};
}
```

</details>

## emits bun:sqlite wrappers

<details data-outputs="sql/.generated/list-posts.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  slug text not null,
  title text not null
);
```

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: 'bun:sqlite',
  },
};
```

```sql (sql/list-posts.sql)
select id, slug, title from posts order by id limit :limit;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/list-posts.sql.ts)
import type {Database} from 'bun:sqlite';

const sql = `select id, slug, title from posts order by id limit ?;`;
const query = (params: listPosts.Params) => ({ name: "listPosts", sql, args: [params.limit] });

export const listPosts = Object.assign(
	function listPosts(database: Database, params: listPosts.Params): listPosts.Result[] {
		const generatedQuery = query(params);
		const rows = database.query(generatedQuery.sql).all(...generatedQuery.args) as listPosts.Result[];
		return rows;
	},
	{ sql, query },
);

export namespace listPosts {
	export type Params = {
		limit: number;
	};
	export type Result = {
		id: number;
		slug: string;
		title: string;
	};
}
```

</details>

## emits libsql wrappers

<details data-outputs="sql/.generated/list-posts.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  slug text not null,
  title text not null
);
```

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: 'libsql',
  },
};
```

```sql (sql/list-posts.sql)
select id, slug, title from posts order by id limit :limit;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/list-posts.sql.ts)
import type {Database} from 'libsql';

const sql = `select id, slug, title from posts order by id limit ?;`;
const query = (params: listPosts.Params) => ({ name: "listPosts", sql, args: [params.limit] });

export const listPosts = Object.assign(
	function listPosts(database: Database, params: listPosts.Params): listPosts.Result[] {
		const generatedQuery = query(params);
		const rows = database.prepare(generatedQuery.sql).all(...generatedQuery.args) as listPosts.Result[];
		return rows;
	},
	{ sql, query },
);

export namespace listPosts {
	export type Params = {
		limit: number;
	};
	export type Result = {
		id: number;
		slug: string;
		title: string;
	};
}
```

</details>

## emits @libsql/client wrappers

<details data-outputs="sql/.generated/list-posts.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  slug text not null,
  title text not null
);
```

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    runtime: '@libsql/client',
  },
};
```

```sql (sql/list-posts.sql)
select id, slug, title from posts order by id limit :limit;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/list-posts.sql.ts)
import type {Client} from '@libsql/client';

const sql = `select id, slug, title from posts order by id limit ?;`;
const query = (params: listPosts.Params) => ({ name: "listPosts", sql, args: [params.limit] });

export const listPosts = Object.assign(
	async function listPosts(client: Client, params: listPosts.Params): Promise<listPosts.Result[]> {
		const generatedQuery = query(params);
		const result = await client.execute({sql: generatedQuery.sql, args: [...generatedQuery.args]});
		const rows = result.rows.map((row) => ({...row})) as unknown as listPosts.Result[];
		return rows;
	},
	{ sql, query },
);

export namespace listPosts {
	export type Params = {
		limit: number;
	};
	export type Result = {
		id: number;
		slug: string;
		title: string;
	};
}
```

</details>
