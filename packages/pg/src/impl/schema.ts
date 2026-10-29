// `materializeSchemaSql` + `extractSchemaFromClient` for postgres.
//
// Both render a database's schema as the SQL that would create it from
// nothing: the vendored migra, diffing an empty inspector against the
// inspected database. That's what pgkit's migrator does to write
// `definitions.sql`. `diffSchema` runs the same migra over the same
// inspector, so whatever it can diff, this can render, and a rendered
// schema diffs as identical to its source.
//
// Driver-agnostic: `materializeSchemaSql` opens a connection via sqlfu's
// `createNodePostgresClient` (which wraps a `pg.Pool`); `extractSchemaFromClient`
// uses the `AsyncClient` the caller passes in. Either way we go through
// sqlfu's `AsyncClient` interface — single point where `pg` is touched.
import {Pool} from 'pg';
import {createNodePostgresClient, type AsyncClient, type Dialect, type SqlfuHost} from 'sqlfu';

import {Migration} from '../vendor/migra/index.js';
import {adaptAsyncClient, PostgreSQL} from '../vendor/schemainspect/index.js';
import {createTempDatabase} from './scratch-database.js';

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
      return await renderSchema(client, input.excludedTables || []);
    } finally {
      await pool.end();
    }
  };
};

export const pgExtractSchemaFromClient: Dialect['extractSchemaFromClient'] = async (client, options) => {
  if (client.sync) {
    throw new Error('pgDialect.extractSchemaFromClient requires an AsyncClient (no sync pg drivers exist).');
  }
  return renderSchema(client, options?.excludedTables || []);
};

async function renderSchema(client: AsyncClient, excludedTables: string[]): Promise<string> {
  const inspected = await PostgreSQL.create(adaptAsyncClient(client));

  // Every new database already has these, so creating them is a no-op that
  // only clutters the output.
  delete inspected.schemas.public;
  delete inspected.extensions.plpgsql;

  omitTables(inspected, new Set(excludedTables));

  const migration = await Migration.create(PostgreSQL.empty(), inspected, {
    schema: null,
    exclude_schema: null,
    ignore_extension_versions: true,
  });
  migration.add_all_changes();
  // Not `migration.sql`: its unsafe-drop check is a `/drop\s+/` regex, which a
  // function body can trip, and it leaves migra's ragged blank lines.
  return migration.statements.array.map((statement) => statement.trim()).join('\n\n');
}

/** Remove tables (matched by unqualified name) and the objects attached to them. */
function omitTables(inspected: PostgreSQL, names: Set<string>) {
  // `tables`, `relations` and `selectables` share instances, so identity works across all three.
  const omitted = new Set(Object.values(inspected.tables).filter((table) => names.has(table.name)));
  const isAttached = (item: {schema: string; table_name?: string}) =>
    [...omitted].some((table) => table.schema === item.schema && table.name === item.table_name);

  inspected.tables = pickBy(inspected.tables, (table) => !omitted.has(table));
  inspected.relations = pickBy(inspected.relations, (relation) => !omitted.has(relation));
  inspected.selectables = pickBy(inspected.selectables, (selectable) => !omitted.has(selectable));
  inspected.indexes = pickBy(inspected.indexes, (index) => !isAttached(index));
  inspected.constraints = pickBy(inspected.constraints, (constraint) => !isAttached(constraint));
  inspected.triggers = pickBy(inspected.triggers, (trigger) => !isAttached(trigger));
  inspected.rlspolicies = pickBy(inspected.rlspolicies, (policy) => !isAttached(policy));
  inspected.sequences = pickBy(inspected.sequences, (sequence) => !isAttached(sequence));
}

function pickBy<T>(record: Record<string, T>, keep: (value: T) => boolean): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => keep(value)));
}
