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
  const {client} = assertPgHandle(materialized);
  const analyses: QueryAnalysis[] = [];
  for (const query of queries) {
    analyses.push(await analyzeOneQuery(client, query));
  }
  return analyses;
};

/**
 * Analyze a single query by:
 *
 *   1. Naming a temporary prepared statement.
 *   2. `BEGIN` (so the inevitable `EXECUTE` step runs in a tx that we'll
 *      `ROLLBACK` — protects against side effects from non-SELECT queries).
 *   3. `PREPARE foo AS <user-sql>` — postgres parses + plans, attaches a
 *      `parameter_types` (regtype[]) to `pg_prepared_statements`.
 *   4. Read parameter types from `pg_prepared_statements`.
 *   5. `EXECUTE foo(NULL, NULL, …)` to provoke a `RowDescription` reply
 *      whose `dataTypeID`s give us the result column types.
 *   6. `ROLLBACK`.
 *
 * Postgres is the parser; no third-party AST dep involved. Compared to
 * sqlite's typesql route this is simpler in code and more accurate
 * (postgres knows e.g. that `count(*)` is `bigint`, that `coalesce(a,b)`
 * picks the more specific type, etc.).
 */
async function analyzeOneQuery(client: PgkitClient, query: QueryAnalysisInput): Promise<QueryAnalysis> {
  const stmtName = `sqlfu_analyze_${Math.random().toString(36).slice(2, 12)}`;
  const queryType = classifyQuery(query.sqlContent);

  try {
    await client.query(client.sql.raw('begin'));
    try {
      // PREPARE the statement — pg parses and validates here.
      await client.query(client.sql.raw(`prepare ${quoteIdent(stmtName)} as ${query.sqlContent}`));

      // Read param types via pg_prepared_statements. `parameter_types` is a
      // regtype[] (textual type names like `'integer'`, `'text'`).
      const paramRow = await client.maybeOne<{parameter_types: string[]}>(client.sql`
        select parameter_types::text[] as parameter_types
        from pg_prepared_statements
        where name = ${stmtName}
      `);
      const paramTypes = paramRow?.parameter_types ?? [];

      // EXECUTE with NULLs to provoke RowDescription. Wraps in savepoint
      // so a failure (e.g. NOT NULL violation in INSERT VALUES (NULL))
      // doesn't abort our outer rollback.
      let resultFields: {name: string; dataTypeID: number}[] = [];
      await client.query(client.sql.raw('savepoint exec_probe'));
      try {
        const executeArgs = paramTypes.map(() => 'null').join(', ');
        const executeSql = paramTypes.length === 0
          ? `execute ${quoteIdent(stmtName)}`
          : `execute ${quoteIdent(stmtName)}(${executeArgs})`;
        const result = await client.query(client.sql.raw(executeSql));
        resultFields = result.fields.map((field) => ({name: field.name, dataTypeID: field.dataTypeID}));
      } catch {
        // EXECUTE blew up. We can still report parameter types but result
        // columns are unknown — output an empty columns array.
        await client.query(client.sql.raw('rollback to savepoint exec_probe'));
      }

      const parameters = paramTypes.map((typeName, index) => ({
        name: `$${index + 1}`,
        tsType: pgTypeToTs(typeName),
        notNull: false, // pg can't tell us null-aware param types — assume nullable
        toDriver: 'identity',
        isArray: typeName.endsWith('[]'),
      }));

      const columns = await Promise.all(
        resultFields.map(async (field) => ({
          name: field.name,
          tsType: await oidToTsType(client, field.dataTypeID),
          notNull: false, // result-column nullability requires deeper analysis; punt
        })),
      );

      return {
        sqlPath: query.sqlPath,
        ok: true,
        descriptor: {
          sql: query.sqlContent,
          queryType,
          multipleRowsResult: queryType === 'Select' || /\breturning\b/iu.test(query.sqlContent),
          columns,
          parameters,
        },
      };
    } finally {
      await client.query(client.sql.raw('rollback'));
    }
  } catch (error) {
    return {
      sqlPath: query.sqlPath,
      ok: false,
      error: {
        name: 'PgQueryAnalysisFailed',
        description: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function classifyQuery(sql: string): 'Select' | 'Insert' | 'Update' | 'Delete' | 'Copy' | 'Ddl' {
  const stripped = sql.replace(/^(?:\s+|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/u, '').toLowerCase();
  if (stripped.startsWith('select') || stripped.startsWith('with') || stripped.startsWith('values')) return 'Select';
  if (stripped.startsWith('insert')) return 'Insert';
  if (stripped.startsWith('update')) return 'Update';
  if (stripped.startsWith('delete')) return 'Delete';
  if (stripped.startsWith('copy')) return 'Copy';
  return 'Ddl';
}

const oidTypeNameCache = new Map<number, string>();

async function oidToTsType(client: PgkitClient, oid: number): Promise<string> {
  let typeName = oidTypeNameCache.get(oid);
  if (typeName == null) {
    const row = await client.maybeOne<{type_name: string}>(client.sql`
      select format_type(${oid}::oid, null) as type_name
    `);
    typeName = row?.type_name ?? 'unknown';
    oidTypeNameCache.set(oid, typeName);
  }
  return pgTypeToTs(typeName);
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
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
