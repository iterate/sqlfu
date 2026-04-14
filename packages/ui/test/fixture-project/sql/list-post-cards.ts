import type {Client, SqlQuery} from 'sqlfu';

export type ListPostCardsResult = {
	id: number;
	slug: string;
	title: string;
	published: number;
}

const ListPostCardsSql = `
select id, slug, title, published
from post_cards
order by id;
`

export async function listPostCards(client: Client): Promise<ListPostCardsResult[]> {
	const query: SqlQuery = { sql: ListPostCardsSql, args: [] };
	return client.all<ListPostCardsResult>(query);
}
