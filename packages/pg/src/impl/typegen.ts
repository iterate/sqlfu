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

import {adaptAsyncClient} from '../vendor/schemainspect/pgkit-compat.js';
import {getColumnInfo, type DescribedQuery} from '../vendor/typegen/index.js';
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
 * Analyze a single query in two layered passes:
 *
 *   1. **Column-list baseline**: PREPARE the query, then for SELECTs
 *      `CREATE TEMP VIEW v AS <query-with-$N-substituted>` and read
 *      `pg_attribute` for `(name, atttypid)`. This is the equivalent of
 *      psql's `\gdesc` — it answers *"what columns and types does this
 *      query produce?"* even when the query has no FROM clause
 *      (e.g. `select 1 as a`, `select now() as the_time`). DML and
 *      queries pg refuses to wrap in a view skip this pass; the
 *      vendored pipeline below handles them.
 *
 *   2. **Vendored AST pipeline** (`getColumnInfo`): pgsql-ast-parser
 *      walks the query, rewrites DML+RETURNING into a SELECT shape,
 *      flattens CTEs, propagates JOIN-aware nullability, and combines
 *      that with `information_schema.columns.is_nullable`. Output is
 *      a list of fields with a `nullability` tag.
 *
 * Merge: when pass 1 gave us a baseline, it's the source of truth for
 * column names and types — pass 2 only contributes `notNull` (when it
 * has a matching name). When pass 1 gave nothing (DML, refused
 * queries), pass 2's output is the whole answer. Default `notNull` is
 * `false` (the safe default for typegen).
 */
async function analyzeOneQuery(client: AsyncClient, query: QueryAnalysisInput): Promise<QueryAnalysis> {
  const stmtName = `sqlfu_analyze_${randomSuffix()}`;
  const viewName = `sqlfu_view_${randomSuffix()}`;
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

      // Pass 1: column baseline via temp view (Select-like queries only).
      const baselineColumns =
        queryType === 'Select'
          ? await captureColumnBaseline(client, query.sqlContent, paramTypes, viewName)
          : null;

      // Pass 2: vendored AST pipeline. The `fields` here are
      // intentionally empty — getColumnInfo populates result columns
      // itself via the in-pg analyzer function + AST.
      const describedQuery: DescribedQuery = {
        sql: query.sqlContent,
        template: [query.sqlContent],
        fields: [],
        parameters: paramTypes.map((typeName, index) => ({
          name: `$${index + 1}`,
          regtype: typeName,
          typescript: pgTypeToTs(typeName),
        })),
        // ExtractedQuery requires these, but the vendored code only reads
        // `query.context` for tag generation — empty array is fine.
        file: '',
        line: 0,
        context: [],
        source: '',
      };

      const queryable = adaptAsyncClient(client);
      const analysed = await getColumnInfo(queryable as never, describedQuery, ((regtype: string) =>
        pgTypeToTs(regtype)) as never);
      const analysedFields: AnalysedField[] = analysed.fields ?? [];

      const columns = mergeColumns(baselineColumns, analysedFields);

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
          columns,
          parameters,
        },
      };
    } finally {
      try {
        await client.raw(`drop view if exists ${quoteIdent(viewName)}`);
      } catch {}
      try {
        await client.raw(`deallocate ${quoteIdent(stmtName)}`);
      } catch {}
      await client.raw('rollback');
    }
  } catch (error) {
    return {
      sqlPath: query.sqlPath,
      ok: false,
      error: {
        name: 'PgQueryAnalysisFailed',
        description: formatError(error),
      },
    };
  }
}

interface BaselineColumn {
  name: string;
  tsType: string;
}

interface AnalysedField {
  name: string;
  regtype?: string;
  typescript?: string;
  nullability?: string;
}

/**
 * Wrap the SELECT in a temp view and read `pg_attribute` to get its
 * column list. Returns `null` when the query can't be wrapped in a
 * view (multi-statement, queries containing DML, etc.) — the caller
 * falls back to the vendored AST pipeline.
 *
 * `$N` parameters are substituted with `NULL::<paramType>` so views
 * (which can't reference parameters) accept the body. The substitution
 * is regex-based — string literals containing `$1` etc. would be
 * mis-replaced; for typegen analysis the AST path takes over for
 * tricky cases.
 */
async function captureColumnBaseline(
  client: AsyncClient,
  sqlContent: string,
  paramTypes: string[],
  viewName: string,
): Promise<BaselineColumn[] | null> {
  const viewableSql = substituteParamsWithNulls(sqlContent, paramTypes);
  try {
    await client.raw(`create temp view ${quoteIdent(viewName)} as ${viewableSql}`);
  } catch {
    return null;
  }
  const rows = await client.all<{name: string; type_name: string}>({
    sql: `
      select a.attname as name,
             pg_catalog.format_type(a.atttypid, a.atttypmod) as type_name
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      where c.relname = $1
        and a.attnum > 0
        and not a.attisdropped
      order by a.attnum
    `,
    args: [viewName],
  });
  return rows.map((r) => ({name: r.name, tsType: pgTypeToTs(r.type_name)}));
}

function substituteParamsWithNulls(sql: string, paramTypes: string[]): string {
  // Replace longest-numbered placeholder first ($10 before $1) so the
  // regex doesn't match `$1` inside `$10`.
  const indices = paramTypes.map((_, i) => i).sort((a, b) => b - a);
  let result = sql;
  for (const i of indices) {
    const placeholder = new RegExp(`\\$${i + 1}\\b`, 'g');
    result = result.replace(placeholder, `null::${paramTypes[i]}`);
  }
  return result;
}

function mergeColumns(
  baseline: BaselineColumn[] | null,
  analysed: AnalysedField[],
): {name: string; tsType: string; notNull: boolean}[] {
  if (!baseline) {
    return analysed.map((field) => ({
      name: field.name,
      tsType: field.typescript ?? 'unknown',
      notNull: field.nullability === 'not_null' || field.nullability === 'assumed_not_null',
    }));
  }
  // The temp view tells us what columns and types the query actually
  // produces; the vendored pipeline contributes `notNull` for columns
  // it could trace back to a source.
  const nullabilityByName = new Map(
    analysed.map((field) => [
      field.name,
      field.nullability === 'not_null' || field.nullability === 'assumed_not_null',
    ]),
  );
  return baseline.map((column) => ({
    name: column.name,
    tsType: column.tsType,
    notNull: nullabilityByName.get(column.name) ?? false,
  }));
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 12);
}

/**
 * Stringify an error including `.cause` chains so the test output is useful.
 * Set `SQLFU_PG_DEBUG=1` to include stack traces — useful when a vendored
 * pipeline failure surfaces as a generic message and you need the call site.
 */
function formatError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const includeStacks = Boolean(process.env.SQLFU_PG_DEBUG);
  const parts: string[] = [error.message];
  if (includeStacks && error.stack) parts.push(error.stack);
  let cause: unknown = (error as Error & {cause?: unknown}).cause;
  while (cause instanceof Error) {
    parts.push(`caused by: ${cause.message}`);
    if (includeStacks && cause.stack) parts.push(cause.stack);
    cause = (cause as Error & {cause?: unknown}).cause;
  }
  return parts.join('\n  ');
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
