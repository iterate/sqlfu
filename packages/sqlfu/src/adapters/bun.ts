import {wrapSyncClientErrors} from '../adapter-errors.js';
import {bindSyncSql} from '../sql.js';
import {bindSqlParamsToPrefixedRecord} from '../sql-params.js';
import {rawSqlWithSqlSplittingSync, surroundWithBeginCommitRollbackSync} from '../sqlite-text.js';
import type {PreparedStatementParams, ResultRow, SqlQuery, SyncClient, SyncPreparedStatement} from '../types.js';

export interface BunSqliteStatementLike<TRow extends ResultRow = ResultRow> {
  all(...params: unknown[]): TRow[];
  iterate(...params: unknown[]): IterableIterator<TRow>;
  run?(...params: unknown[]): {
    changes?: number;
    lastInsertRowid?: string | number | bigint | null;
  };
  /** Optional. bun:sqlite `Statement.finalize()` releases the underlying VM. */
  finalize?(): void;
}

export interface BunSqliteDatabaseLike {
  query<TRow extends ResultRow = ResultRow>(query: string): BunSqliteStatementLike<TRow>;
  run(
    query: string,
    params?: unknown[] | Record<string, unknown>,
  ): {
    changes?: number;
    lastInsertRowid?: string | number | bigint | null;
  };
}

export function createBunClient(database: BunSqliteDatabaseLike): SyncClient<BunSqliteDatabaseLike> {
  const client: Omit<SyncClient<BunSqliteDatabaseLike>, 'sql'> & {sql: SyncClient<BunSqliteDatabaseLike>['sql']} = {
    driver: database,
    system: 'sqlite',
    sync: true,
    all<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      return database.query<TRow>(query.sql).all(...query.args);
    },
    run(query: SqlQuery) {
      const result = database.run(query.sql, [...query.args]);
      return {
        rowsAffected: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      };
    },
    raw(sql: string) {
      return rawSqlWithSqlSplittingSync((singleQuery) => {
        const result = database.run(singleQuery.sql, [...singleQuery.args]);
        return {
          rowsAffected: result.changes,
          lastInsertRowid: result.lastInsertRowid,
        };
      }, sql);
    },
    *iterate<TRow extends ResultRow = ResultRow>(query: SqlQuery) {
      yield* database.query<TRow>(query.sql).iterate(...query.args);
    },
    prepare<TRow extends ResultRow = ResultRow>(sql: string): SyncPreparedStatement<TRow> {
      // bun:sqlite `Statement` accepts either positional spread or a single
      // prefixed named-param object. Sqlfu's public prepare surface accepts
      // bare named params, so bindArgs normalizes records before spreading.
      const statement = database.query<TRow>(sql);
      return {
        all(params) {
          return statement.all(...bindArgs(sql, params));
        },
        run(params) {
          // Bun's Statement may not expose `.run` on every version; fall back
          // to driver-level `database.run` for that path. Loses statement
          // reuse for `.run`, keeps the API contract.
          if (statement.run) {
            const result = statement.run(...bindArgs(sql, params));
            return {
              rowsAffected: result.changes,
              lastInsertRowid: result.lastInsertRowid,
            };
          }
          const boundParams = bindSqlParamsToPrefixedRecord(sql, params);
          const fallback = boundParams ? database.run(sql, boundParams) : database.run(sql);
          return {
            rowsAffected: fallback.changes,
            lastInsertRowid: fallback.lastInsertRowid,
          };
        },
        *iterate(params) {
          yield* statement.iterate(...bindArgs(sql, params));
        },
        [Symbol.dispose]() {
          statement.finalize?.();
        },
      };
    },
    transaction<TResult>(fn: (tx: SyncClient<BunSqliteDatabaseLike>) => TResult | Promise<TResult>) {
      return surroundWithBeginCommitRollbackSync(client, fn);
    },
    sql: undefined as unknown as SyncClient<BunSqliteDatabaseLike>['sql'],
  } satisfies SyncClient<BunSqliteDatabaseLike>;

  client.sql = bindSyncSql(client);

  return wrapSyncClientErrors(client);
}

export const createBunDatabase = createBunClient;

function bindArgs(sql: string, params: PreparedStatementParams | undefined): unknown[] {
  const boundParams = bindSqlParamsToPrefixedRecord(sql, params);
  if (boundParams == null) return [];
  if (Array.isArray(boundParams)) return boundParams;
  return [boundParams];
}
