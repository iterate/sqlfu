Param-type inference fixtures: how `sqlfu generate` types each `:param` from the column it's
compared to, including when that column belongs to a joined table or a subquery.

<details>
<summary>default config</summary>

```ts (sqlfu.config.ts)
export default {
  db: './app.db',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
};
```

</details>

## types a param from the joined table column it is compared to

<details data-outputs="sql/.generated/find-session-user.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table users (id integer primary key, login text not null);
create table sessions (id text primary key, user_id integer not null references users (id));
```

```sql (sql/find-session-user.sql)
select u.login
from sessions s
join users u on u.id = s.user_id
where s.id = :sessionId;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/find-session-user.sql.ts)
import type {Client} from 'sqlfu';

const sql = `
select u.login
from sessions s
join users u on u.id = s.user_id
where s.id = ?;
`.trim();
const query = (params: findSessionUser.Params) => ({
	name: "findSessionUser",
	sql,
	args: [params.sessionId],
});

export const findSessionUser = Object.assign(
	async function findSessionUser(client: Client, params: findSessionUser.Params): Promise<findSessionUser.Result[]> {
		return client.all<findSessionUser.Result>(query(params));
	},
	{ sql, query },
);

export namespace findSessionUser {
	export type Params = {
		sessionId: string;
	};
	export type Result = {
		login: string;
	};
}
```

</details>

## types a param from the subquery column it is compared to

<details data-outputs="sql/.generated/find-session-user.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table users (id integer primary key, login text not null);
create table sessions (id text primary key, user_id integer not null references users (id));
```

```sql (sql/find-session-user.sql)
select u.login
from users u
where u.id = (select s.user_id from sessions s where s.id = :sessionId);
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/find-session-user.sql.ts)
import type {Client} from 'sqlfu';

const sql = `
select u.login
from users u
where u.id = (select s.user_id from sessions s where s.id = ?);
`.trim();
const query = (params: findSessionUser.Params) => ({
	name: "findSessionUser",
	sql,
	args: [params.sessionId],
});

export const findSessionUser = Object.assign(
	async function findSessionUser(client: Client, params: findSessionUser.Params): Promise<findSessionUser.Result | null> {
		const rows = await client.all<findSessionUser.Result>(query(params));
		return rows.length > 0 ? rows[0] : null;
	},
	{ sql, query },
);

export namespace findSessionUser {
	export type Params = {
		sessionId: string;
	};
	export type Result = {
		login: string;
	};
}
```

</details>

## types a param used more than once as one param

<details data-outputs="sql/.generated/find-related-posts.sql.ts">
<summary>input</summary>

```sql (definitions.sql)
create table posts (id integer primary key, parent_id integer);
```

```sql (sql/find-related-posts.sql)
select id from posts where id = :id or parent_id = :id;
```

</details>

<details>
<summary>output</summary>

```ts (sql/.generated/find-related-posts.sql.ts)
import type {Client} from 'sqlfu';

const sql = `select id from posts where id = ? or parent_id = ?;`;
const query = (params: findRelatedPosts.Params) => ({
	name: "findRelatedPosts",
	sql,
	args: [params.id, params.id],
});

export const findRelatedPosts = Object.assign(
	async function findRelatedPosts(client: Client, params: findRelatedPosts.Params): Promise<findRelatedPosts.Result[]> {
		return client.all<findRelatedPosts.Result>(query(params));
	},
	{ sql, query },
);

export namespace findRelatedPosts {
	export type Params = {
		id: number;
	};
	export type Result = {
		id: number;
	};
}
```

</details>
