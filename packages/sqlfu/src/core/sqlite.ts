import type {AsyncClient, Client, QueryArg, SyncClient} from './types.js';

export async function extractSchema(client: Client, schemaName = 'main'): Promise<string> {
  const rows = await client.all<{sql: string | null}>({
    sql: `
      select sql
      from ${schemaName}.sqlite_schema
      where sql is not null
        and name not like 'sqlite_%'
        and name != 'sqlfu_migrations'
      order by type, name
    `,
    args: [],
  });

  return rows.map((row) => `${String(row.sql).toLowerCase()};`).join('\n');
}

export function rawSqlWithSqlSplittingSync(
  runOne: (query: {sql: string; args: readonly QueryArg[]}) => {rowsAffected?: number; lastInsertRowid?: string | number | bigint | null},
  sql: string,
) {
  const statements = splitSqlStatements(sql);
  if (statements.length <= 1) {
    return runOne({sql, args: []});
  }

  let lastResult = {};
  for (const statement of statements) {
    lastResult = runOne({sql: statement, args: []});
  }
  return lastResult;
}

export async function rawSqlWithSqlSplittingAsync(
  runOne: (query: {sql: string; args: readonly QueryArg[]}) => Promise<{rowsAffected?: number; lastInsertRowid?: string | number | bigint | null}>,
  sql: string,
) {
  const statements = splitSqlStatements(sql);
  if (statements.length <= 1) {
    return runOne({sql, args: []});
  }

  let lastResult = {};
  for (const statement of statements) {
    lastResult = await runOne({sql: statement, args: []});
  }
  return lastResult;
}

export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let index = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (index < sql.length) {
    const char = sql[index]!;
    const next = sql[index + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') {
        inLineComment = false;
      }
      index += 1;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        inBlockComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '-' && next === '-') {
      inLineComment = true;
      current += char;
      current += next;
      index += 2;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '/' && next === '*') {
      inBlockComment = true;
      current += char;
      current += next;
      index += 2;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      current += char;
      if (inSingleQuote && next === "'") {
        current += next;
        index += 2;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      index += 1;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      current += char;
      if (inDoubleQuote && next === '"') {
        current += next;
        index += 2;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      index += 1;
      continue;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement && stripSqlComments(statement).trim()) {
        statements.push(`${statement};`);
      }
      current = '';
      index += 1;
      continue;
    }

    current += char;
    index += 1;
  }

  const trailing = current.trim();
  if (trailing && stripSqlComments(trailing).trim()) {
    statements.push(trailing);
  }

  return statements;
}

export function surroundWithBeginCommitRollbackSync<TDriver, TResult>(
  client: SyncClient<TDriver>,
  fn: (tx: SyncClient<TDriver>) => TResult,
): TResult;
export function surroundWithBeginCommitRollbackSync<TDriver, TResult>(
  client: SyncClient<TDriver>,
  fn: (tx: SyncClient<TDriver>) => Promise<TResult>,
): Promise<TResult>;
export function surroundWithBeginCommitRollbackSync<TDriver, TResult>(
  client: SyncClient<TDriver>,
  fn: (tx: SyncClient<TDriver>) => TResult | Promise<TResult>,
): TResult | Promise<TResult> {
  client.run({sql: 'begin', args: []});
  try {
    const result = fn(client);
    if (isPromiseLike(result)) {
      return result.then(
        (value) => {
          client.run({sql: 'commit', args: []});
          return value;
        },
        (error) => {
          client.run({sql: 'rollback', args: []});
          throw error;
        },
      );
    }
    client.run({sql: 'commit', args: []});
    return result;
  } catch (error) {
    client.run({sql: 'rollback', args: []});
    throw error;
  }
}

export async function surroundWithBeginCommitRollbackAsync<TDriver, TResult>(
  client: AsyncClient<TDriver>,
  fn: (tx: AsyncClient<TDriver>) => Promise<TResult> | TResult,
): Promise<TResult> {
  await client.run({sql: 'begin', args: []});
  try {
    const result = await fn(client);
    await client.run({sql: 'commit', args: []});
    return result;
  } catch (error) {
    await client.run({sql: 'rollback', args: []});
    throw error;
  }
}

function stripSqlComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function isPromiseLike<TResult>(value: TResult | Promise<TResult>): value is Promise<TResult> {
  return typeof value === 'object' && value !== null && 'then' in value;
}
