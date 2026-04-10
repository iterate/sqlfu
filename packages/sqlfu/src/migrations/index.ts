import type {Client} from '../core/types.js';

export type Migration = {
  path: string;
  content: string;
};

export async function applyMigrations(client: Client, params: {
  migrations: readonly Migration[];
}): Promise<void> {
  for (const migration of params.migrations) {
    await applySqlScript(client, migration.content);
  }
}

async function applySqlScript(client: Client, sql: string) {
  for (const statement of splitSqlStatements(sql)) {
    if (stripSqlComments(statement).trim() === '') {
      continue;
    }

    try {
      await client.run({sql: statement, args: []});
    } catch (error) {
      throw new Error(summarizeDatabaseError(error));
    }
  }
}

function splitSqlStatements(sql: string) {
  // Pain point: sqlfu still has to decide how to split multi-statement SQL scripts instead of delegating that to a lower-level primitive.
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

function stripSqlComments(sql: string) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function summarizeDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^SQLITE_ERROR:\s*/u, '').trim();
}
