// Postgres typegen — three methods on the Dialect contract:
//
//   1. `materializeTypegenSchema` — open a scratch database (CREATE DATABASE
//      via the configured admin URL), apply the user's DDL, return a handle
//      whose `Symbol.asyncDispose` drops the database.
//   2. `loadSchemaForTypegen` — query `pg_catalog` for tables/views/columns,
//      produce the dialect-neutral `RelationInfo` map.
//   3. `analyzeQueries` — `PREPARE` each query and read parameter+result
//      types from `pg_catalog`. Postgres becomes the parser. (Currently a
//      typed stub; real impl lands in Phase B.)
import {createClient, type Client as PgkitClient} from '@pgkit/client';
import type {Dialect, MaterializedTypegenSchema, QueryAnalysis, QueryAnalysisInput, RelationInfo} from 'sqlfu';

import {createTempDatabase, type TempDatabaseHandle} from './scratch-database.js';

type PgMaterializedHandle = MaterializedTypegenSchema & {
  readonly dialect: 'postgresql';
  readonly databaseName: string;
  readonly client: PgkitClient;
};

function assertPgHandle(materialized: MaterializedTypegenSchema): PgMaterializedHandle {
  if (materialized.dialect !== 'postgresql') {
    throw new Error(
      `pgDialect received a MaterializedTypegenSchema produced by '${materialized.dialect}' — dialect handles must not cross dialect boundaries.`,
    );
  }
  return materialized as PgMaterializedHandle;
}

export const pgMaterializeTypegenSchema = (adminUrl: string): Dialect['materializeTypegenSchema'] => {
  return async (host, config) => {
    if (config.generate.authority !== 'desired_schema') {
      throw new Error(
        `pgDialect.materializeTypegenSchema currently only supports generate.authority='desired_schema' (got '${config.generate.authority}'). ` +
          `A follow-up will lift the migration replay helpers out of sqlite-only land.`,
      );
    }

    const definitionsSql = await readDefinitionsSqlBestEffort(host, config);

    const temp = await createTempDatabase(adminUrl);
    const client = createClient(temp.url);
    try {
      if (definitionsSql.trim()) {
        await client.query(client.sql.raw(definitionsSql));
      }
    } catch (error) {
      // Materialization failed — release the scratch db before propagating.
      await client.end();
      await temp[Symbol.asyncDispose]();
      throw error;
    }

    const handle: PgMaterializedHandle = {
      dialect: 'postgresql',
      databaseName: temp.databaseName,
      client,
      [Symbol.asyncDispose]: async () => {
        try {
          await client.end();
        } finally {
          await temp[Symbol.asyncDispose]();
        }
      },
    };
    return handle;
  };
};

export const pgLoadSchemaForTypegen: Dialect['loadSchemaForTypegen'] = async (materialized) => {
  const {client} = assertPgHandle(materialized);

  const relationsRows = await client.any<{name: string; kind: 'r' | 'v'; sql: string | null}>(client.sql`
    select
      c.relname as name,
      c.relkind::text as kind,
      pg_get_viewdef(c.oid, true) as sql
    from pg_class c
    inner join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'v')
    order by c.relname
  `);

  const relations = new Map<string, RelationInfo>();
  for (const row of relationsRows) {
    const columns = await loadRelationColumns(client, row.name);
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
    where n.nspname = 'public'
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
  // Sanity-check the handle so misuse fails loudly even before Phase B.
  assertPgHandle(materialized);

  // Phase B will replace this stub with PREPARE-statement introspection
  // via raw `pg`. The materialize handle's pgkit client doesn't expose the
  // wire-protocol Describe message, so the real impl needs direct driver
  // access — which is why this lands after vendoring (Phase C).
  return queries.map((query): QueryAnalysis => ({
    sqlPath: query.sqlPath,
    ok: false,
    error: {
      name: 'PgAnalyzeQueriesNotImplemented',
      description:
        'pgDialect.analyzeQueries is not yet implemented. The PREPARE-introspection path lands once Phase C ' +
        'vendors @pgkit/{client,schemainspect,migra} and the dialect can reach the raw pg driver.',
    },
  }));
};

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

async function readDefinitionsSqlBestEffort(
  host: import('sqlfu').SqlfuHost,
  config: import('sqlfu').SqlfuProjectConfig,
): Promise<string> {
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

// Re-export so test fixtures and the materialize handle can pass the
// underlying tempDatabase handle around if needed.
export type {TempDatabaseHandle};
