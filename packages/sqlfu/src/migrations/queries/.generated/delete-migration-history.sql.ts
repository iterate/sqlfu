import type {Client, SqlQuery} from 'sqlfu';

export const DeleteMigrationHistorySql = `
delete from sqlfu_migrations;
`

export async function deleteMigrationHistory(client: Client): Promise<void> {
	const query: SqlQuery = { sql: DeleteMigrationHistorySql, args: [], name: "delete-migration-history" };
	await client.run(query);
}
