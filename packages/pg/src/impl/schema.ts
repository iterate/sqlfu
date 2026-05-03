// `materializeSchemaSql` + `extractSchemaFromClient` for postgres.
//
// Both methods share the same `renderCanonicalSchema` engine, which runs a
// fixed set of `pg_catalog` queries through a `QueryRunner` callback. This
// keeps the per-driver surface tiny — the runner is the only thing each
// caller has to supply.
//
// Driver-agnostic: this module no longer reaches for `@pgkit/client`.
// `materializeSchemaSql` opens a connection via sqlfu's
// `createNodePostgresClient` (which wraps a `pg.Pool`); `extractSchemaFromClient`
// uses the `AsyncClient` the caller passes in. Either way we go through
// sqlfu's `AsyncClient` interface — single point where `pg` is touched.
//
// **Wart:** the schema-extraction path here uses ad-hoc pg_catalog queries.
// Phase C5 (vendoring schemainspect with adapters for sqlfu's AsyncClient)
// will replace this with a more complete extractor that handles triggers,
// sequences, custom types, foreign-data wrappers, etc.
import {Pool} from 'pg';
import {createNodePostgresClient, type AsyncClient, type Dialect, type SqlfuHost} from 'sqlfu';

import {createTempDatabase} from './scratch-database.js';

// SQL queries shared between the two execution paths. Both use positional
// `$1` placeholders.

const TABLE_LIST_SQL = `
  select c.relname as name
  from pg_class c
  inner join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname
`;

const VIEW_LIST_SQL = `
  select c.relname as name, pg_get_viewdef(c.oid, true) as definition
  from pg_class c
  inner join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v'
  order by c.relname
`;

const COLUMN_INFO_SQL = `
  select
    a.attname as name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as type_name,
    a.attnotnull as not_null,
    pg_get_expr(d.adbin, d.adrelid) as default_expr
  from pg_attribute a
  inner join pg_class c on c.oid = a.attrelid
  inner join pg_namespace n on n.oid = c.relnamespace
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where n.nspname = 'public'
    and c.relname = $1
    and a.attnum > 0
    and not a.attisdropped
  order by a.attnum
`;

const CONSTRAINT_INFO_SQL = `
  select pg_get_constraintdef(con.oid, true) as def
  from pg_constraint con
  where con.conrelid = (
    select c.oid from pg_class c
    inner join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = $1
  )
  order by con.conname
`;

const INDEX_INFO_SQL = `
  select pg_get_indexdef(i.indexrelid, 0, true) as def
  from pg_index i
  inner join pg_class c on c.oid = i.indrelid
  inner join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = $1
    and not i.indisprimary
    and not exists (
      select 1 from pg_constraint con
      where con.conindid = i.indexrelid and con.contype = 'u'
    )
  order by i.indexrelid
`;

type TableRow = {name: string} & Record<string, unknown>;
type ViewRow = {name: string; definition: string} & Record<string, unknown>;
type ColumnRow = {name: string; type_name: string; not_null: boolean; default_expr: string | null} & Record<
  string,
  unknown
>;
type DefRow = {def: string} & Record<string, unknown>;

/** Run a parametrized pg query through a sqlfu `AsyncClient`. */
type QueryRunner = <TRow extends Record<string, unknown>>(sql: string, args: unknown[]) => Promise<TRow[]>;

function makeRunner(client: AsyncClient): QueryRunner {
  return async <TRow extends Record<string, unknown>>(sql: string, args: unknown[]) =>
    (await client.all({sql, args: args as never})) as TRow[];
}

export const pgMaterializeSchemaSql = (adminUrl: string): Dialect['materializeSchemaSql'] => {
  return async (_host: SqlfuHost, input) => {
    await using temp = await createTempDatabase(adminUrl);
    // Single-connection pool — we only use it for one pass of DDL + queries
    // before disposal.
    const pool = new Pool({connectionString: temp.url, max: 1});
    const client = createNodePostgresClient(pool);
    try {
      if (input.sourceSql.trim()) {
        await client.raw(input.sourceSql);
      }
      return await renderCanonicalSchema(makeRunner(client), {excludedTables: input.excludedTables ?? []});
    } finally {
      await pool.end();
    }
  };
};

export const pgExtractSchemaFromClient: Dialect['extractSchemaFromClient'] = async (client, options) => {
  if (client.sync) {
    throw new Error('pgDialect.extractSchemaFromClient requires an AsyncClient (no sync pg drivers exist).');
  }
  return renderCanonicalSchema(makeRunner(client), {excludedTables: options?.excludedTables ?? []});
};

async function renderCanonicalSchema(
  run: QueryRunner,
  options: {excludedTables: string[]},
): Promise<string> {
  const excluded = new Set(options.excludedTables);

  const tables = await run<TableRow>(TABLE_LIST_SQL, []);
  const tableBlocks: string[] = [];
  for (const row of tables) {
    if (excluded.has(row.name)) continue;
    tableBlocks.push(await renderTableDdl(run, row.name));
  }

  const views = await run<ViewRow>(VIEW_LIST_SQL, []);
  const viewBlocks = views
    .filter((row) => !excluded.has(row.name))
    .map((row) => `create view ${quoteIdent(row.name)} as ${row.definition.trim()}`);

  return [...tableBlocks, ...viewBlocks].join('\n\n');
}

async function renderTableDdl(run: QueryRunner, tableName: string): Promise<string> {
  const columns = await run<ColumnRow>(COLUMN_INFO_SQL, [tableName]);

  const columnLines = columns.map((col) => {
    const parts = [`${quoteIdent(col.name)} ${col.type_name}`];
    if (col.not_null) parts.push('not null');
    if (col.default_expr) parts.push(`default ${col.default_expr}`);
    return parts.join(' ');
  });

  const constraints = await run<DefRow>(CONSTRAINT_INFO_SQL, [tableName]);
  const tableLines = [...columnLines, ...constraints.map((c) => c.def)];
  const tableDdl = `create table ${quoteIdent(tableName)} (\n  ${tableLines.join(',\n  ')}\n);`;

  const indexes = await run<DefRow>(INDEX_INFO_SQL, [tableName]);
  const indexBlocks = indexes.map((idx) => `${idx.def};`);
  return [tableDdl, ...indexBlocks].join('\n');
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}
