// Minimal pgkit-flavored `Queryable` shim for the vendored schemainspect.
//
// Schemainspect's source code uses just two methods on a pgkit `Queryable`:
//
//   connection.oneFirst<T>(sql`...`) — first column of first row
//   connection.any<T>(sql.raw(query)) — all rows
//
// And the tagged-template `sql` from `@pgkit/client` to build the queries.
// We re-export a compatible-shaped `sql` tag (interpolation produces a
// `{sql, args}` object), and an `adaptAsyncClient(asyncClient)` that wraps
// sqlfu's `AsyncClient` to satisfy the slim Queryable surface.
//
// Keeping the surface this small means schemainspect's source is left
// nearly untouched after vendoring (only the pgkit import line changes).
import type {AsyncClient} from 'sqlfu';

export type SqlFragment = {sql: string; args: unknown[]};

export interface SqlTag {
  (strings: TemplateStringsArray, ...values: unknown[]): SqlFragment;
  raw(query: string): SqlFragment;
  /**
   * Build a quoted identifier (`"foo"`, `"foo"."bar"`) for inline use in
   * a tagged-template SQL. Matches pgkit's `sql.identifier(parts)`.
   */
  identifier(parts: string[]): SqlFragment;
  /**
   * Pgkit's `sql.type(zodSchema)\`...\`` overlay that adds runtime
   * validation. We don't validate here — sqlfu's typegen runs in dev,
   * and the vendored consumers tolerate the unwrapped case (the
   * `// todo: figure out why sql.type(MyZodType) isn't working here`
   * comment in column-info.ts is upstream evidence). Return the same
   * tagged-template behavior, ignoring the schema.
   */
  type<T>(_schema: unknown): (strings: TemplateStringsArray, ...values: unknown[]) => SqlFragment;
}

/**
 * Build a `{sql, args}` from a tagged-template literal. Scalar
 * interpolations become `$N` positional placeholders; nested
 * `SqlFragment` interpolations (e.g. `sql.identifier([...])`,
 * `sql.raw(...)`, or another `sql\`...\``) get inlined verbatim with
 * their args appended in order.
 */
const sqlTag: SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]): SqlFragment => {
  let combined = '';
  const args: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    combined += strings[i];
    if (i < values.length) {
      const value = values[i];
      if (isSqlFragment(value)) {
        // Renumber the fragment's `$N` placeholders against the
        // accumulated args list, then inline.
        const offset = args.length;
        const renumbered = value.sql.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offset}`);
        combined += renumbered;
        args.push(...value.args);
      } else {
        args.push(value);
        combined += `$${args.length}`;
      }
    }
  }
  return {sql: combined, args};
}) as SqlTag;

sqlTag.raw = (query: string): SqlFragment => ({sql: query, args: []});

sqlTag.identifier = (parts: string[]): SqlFragment => ({
  sql: parts.map((part) => `"${part.replaceAll('"', '""')}"`).join('.'),
  args: [],
});

sqlTag.type = (_schema: unknown) => sqlTag;

function isSqlFragment(value: unknown): value is SqlFragment {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as {sql: unknown}).sql === 'string' &&
    Array.isArray((value as {args: unknown}).args)
  );
}

export const sql = sqlTag;

/**
 * The Queryable surface the vendored pgkit packages rely on. Intentionally
 * narrower than pgkit's full `Queryable` — if a vendored upstream change
 * pulls in another method, expand here rather than the full interface.
 */
export interface Queryable {
  any<TRow extends Record<string, unknown>>(query: SqlFragment): Promise<TRow[]>;
  oneFirst<TRow extends Record<string, unknown>>(query: SqlFragment): Promise<TRow[keyof TRow]>;
  /** Used only by `Migration.apply` and the vendored typegen analyzers. */
  query(query: SqlFragment): Promise<{rowCount?: number | null}>;
  /** Used by the vendored typegen for transactional analysis (savepoints + rollback). */
  transaction?<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
}

/**
 * Alias for vendored typegen code that uses pgkit's broader `Client` /
 * `Transactable` types. We treat them all as `Queryable` for our purposes
 * — the methods the vendored code reaches for are all on Queryable.
 */
export type Client = Queryable;
export type Transactable = Queryable;

/** Adapt sqlfu's `AsyncClient` to the narrow Queryable shape above. */
export function adaptAsyncClient(client: AsyncClient): Queryable {
  return {
    async any<TRow extends Record<string, unknown>>(query: SqlFragment): Promise<TRow[]> {
      const rows = await client.all<Record<string, unknown>>({sql: query.sql, args: query.args as never});
      return rows as TRow[];
    },
    async oneFirst<TRow extends Record<string, unknown>>(query: SqlFragment): Promise<TRow[keyof TRow]> {
      const rows = await client.all<Record<string, unknown>>({sql: query.sql, args: query.args as never});
      const first = rows[0];
      if (!first) {
        throw new Error('schemainspect oneFirst expected exactly one row, got 0');
      }
      const firstKey = Object.keys(first)[0];
      return first[firstKey] as TRow[keyof TRow];
    },
    async query(query: SqlFragment): Promise<{rowCount?: number | null}> {
      const result = await client.run({sql: query.sql, args: query.args as never});
      return {rowCount: result.rowsAffected ?? null};
    },
    async transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
      // sqlfu's AsyncClient.transaction takes a callback that gets the tx
      // client. Adapt by re-wrapping the tx client through this shim.
      return client.transaction(async (txClient) => fn(adaptAsyncClient(txClient)));
    },
  };
}
