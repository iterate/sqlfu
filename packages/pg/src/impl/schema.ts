// `materializeSchemaSql` + `extractSchemaFromClient` for postgres.
//
// `materializeSchemaSql` opens a scratch database, applies the user's DDL,
// extracts the canonical schema, drops the database. Used by the diff
// orchestration in main sqlfu's api/internal.ts (`materializeDefinitionsSchemaFor`,
// `materializeMigrationsSchemaFor`).
//
// `extractSchemaFromClient` reads schema from a live client. Used by the
// `live_schema` typegen authority and by drift checks against the user's
// production database. The output is a sequence of `create table` /
// `create view` / index DDL statements joined into one canonical string.
//
// **Wart:** the schema-extraction path here uses ad-hoc pg_catalog queries.
// We don't go through `@pgkit/schemainspect`'s richer schema-to-DDL render
// because that would couple us to its internal types. Phase C (vendoring
// schemainspect with adapters for sqlfu's AsyncClient) will replace this
// with a more complete extractor that handles triggers, sequences,
// custom types, foreign-data wrappers, etc.
import {createClient} from '@pgkit/client';
import type {AsyncClient, Dialect, SqlfuHost} from 'sqlfu';

import {createTempDatabase} from './scratch-database.js';

// SQL queries shared between the two execution paths (pgkit client used
// inside materializeSchemaSql; sqlfu AsyncClient used inside
// extractSchemaFromClient). Both clients produce the same row shape — only
// the placeholder syntax (positional `$1`) is dialect-portable here.

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

/**
 * Run a parametrized pg query. Each impl-side adapter (pgkit-backed or
 * sqlfu-AsyncClient-backed) supplies its own runner.
 */
type QueryRunner = <TRow extends Record<string, unknown>>(sql: string, args: unknown[]) => Promise<TRow[]>;

export const pgMaterializeSchemaSql = (adminUrl: string): Dialect['materializeSchemaSql'] => {
  return async (_host: SqlfuHost, input) => {
    await using temp = await createTempDatabase(adminUrl);
    const client = createClient(temp.url);
    try {
      if (input.sourceSql.trim()) {
        await client.query(client.sql.raw(input.sourceSql));
      }
      const runner: QueryRunner = async <TRow extends Record<string, unknown>>(sql: string, args: unknown[]) =>
        (await client.any<TRow>(client.sql.raw<TRow>(sql, args))) as TRow[];
      return await renderCanonicalSchema(runner, {excludedTables: input.excludedTables ?? []});
    } finally {
      await client.end();
    }
  };
};

export const pgExtractSchemaFromClient: Dialect['extractSchemaFromClient'] = async (client, options) => {
  if (client.sync) {
    throw new Error('pgDialect.extractSchemaFromClient requires an AsyncClient (no sync pg drivers exist).');
  }
  const runner: QueryRunner = async (sql, args) =>
    (await (client as AsyncClient).all({sql, args: args as never})) as never;
  return renderCanonicalSchema(runner, {excludedTables: options?.excludedTables ?? []});
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
