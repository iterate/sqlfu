// sqlfu's side of the Standard Query spec (types in ./vendor/standard-query.ts, from reylo):
// `executeStandardQuery` is how every client's `execute` runs one.
import type {AsyncClient, Client, QueryArg, SyncClient} from './types.js';
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
  return client.values(statement).then((rows) => query.decode(rows));
}
