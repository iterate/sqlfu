import type {Client, SqlQuery} from 'sqlfu';

export const EnsureMigrationTableSql = `
create table if not exists sqlfu_migrations(
  name text primary key check(name not like '%.sql'),
  checksum text not null,
  applied_at text not null
);
`

export async function ensureMigrationTable(client: Client): Promise<void> {
	const query: SqlQuery = { sql: EnsureMigrationTableSql, args: [], name: "ensure-migration-table" };
	await client.run(query);
}
