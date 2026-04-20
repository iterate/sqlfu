import type {Client, SqlQuery} from 'sqlfu';

export type SelectMigrationHistoryResult = {
	name: string;
	checksum: string;
	applied_at: string;
}

export const SelectMigrationHistorySql = `
select name, checksum, applied_at
from sqlfu_migrations
order by name;
`

export async function selectMigrationHistory(client: Client): Promise<SelectMigrationHistoryResult[]> {
	const query: SqlQuery = { sql: SelectMigrationHistorySql, args: [], name: "select-migration-history" };
	return client.all<SelectMigrationHistoryResult>(query);
}
