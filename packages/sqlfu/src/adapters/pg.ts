// Postgres runtime adapter. Type-only — sqlfu does NOT depend on `pg`. Users
// install `pg` themselves, build a `Pool` (or compatible), and pass it in.
//
// This adapter belongs in the main `sqlfu` package (not `@sqlfu/pg`) because
// adapters are *transport*: pgDialect is a dev-time concern (typegen, schema
// diff), but `createNodePostgresClient` is what runs at runtime when the
// user's app reads/writes their database. Same pattern as the existing
// sqlite adapters.
import {wrapAsyncClientErrors} from '../adapter-errors.js';
import {bindAsyncSql} from '../sql.js';
import {rewriteNamedParamsToPositional, surroundWithBeginCommitRollbackAsync} from '../sqlite-text.js';
import type {AsyncClient, PreparedStatement, ResultRow, SqlQuery} from '../types.js';

/**
 * Structural type matching `pg.Pool` (or a `pg.PoolClient` from `pool.connect()`).
 * Sqlfu binds against this shape rather than the concrete pg classes so
 * users can pass mocks / wrappers / proxy clients (pgbouncer-aware
 * pools, retrying clients, instrumentation shims, etc.) without sqlfu
 * needing to know about them.
 *
 * The minimum surface sqlfu needs:
 *   - `query(text, values?)` → `{rows, rowCount}`-shaped result
 *   - `connect()` → a session-bound queryable with `release()` for transactions
 */
export interface NodePostgresLike {
  query<TRow extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<NodePostgresQueryResult<TRow>>;
  /**
   * Acquire a session-bound queryable. Used for transactions: begin/commit
   * are sent on the same connection. Implementations must return a queryable
   * with a `release()` method that returns it to the pool.
   */
  connect?(): Promise<NodePostgresPoolClientLike>;
}

export interface NodePostgresQueryResult<TRow extends Record<string, unknown> = Record<string, unknown>> {
  rows: TRow[];
  rowCount?: number | null;
  command?: string;
  /** Optional pg-specific oid for the inserted row's primary key, when applicable. */
  oid?: number;
}

export interface NodePostgresPoolClientLike {
  query<TRow extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<NodePostgresQueryResult<TRow>>;
  release(err?: unknown): void;
}

export function createNodePostgresClient(pool: NodePostgresLike): AsyncClient<NodePostgresLike> {
  // `all`/`run`/`iterate` accept SQL with sqlite-style `?` placeholders.
  // Rewrite to pg's `$N` form before executing — same `rewriteForPg`
  // call site that `prepare(...)` uses internally. Skipping this is a
  // silent landmine: pg sees `?` as illegal syntax and complains about
  // the next character (typically a comma in a values list), masking
  // the real cause. `iterate` chains through `all` so it inherits the
  // rewrite for free.
  const all: AsyncClient<NodePostgresLike>['all'] = async <TRow extends ResultRow = ResultRow>(
    sqlQuery: SqlQuery,
  ): Promise<TRow[]> => {
    const {sql, args} = rewriteForPg(sqlQuery.sql, sqlQuery.args);
    const result = await pool.query<Record<string, unknown>>(sql, args);
    return result.rows as unknown as TRow[];
  };
  const run: AsyncClient<NodePostgresLike>['run'] = async (sqlQuery: SqlQuery) => {
    const {sql, args} = rewriteForPg(sqlQuery.sql, sqlQuery.args);
    const result = await pool.query(sql, args);
    return {
      rowsAffected: result.rowCount ?? undefined,
      lastInsertRowid: null,
    };
  };
  const raw: AsyncClient<NodePostgresLike>['raw'] = async (sql: string) => {
    // `pool.query(sql)` (no params) is multi-statement-friendly in node-postgres
    // for simple-query-protocol calls. Send the whole script as one query and
    // surface the result-count in aggregate; sqlfu's existing splitters are
    // sqlite-flavored (handle `pragma`, etc.) and would mis-split pg dollar-
    // quoted bodies.
    const result = await pool.query(sql);
    return {
      rowsAffected: result.rowCount ?? undefined,
      lastInsertRowid: null,
    };
  };
  const iterate: AsyncClient<NodePostgresLike>['iterate'] = async function* <TRow extends ResultRow = ResultRow>(
    sqlQuery: SqlQuery,
  ) {
    for (const row of await all<TRow>(sqlQuery)) {
      yield row;
    }
  };
  const prepare: AsyncClient<NodePostgresLike>['prepare'] = <TRow extends ResultRow = ResultRow>(
    sql: string,
  ): PreparedStatement<TRow> => {
    // node-postgres caches its own prepared statements via the `name` field
    // when set; we don't currently use that — sqlfu's prepared-statement
    // contract is a re-usable handle, and pg's pool will plan-cache the same
    // text on its own. Named-param Record support routes through the shared
    // tokenizer (positional `$1, $2, …` rewrite happens inside).
    return {
      async all(params) {
        const {sql: rewrittenSql, args} = rewriteForPg(sql, params);
        const result = await pool.query<Record<string, unknown>>(rewrittenSql, args);
        return result.rows as unknown as TRow[];
      },
      async run(params) {
        const {sql: rewrittenSql, args} = rewriteForPg(sql, params);
        const result = await pool.query(rewrittenSql, args);
        return {
          rowsAffected: result.rowCount ?? undefined,
          lastInsertRowid: null,
        };
      },
      async *iterate(params) {
        const {sql: rewrittenSql, args} = rewriteForPg(sql, params);
        const result = await pool.query<Record<string, unknown>>(rewrittenSql, args);
        for (const row of result.rows) {
          yield row as unknown as TRow;
        }
      },
      async [Symbol.asyncDispose]() {},
    };
  };
  const pgClient: Omit<AsyncClient<NodePostgresLike>, 'sql'> & {sql: AsyncClient<NodePostgresLike>['sql']} = {
    driver: pool,
    system: 'postgresql',
    sync: false,
    all,
    run,
    raw,
    iterate,
    prepare,
    async transaction<TResult>(fn: (tx: AsyncClient<NodePostgresLike>) => Promise<TResult> | TResult) {
      // Reuse the begin/commit/rollback wrapper that sqlite uses. Postgres
      // accepts these statements on the simple protocol identically. For
      // session-bound transactions (i.e. multiple statements landing on the
      // same connection), we acquire a `PoolClient` via `pool.connect()`,
      // build a thin sub-client whose `query` routes to that connection, and
      // run `fn` inside `surroundWithBeginCommitRollbackAsync` against it.
      // Without a session, `fn` could land on different pool connections
      // mid-transaction — wrong behavior.
      if (typeof pool.connect !== 'function') {
        // No pool.connect available — fall back to single-pool execution.
        // This is correct for `Pool` instances at low concurrency but breaks
        // with concurrent calls. Documented limitation.
        return surroundWithBeginCommitRollbackAsync(pgClient, fn);
      }
      const session = await pool.connect();
      try {
        const sessionPool: NodePostgresLike = {
          // Only forward `values` when it's actually defined — node-postgres
          // switches to the extended query protocol the moment a `values`
          // arg is present, even an `undefined` one. Extended protocol
          // doesn't accept multi-statement SQL, so any `tx.raw()` of a
          // multi-statement migration would fail with an opaque
          // `syntax error at or near ","` (node-postgres parses the second
          // statement's first comma as if it ended a previous parameterized
          // call). Forwarding only the args the caller passed keeps simple-
          // query-protocol calls on the simple path.
          query: (text, values) =>
            values === undefined ? session.query(text) : session.query(text, values),
        };
        const sessionClient = createNodePostgresClient(sessionPool);
        return await surroundWithBeginCommitRollbackAsync(sessionClient, fn);
      } finally {
        session.release();
      }
    },
    sql: undefined as unknown as AsyncClient<NodePostgresLike>['sql'],
  } satisfies AsyncClient<NodePostgresLike>;

  pgClient.sql = bindAsyncSql(pgClient);
  return wrapAsyncClientErrors(pgClient);
}

export const createNodePostgresDatabase = createNodePostgresClient;

/**
 * Translate sqlfu's prepared-statement params into pg's positional `$1, $2, …`
 * shape. Reuses the sqlite-side rewriter — it's actually dialect-neutral, just
 * named after the codebase that first needed it.
 *
 * Wart: the rewriter outputs `?` placeholders which we then map to `$N`. A
 * cleaner refactor would parameterize the rewriter on the placeholder style.
 * Tracked under a follow-up; for now the swap below works correctly because
 * the rewriter only emits `?` for parameter positions (everything else is
 * preserved verbatim).
 */
function rewriteForPg(
  sql: string,
  params: unknown,
): {sql: string; args: unknown[]} {
  if (params == null || Array.isArray(params)) {
    return {sql: convertQuestionMarksToDollarN(sql), args: (params as unknown[]) ?? []};
  }
  const rewritten = rewriteNamedParamsToPositional(sql, params as Record<string, unknown>);
  return {sql: convertQuestionMarksToDollarN(rewritten.sql), args: rewritten.args};
}

function convertQuestionMarksToDollarN(sql: string): string {
  let n = 0;
  let result = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inDollarQuote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inLineComment) {
      result += ch;
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      result += ch;
      if (ch === '*' && sql[i + 1] === '/') {
        result += '/';
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (inDollarQuote != null) {
      result += ch;
      if (ch === '$') {
        const tag = sql.slice(i, i + inDollarQuote.length);
        if (tag === inDollarQuote) {
          result += sql.slice(i + 1, i + inDollarQuote.length);
          i += inDollarQuote.length - 1;
          inDollarQuote = null;
        }
      }
      continue;
    }
    if (inSingleQuote) {
      result += ch;
      if (ch === "'") inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      result += ch;
      if (ch === '"') inDoubleQuote = false;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
      result += ch;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      result += ch;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      inLineComment = true;
      result += ch;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      inBlockComment = true;
      result += ch;
      continue;
    }
    if (ch === '$') {
      const tagMatch = /^\$([A-Za-z_]\w*)?\$/u.exec(sql.slice(i));
      if (tagMatch) {
        inDollarQuote = tagMatch[0];
        result += inDollarQuote;
        i += inDollarQuote.length - 1;
        continue;
      }
    }
    if (ch === '?') {
      n += 1;
      result += `$${n}`;
      continue;
    }
    result += ch;
  }
  return result;
}
