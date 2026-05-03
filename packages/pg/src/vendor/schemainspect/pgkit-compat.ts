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
}

/**
 * Build a `{sql, args}` from a tagged-template literal. Each interpolation
 * becomes a `$N` positional placeholder. Schemainspect interpolates only
 * scalar values (server_version probe), so this naive shape is enough.
 */
const sqlTag: SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]): SqlFragment => {
  let combined = '';
  const args: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    combined += strings[i];
    if (i < values.length) {
      args.push(values[i]);
      combined += `$${args.length}`;
    }
  }
  return {sql: combined, args};
}) as SqlTag;

sqlTag.raw = (query: string): SqlFragment => ({sql: query, args: []});

export const sql = sqlTag;

/**
 * The Queryable surface schemainspect relies on. Intentionally narrower
 * than pgkit's full `Queryable` — if a vendored upstream change ever
 * pulls in another method, expand here rather than the full interface.
 */
export interface Queryable {
  any<TRow extends Record<string, unknown>>(query: SqlFragment): Promise<TRow[]>;
  oneFirst<TRow extends Record<string, unknown>>(query: SqlFragment): Promise<TRow[keyof TRow]>;
}

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
  };
}
