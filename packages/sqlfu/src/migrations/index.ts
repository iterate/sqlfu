import type {Client} from '../core/types.js';
import {runSqlStatements} from '../core/sqlite.js';

export type Migration = {
  path: string;
  content: string;
};

export async function applyMigrations(client: Client, params: {
  migrations: readonly Migration[];
}): Promise<void> {
  for (const migration of params.migrations) {
    await runSqlStatements(client, migration.content);
  }
}
