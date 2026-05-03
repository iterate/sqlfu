// Postgres typegen — three methods on the Dialect contract:
//
//   1. `materializeTypegenSchema` — open a scratch database (`CREATE DATABASE`
//      via the configured admin URL), apply the user's DDL, return a handle
//      whose `Symbol.asyncDispose` drops the database.
//   2. `loadSchemaForTypegen` — query `pg_catalog` for tables/views/columns,
//      produce the dialect-neutral `RelationInfo` map.
//   3. `analyzeQueries` — `PREPARE` each query and read parameter+result
//      types from `pg_catalog`. Postgres becomes the parser. Phase C5 will
//      layer AST-driven query rewriting (CTE flattening, DML+RETURNING →
//      SELECT) and pg17 result_types on top.
//
// Driver-agnostic: every pg call here goes through sqlfu's `AsyncClient`
// (via `createNodePostgresClient`). The only places `pg.Pool` is
// instantiated are this file and `schema.ts`. Vendored schemainspect/migra
// (Phase C2/C3) will adapt to the same interface.
import {Pool} from 'pg';
import {createNodePostgresClient} from 'sqlfu';
import type {AsyncClient, Dialect, MaterializedTypegenSchema, QueryAnalysis, QueryAnalysisInput, RelationInfo} from 'sqlfu';

import {createTempDatabase, type TempDatabaseHandle} from './scratch-database.js';

type PgMaterializedHandle = MaterializedTypegenSchema & {
  readonly dialect: 'postgresql';
  readonly databaseName: string;
  readonly client: AsyncClient;
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
    const pool = new Pool({connectionString: temp.url, max: 1});
    const client = createNodePostgresClient(pool);
    try {
      if (definitionsSql.trim()) {
        await client.raw(definitionsSql);
      }
    } catch (error) {
      // Materialization failed — release the scratch db before propagating.
      await pool.end();
      await temp[Symbol.asyncDispose]();
      throw error;
    }

    const handle: PgMaterializedHandle = {
      dialect: 'postgresql',
      databaseName: temp.databaseName,
      client,
      [Symbol.asyncDispose]: async () => {
        try {
          await pool.end();
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

  const relationsRows = await client.all<{name: string; kind: 'r' | 'v'; sql: string | null}>({
    sql: `
      select
        c.relname as name,
        c.relkind::text as kind,
        pg_get_viewdef(c.oid, true) as sql
      from pg_class c
      inner join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'v')
      order by c.relname
    `,
    args: [],
  });

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
  client: AsyncClient,
  relationName: string,
): Promise<ReadonlyMap<string, {name: string; tsType: string; notNull: boolean}>> {
  const rows = await client.all<{name: string; type_name: string; not_null: boolean}>({
    sql: `
      select
        a.attname as name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as type_name,
        a.attnotnull as not_null
      from pg_attribute a
      inner join pg_class c on c.oid = a.attrelid
      inner join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = $1
        and a.attnum > 0
        and not a.attisdropped
      order by a.attnum
    `,
    args: [relationName],
  });

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
 * Analyze a single query via PREPARE introspection.
 *
 * Phase C5 will replace this with the full AST-driven pipeline:
 *   - parse user SQL with pgsql-ast-parser
 *   - rewrite (flatten CTEs, lift views, DML+RETURNING → SELECT)
 *   - infer nullability from JOIN tree
 *   - PREPARE the rewritten query, read pg17 `result_types` (or fall back
 *     to EXECUTE-NULLs)
 *
 * What's here today is the bare PREPARE+execute path. SELECT works;
 * INSERT/UPDATE/DELETE+RETURNING gets parameters but empty result columns.
 */
async function analyzeOneQuery(client: AsyncClient, query: QueryAnalysisInput): Promise<QueryAnalysis> {
  const stmtName = `sqlfu_analyze_${Math.random().toString(36).slice(2, 12)}`;
  const queryType = classifyQuery(query.sqlContent);

  try {
    await client.raw('begin');
    try {
      // PREPARE the statement — pg parses and validates here.
      await client.raw(`prepare ${quoteIdent(stmtName)} as ${query.sqlContent}`);

      // Read param types. `parameter_types` is a regtype[] (textual type
      // names like `'integer'`, `'text'`).
      const paramRow = await client.all<{parameter_types: string[]}>({
        sql: `
          select parameter_types::text[] as parameter_types
          from pg_prepared_statements
          where name = $1
        `,
        args: [stmtName],
      });
      const paramTypes = paramRow[0]?.parameter_types ?? [];

      // EXECUTE with NULLs to provoke a RowDescription. Wraps in a savepoint
      // so a NOT NULL violation in INSERT (...) VALUES (NULL) doesn't blow
      // up our outer rollback.
      let resultColumns: {name: string; tsType: string; notNull: boolean}[] = [];
      try {
        await client.raw('savepoint exec_probe');
        try {
          const executeArgs = paramTypes.map(() => 'null').join(', ');
          const executeSql =
            paramTypes.length === 0
              ? `execute ${quoteIdent(stmtName)}`
              : `execute ${quoteIdent(stmtName)}(${executeArgs})`;
          await client.all({sql: executeSql, args: []});
          // sqlfu's AsyncClient doesn't surface result.fields; we need a
          // separate route to get column names + dataTypeIDs.
          //
          // Workaround: query `pg_typeof` for each column. We don't have the
          // column NAMES from sqlfu's interface either, so we parse them
          // from the user's SQL where possible (SELECT projection list).
          //
          // For now, a SELECT with explicit column list gives us names; for
          // expressions or *, we just emit positional names. Phase C5
          // replaces this with proper introspection via raw `pg.Client`.
          if (queryType === 'Select') {
            resultColumns = await introspectSelectColumns(client, query.sqlContent);
          }
        } catch {
          await client.raw('rollback to savepoint exec_probe');
        }
      } catch {
        // Savepoint setup itself failed — give up on result columns.
      }

      const parameters = paramTypes.map((typeName, index) => ({
        name: `$${index + 1}`,
        tsType: pgTypeToTs(typeName),
        notNull: false,
        toDriver: 'identity',
        isArray: typeName.endsWith('[]'),
      }));

      return {
        sqlPath: query.sqlPath,
        ok: true,
        descriptor: {
          sql: query.sqlContent,
          queryType,
          multipleRowsResult: queryType === 'Select' || /\breturning\b/iu.test(query.sqlContent),
          columns: resultColumns,
          parameters,
        },
      };
    } finally {
      await client.raw('rollback');
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

/**
 * Best-effort result-column introspection for SELECT queries. Wraps the
 * user's SQL in a `CREATE TEMP VIEW` and reads `pg_attribute` for the
 * resulting view's columns. Works for any SELECT with deterministic param
 * types; doesn't work for DML+RETURNING (CREATE VIEW rejects DML bodies).
 *
 * This is a stopgap for the gap between the basic `analyzeQueries` (which
 * doesn't expose result.fields) and the Phase C5 implementation (which
 * will run the AST + raw-pg pipeline). Lives here for now so SELECT users
 * get accurate result columns with no extra deps.
 */
async function introspectSelectColumns(
  client: AsyncClient,
  sql: string,
): Promise<{name: string; tsType: string; notNull: boolean}[]> {
  const viewName = `sqlfu_probe_${Math.random().toString(36).slice(2, 10)}`;
  // Substitute `$N` placeholders with NULL so we can `CREATE TEMP VIEW`
  // without param binding.
  const sqlWithNullParams = sql.replace(/\$\d+/g, 'null');

  await client.raw('savepoint probe_view');
  try {
    await client.raw(`create temp view ${quoteIdent(viewName)} as ${sqlWithNullParams}`);
    const cols = await client.all<{name: string; type_name: string; not_null: boolean}>({
      sql: `
        select
          a.attname as name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) as type_name,
          a.attnotnull as not_null
        from pg_attribute a
        inner join pg_class c on c.oid = a.attrelid
        where c.relname = $1
          and a.attnum > 0
          and not a.attisdropped
        order by a.attnum
      `,
      args: [viewName],
    });
    return cols.map((row) => ({
      name: row.name,
      tsType: pgTypeToTs(row.type_name),
      notNull: row.not_null,
    }));
  } catch {
    return [];
  } finally {
    try {
      await client.raw('rollback to savepoint probe_view');
    } catch {}
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

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

// Re-export for tests/migrations consumers.
export type {TempDatabaseHandle};
