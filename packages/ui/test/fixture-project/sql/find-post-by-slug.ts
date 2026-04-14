import type {Client, SqlQuery} from 'sqlfu';

export type FindPostBySlugParams = {
	slug: string;
}

export type FindPostBySlugResult = {
	id: number;
	slug: string;
	title: string;
	published: number;
}

const FindPostBySlugSql = `
select id, slug, title, published
from posts
where slug = ?
limit 1;
`

export async function findPostBySlug(client: Client, params: FindPostBySlugParams): Promise<FindPostBySlugResult | null> {
	const query: SqlQuery = { sql: FindPostBySlugSql, args: [params.slug] };
	const rows = await client.all<FindPostBySlugResult>(query);
	return rows.length > 0 ? rows[0] : null;
}
