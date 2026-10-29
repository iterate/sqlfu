// sqlfu's side of the Standard Query spec (types in ./vendor/standard-query.ts, from reylo):
// `executeStandardQuery` is how every client's `execute` runs one, and `standardQuery` is how a
// generated wrapper becomes one.
import type {AsyncClient, Client, QueryArg, SqlQuery, SyncClient} from './types.js';
import type {StandardQueryV1, StandardTypedV1} from './vendor/standard-query.js';

export type {StandardQueryV1, StandardTypedV1} from './vendor/standard-query.js';

/**
 * Bind `encode(input)`, read every row as an array with `client.values` (so hooks and error
 * mapping apply), and return `decode(rows)`.
 */
export function executeStandardQuery<TQuery extends StandardQueryV1>(
  client: SyncClient,
  standardQuery: TQuery,
  input: unknown,
): StandardTypedV1.InferOutput<TQuery>;
export function executeStandardQuery<TQuery extends StandardQueryV1>(
  client: AsyncClient,
  standardQuery: TQuery,
  input: unknown,
): Promise<StandardTypedV1.InferOutput<TQuery>>;
export function executeStandardQuery(client: Client, standardQuery: StandardQueryV1, input: unknown): unknown {
  const query = standardQuery['~standard'].query;
  // `system` is OTel's `db.system.name`, which spells Postgres in full.
  const dialect = client.system === 'postgresql' ? 'postgres' : client.system;
  if (query.dialect !== dialect) {
    throw new TypeError(`This query is written for ${query.dialect}, and this client runs ${dialect}.`);
  }
  const statement = {sql: query.text, args: query.encode(input) as QueryArg[]};
  if (client.sync) {
    return query.decode(client.values(statement));
  }
  return (client as AsyncClient).values(statement).then((rows) => query.decode(rows));
}

/**
 * The `~standard` members of a generated SQLite wrapper, so other Standard Query drivers (and
 * `client.execute`) can run it. `encode` binds what the wrapper's `query` binds; `decode` keys each
 * row by `columns` (the raw column names, in select order) and hands the rows to `output`, which
 * maps and picks cardinality exactly as the wrapper function does.
 *
 * Only for wrappers whose statement text doesn't depend on the input (no runtime-expanded params),
 * as the spec requires.
 */
export function standardQuery<TInput = {}, TOutput = undefined>(definition: {
  sql: string;
  query: SqlQuery | ((params: TInput) => SqlQuery);
  columns: string[];
  output: (rows: any[]) => TOutput;
}): StandardQueryV1.Props<TInput, TOutput, 'sqlite'> {
  const {sql, query, columns, output} = definition;
  return {
    version: 1,
    vendor: 'sqlfu',
    query: {
      dialect: 'sqlite',
      text: sql,
      encode(input) {
        const bound = typeof query === 'function' ? query(input as TInput) : query;
        // SQLite has no boolean storage class: its raw form is 1 or 0.
        return bound.args.map((arg) => (typeof arg === 'boolean' ? Number(arg) : arg));
      },
      decode(rows) {
        return output(
          rows.map((row) => {
            if (row.length !== columns.length) {
              throw new TypeError(`The statement selects ${columns.length} columns, and a row has ${row.length}.`);
            }
            return Object.fromEntries(columns.map((column, index) => [column, row[index]]));
          }),
        );
      },
    },
  };
}
