// Postgres typegen — three methods on the Dialect contract:
//
//   1. `materializeTypegenSchema` — open a pg connection, create a uniquely-
//      named temp schema, apply the user's DDL there, return a handle whose
//      `Symbol.asyncDispose` drops the schema and closes the connection.
//   2. `loadSchemaForTypegen` — query `information_schema` (and `pg_catalog`
//      for view-column inference) to produce a `RelationInfo` map.
//   3. `analyzeQueries` — `PREPARE` each query and read parameter+result
//      types from `pg_catalog`. Postgres becomes the parser; no third-party
//      AST dep needed.
//
// Wart (carried over from schemadiff): typegen needs a real pg server to
// materialize against. We currently read `SQLFU_PG_TYPEGEN_URL` from env.
// A follow-up will surface a proper config field.
import {createClient, type Client as PgkitClient} from '@pgkit/client';
import type {Dialect, MaterializedTypegenSchema, QueryAnalysis, QueryAnalysisInput, RelationInfo} from 'sqlfu';

type PgMaterializedHandle = MaterializedTypegenSchema & {
  readonly dialect: 'postgresql';
  readonly schema: string;
  readonly client: PgkitClient;
  readonly adminClient: PgkitClient;
};

function assertPgHandle(materialized: MaterializedTypegenSchema): PgMaterializedHandle {
  if (materialized.dialect !== 'postgresql') {
    throw new Error(
      `pgDialect received a MaterializedTypegenSchema produced by '${materialized.dialect}' — dialect handles must not cross dialect boundaries.`,
    );
  }
  return materialized as PgMaterializedHandle;
}

export const pgMaterializeTypegenSchema: Dialect['materializeTypegenSchema'] = async (host, _config) => {
  const url = process.env.SQLFU_PG_TYPEGEN_URL;
  if (!url) {
    throw new Error(
      'pgDialect.materializeTypegenSchema requires a postgres connection URL. Set the `SQLFU_PG_TYPEGEN_URL` environment variable to a postgres URL with create-schema privileges. ' +
        'A follow-up will replace this env-var hack with a proper config field.',
    );
  }
  // TODO: read schema SQL using the same `readSchemaForAuthority` semantics
  // as the sqlite dialect. The sqlite implementation lives in `typegen/index.ts`
  // in the main package and depends on sqlite-specific helpers
  // (`materializeDefinitionsSchemaFor` etc.). We need a dialect-neutral
  // version that produces a single `string` of DDL (concatenated migrations,
  // or the contents of `definitions.sql`, or extracted from a live db) given
  // a `SqlfuProjectConfig` + `SqlfuHost`. Stub: read `definitions.sql`
  // directly. This will miss the `'migrations'` and `'live_schema'`
  // authorities until the helper is lifted out of sqlite-only land.
  const definitionsSql = await readDefinitionsSqlBestEffort(host, _config);

  const schema = uniqueSchemaName();
  const adminClient = createClient(url);
  await adminClient.query(adminClient.sql.raw(`create schema "${schema.replaceAll('"', '""')}"`));

  const schemaClient = createClientWithSearchPath(url, schema);
  if (definitionsSql.trim()) {
    await schemaClient.query(schemaClient.sql.raw(definitionsSql));
  }

  const handle: PgMaterializedHandle = {
    dialect: 'postgresql',
    schema,
    client: schemaClient,
    adminClient,
    [Symbol.asyncDispose]: async () => {
      try {
        await adminClient.query(adminClient.sql.raw(`drop schema if exists "${schema.replaceAll('"', '""')}" cascade`));
      } finally {
        await schemaClient.end();
        await adminClient.end();
      }
    },
  };
  return handle;
};

export const pgLoadSchemaForTypegen: Dialect['loadSchemaForTypegen'] = async (materialized) => {
  const handle = assertPgHandle(materialized);
  const {client, schema} = handle;

  const relationsRows = await client.any<{name: string; kind: 'r' | 'v'; sql: string | null}>(client.sql`
    select
      c.relname as name,
      c.relkind::text as kind,
      pg_get_viewdef(c.oid, true) as sql
    from pg_class c
    inner join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = ${schema}
      and c.relkind in ('r', 'v')
    order by c.relname
  `);

  const relations = new Map<string, RelationInfo>();

  for (const row of relationsRows) {
    const columns = await loadRelationColumns(client, schema, row.name);
    relations.set(row.name, {
      kind: row.kind === 'v' ? 'view' : 'table',
      name: row.name,
      columns,
      sql: row.sql ?? undefined,
    });
  }

  return relations;
};

async function loadRelationColumns(
  client: PgkitClient,
  schema: string,
  relationName: string,
): Promise<ReadonlyMap<string, {name: string; tsType: string; notNull: boolean}>> {
  const rows = await client.any<{name: string; type_name: string; not_null: boolean}>(client.sql`
    select
      a.attname as name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) as type_name,
      a.attnotnull as not_null
    from pg_attribute a
    inner join pg_class c on c.oid = a.attrelid
    inner join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = ${schema}
      and c.relname = ${relationName}
      and a.attnum > 0
      and not a.attisdropped
    order by a.attnum
  `);

  const columns = new Map<string, {name: string; tsType: string; notNull: boolean}>();
  for (const row of rows) {
    columns.set(row.name, {
      name: row.name,
      tsType: pgTypeToTs(row.type_name),
      notNull: row.not_null,
    });
  }
  return columns;
}

export const pgAnalyzeQueries: Dialect['analyzeQueries'] = async (materialized, queries) => {
  const handle = assertPgHandle(materialized);
  const {client} = handle;

  const analyses: QueryAnalysis[] = [];
  for (const query of queries) {
    analyses.push(await analyzeOneQuery(client, query));
  }
  return analyses;
};

async function analyzeOneQuery(client: PgkitClient, query: QueryAnalysisInput): Promise<QueryAnalysis> {
  // Strategy: PREPARE the SQL (postgres parses + plans), then read parameter
  // and result types from pg_catalog via the prepared-statement metadata.
  // This is a stub that returns a not-ok analysis — the real introspection
  // will land in a follow-up commit. The tests will gate on this method's
  // shape, not the full type inference.
  return {
    sqlPath: query.sqlPath,
    ok: false,
    error: {
      name: 'PgAnalyzeQueriesNotImplemented',
      description: 'pgDialect.analyzeQueries is not yet implemented. The PREPARE-introspection path lands in a follow-up commit.',
    },
  };
}

// Map a postgres `format_type` output to a TypeScript type. Conservative for
// step one — covers the common types and falls back to `unknown`.
function pgTypeToTs(typeName: string): string {
  const normalized = typeName.toLowerCase().replace(/\(.*\)/u, '').trim();
  if (
    normalized === 'text' ||
    normalized === 'varchar' ||
    normalized === 'character varying' ||
    normalized === 'character' ||
    normalized === 'char' ||
    normalized === 'name' ||
    normalized === 'uuid' ||
    normalized === 'cidr' ||
    normalized === 'inet'
  ) {
    return 'string';
  }
  if (
    normalized === 'integer' ||
    normalized === 'int' ||
    normalized === 'int4' ||
    normalized === 'smallint' ||
    normalized === 'int2' ||
    normalized === 'real' ||
    normalized === 'double precision' ||
    normalized === 'float4' ||
    normalized === 'float8' ||
    normalized === 'numeric' ||
    normalized === 'decimal'
  ) {
    return 'number';
  }
  if (normalized === 'bigint' || normalized === 'int8') {
    return 'bigint';
  }
  if (normalized === 'boolean' || normalized === 'bool') {
    return 'boolean';
  }
  if (normalized === 'date' || normalized.startsWith('timestamp') || normalized.startsWith('time')) {
    return 'Date';
  }
  if (normalized === 'jsonb' || normalized === 'json') {
    return 'unknown';
  }
  if (normalized === 'bytea') {
    return 'Uint8Array';
  }
  if (normalized.endsWith('[]')) {
    const inner = pgTypeToTs(normalized.slice(0, -2));
    return `${inner}[]`;
  }
  return 'unknown';
}

function uniqueSchemaName(): string {
  return `sqlfu_typegen_${Math.random().toString(36).slice(2, 10)}`;
}

function createClientWithSearchPath(baseUrl: string, schema: string): PgkitClient {
  const url = new URL(baseUrl);
  url.searchParams.set('options', `-c search_path=${schema}`);
  return createClient(url.toString());
}

async function readDefinitionsSqlBestEffort(
  host: import('sqlfu').SqlfuHost,
  config: import('sqlfu').SqlfuProjectConfig,
): Promise<string> {
  // For now, only the `'desired_schema'` authority is supported on the pg
  // path. The other authorities (`'migrations'`, `'migration_history'`,
  // `'live_schema'`) need dialect-neutral helpers in main sqlfu — see the
  // wart called out in the file header.
  if (config.generate.authority !== 'desired_schema') {
    throw new Error(
      `pgDialect.materializeTypegenSchema currently only supports generate.authority='desired_schema' (got '${config.generate.authority}'). A follow-up will lift the migration replay helpers out of sqlite-only land.`,
    );
  }
  try {
    return await host.fs.readFile(config.definitions);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `pgDialect.materializeTypegenSchema needs ${config.definitions}, but the file was not found.`,
      );
    }
    throw error;
  }
}
