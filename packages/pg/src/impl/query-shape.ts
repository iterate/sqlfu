// The wrapper generator in sqlfu (`getResultMode` in `typegen/index.ts`) is
// shared by every dialect. It decides a wrapper's shape from a handful of
// descriptor fields. This module works those out for a Postgres query by
// reading its `pgsql-ast-parser` AST plus a few catalog facts:
//
//   - `multipleRowsResult`: `false` means one row or none (`Result | null`).
//   - nullable params: which `$N` params the caller may pass `null` for.
//   - data params: which `$N` params are update SET values, sent as the
//     wrapper's separate `data` argument.
//
// The rules copy the SQLite analyzer (vendored typesql:
// `sqlite-query-analyzer/traverse.ts#isMultipleRowResult` and
// `sqlite-query-analyzer/parser.ts`) so a query generates the same wrapper in
// both dialects. Two differences, both deliberate:
//
//   - Unique-key lookups check every unique index. typesql only spots them
//     when the table has exactly one unique column.
//   - Set-returning functions (`generate_series`, `unnest`, ...) keep a
//     select multi-row. SQLite has none.
import {
  astVisitor,
  parseFirst,
  type Expr,
  type ExprCall,
  type SelectFromStatement,
  type Statement,
} from 'pgsql-ast-parser';
import type {AsyncClient} from 'sqlfu';

export type QueryShapeCatalog = {
  /** Columns of each `public` table, in `attnum` order. */
  tableColumns: Map<string, {name: string; notNull: boolean}[]>;
  /** Key columns of each non-partial, non-expression unique index (primary keys included), by table. */
  uniqueKeys: Map<string, string[][]>;
  aggregateFunctions: Set<string>;
  setReturningFunctions: Set<string>;
};

export type QueryShape = {
  /** `null` for anything that isn't a select, insert, update or delete (DDL, `copy`, ...). */
  queryType: 'Select' | 'Insert' | 'Update' | 'Delete' | null;
  multipleRowsResult: boolean;
  /** 1-based `$N` indexes. */
  nullableParams: Set<number>;
  /** 1-based `$N` indexes. Empty unless every one comes before every other param, since wrapper args are `[...data, ...params]`. */
  dataParams: Set<number>;
};

export async function loadQueryShapeCatalog(client: AsyncClient): Promise<QueryShapeCatalog> {
  const columnRows = await client.all<{table_name: string; column_name: string; not_null: boolean}>({
    sql: `
      select c.relname as table_name, a.attname as column_name, a.attnotnull as not_null
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p')
        and a.attnum > 0
        and not a.attisdropped
      order by c.relname, a.attnum
    `,
    args: [],
  });
  const uniqueKeyRows = await client.all<{table_name: string; column_names: string[]}>({
    sql: `
      select c.relname as table_name, array_agg(a.attname::text order by k.position) as column_names
      from pg_index i
      join pg_class c on c.oid = i.indrelid
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral unnest(i.indkey::int2[]) with ordinality as k(attnum, position)
      join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
      where n.nspname = 'public'
        and i.indisunique
        and i.indpred is null
        and i.indexprs is null
        and k.position <= i.indnkeyatts
      group by i.indexrelid, c.relname
    `,
    args: [],
  });
  const functionRows = await client.all<{name: string; is_aggregate: boolean; returns_set: boolean}>({
    sql: `
      select distinct proname::text as name, prokind = 'a' as is_aggregate, proretset as returns_set
      from pg_proc
      where prokind = 'a' or proretset
    `,
    args: [],
  });

  const tableColumns = new Map<string, {name: string; notNull: boolean}[]>();
  for (const row of columnRows) {
    const columns = tableColumns.get(row.table_name) || [];
    columns.push({name: row.column_name, notNull: row.not_null});
    tableColumns.set(row.table_name, columns);
  }
  const uniqueKeys = new Map<string, string[][]>();
  for (const row of uniqueKeyRows) {
    uniqueKeys.set(row.table_name, [...(uniqueKeys.get(row.table_name) || []), row.column_names]);
  }
  return {
    tableColumns,
    uniqueKeys,
    aggregateFunctions: new Set(functionRows.filter((row) => row.is_aggregate).map((row) => row.name)),
    setReturningFunctions: new Set(functionRows.filter((row) => row.returns_set).map((row) => row.name)),
  };
}

/** Returns `null` when `pgsql-ast-parser` can't parse the query. Callers should then assume the worst. */
export function analyzeQueryShape(sql: string, parameterCount: number, catalog: QueryShapeCatalog): QueryShape | null {
  let statement: Statement;
  try {
    statement = parseFirst(sql);
  } catch {
    return null;
  }
  const main = withoutWithClause(statement);
  return {
    queryType: queryTypeOf(main),
    multipleRowsResult: isMultipleRowStatement(main, catalog),
    nullableParams: findNullableParams(statement, main, catalog),
    dataParams: findDataParams(main, parameterCount),
  };
}

/** `with ... insert` is an insert, `with ... select` a select, and so on. */
function withoutWithClause(statement: Statement): Statement {
  return statement.type === 'with' || statement.type === 'with recursive' ? withoutWithClause(statement.in) : statement;
}

function queryTypeOf(main: Statement): QueryShape['queryType'] {
  switch (main.type) {
    case 'select':
    case 'union':
    case 'union all':
    case 'values':
      return 'Select';
    case 'insert':
      return 'Insert';
    case 'update':
      return 'Update';
    case 'delete':
      return 'Delete';
    default:
      return null;
  }
}

function isMultipleRowStatement(main: Statement, catalog: QueryShapeCatalog): boolean {
  switch (main.type) {
    case 'select':
      return isMultipleRowSelect(main, catalog);
    // Same as typesql: DML is single-row, with or without RETURNING.
    case 'insert':
    case 'update':
    case 'delete':
      return false;
    default:
      return true;
  }
}

function isMultipleRowSelect(select: SelectFromStatement, catalog: QueryShapeCatalog): boolean {
  const limit = select.limit?.limit;
  if (limit?.type === 'integer' && limit.value === 1) {
    return false;
  }
  const columnExprs = (select.columns || []).map((column) => column.expr);
  if (someCall(columnExprs, (call) => catalog.setReturningFunctions.has(call.function.name))) {
    return true;
  }
  const from = select.from || [];
  if (from.length === 0) {
    return false;
  }
  if (select.groupBy?.length) {
    return true;
  }
  if (someCall(columnExprs, (call) => !call.over && catalog.aggregateFunctions.has(call.function.name))) {
    return false;
  }
  const [source] = from;
  if (from.length > 1 || source.type !== 'table' || (source.name.schema && source.name.schema !== 'public')) {
    return true;
  }
  if (!select.where) {
    return true;
  }
  const equalityColumns = new Set(
    conjuncts(select.where).flatMap((expr) => {
      const column = equalityColumn(expr, source.name.alias || source.name.name);
      return column ? [column] : [];
    }),
  );
  const uniqueKeys = catalog.uniqueKeys.get(source.name.name) || [];
  return !uniqueKeys.some((key) => key.every((column) => equalityColumns.has(column)));
}

/** True if any call in `exprs` matches, not counting calls inside subqueries. */
function someCall(exprs: Expr[], predicate: (call: ExprCall) => boolean): boolean {
  let found = false;
  const visitor = astVisitor((visit) => ({
    call: (call) => {
      if (predicate(call)) {
        found = true;
        return;
      }
      visit.super().call(call);
    },
    select: () => {},
    values: () => {},
  }));
  for (const expr of exprs) {
    visitor.expr(expr);
  }
  return found;
}

function conjuncts(expr: Expr): Expr[] {
  if (expr.type === 'binary' && expr.op === 'AND') {
    return [...conjuncts(expr.left), ...conjuncts(expr.right)];
  }
  return [expr];
}

/** `col = <param or literal>` (either way round) on the given table: returns `col`. */
function equalityColumn(expr: Expr, tableNameOrAlias: string): string | undefined {
  if (expr.type !== 'binary' || expr.op !== '=') {
    return undefined;
  }
  for (const [ref, value] of [
    [expr.left, expr.right],
    [expr.right, expr.left],
  ]) {
    const isValue = ['parameter', 'integer', 'numeric', 'string', 'boolean'].includes(unwrapCasts(value).type);
    if (ref.type === 'ref' && (!ref.table || ref.table.name === tableNameOrAlias) && isValue) {
      return ref.name;
    }
  }
  return undefined;
}

/**
 * Params are not-null unless the query says otherwise, as in typesql: tested
 * with `is null` / `is not null` anywhere in `statement`, or inserted/set
 * into a nullable column by `main`.
 */
function findNullableParams(statement: Statement, main: Statement, catalog: QueryShapeCatalog): Set<number> {
  const nullable = new Set<number>();
  const markIfParam = (expr: Expr) => {
    const index = parameterIndex(expr);
    if (index) nullable.add(index);
  };

  const visitor = astVisitor((visit) => ({
    unary: (unary) => {
      if (unary.op === 'IS NULL' || unary.op === 'IS NOT NULL') {
        markIfParam(unary.operand);
      }
      visit.super().unary(unary);
    },
  }));
  visitor.statement(statement);

  const targetIsNullable = (tableName: string, columnName: string) => {
    const column = catalog.tableColumns.get(tableName)?.find((candidate) => candidate.name === columnName);
    return !column?.notNull;
  };
  if (main.type === 'insert') {
    const tableName = main.into.name;
    const columnNames =
      main.columns?.map((column) => column.name) ||
      (catalog.tableColumns.get(tableName) || []).map((column) => column.name);
    if (main.insert.type === 'values') {
      for (const row of main.insert.values) {
        row.forEach((value, position) => {
          const columnName = columnNames[position];
          if (columnName && targetIsNullable(tableName, columnName)) markIfParam(value);
        });
      }
    }
    if (main.onConflict && main.onConflict.do !== 'do nothing') {
      for (const set of main.onConflict.do.sets) {
        if (targetIsNullable(tableName, set.column.name)) markIfParam(set.value);
      }
    }
  }
  if (main.type === 'update') {
    for (const set of main.sets) {
      if (targetIsNullable(main.table.name, set.column.name)) markIfParam(set.value);
    }
  }
  return nullable;
}

function findDataParams(main: Statement, parameterCount: number): Set<number> {
  if (main.type !== 'update') {
    return new Set();
  }
  const data = new Set<number>();
  const visitor = astVisitor(() => ({
    parameter: (parameter) => {
      const index = parameterIndex(parameter);
      if (index) data.add(index);
    },
  }));
  for (const set of main.sets) {
    visitor.expr(set.value);
  }
  const others = Array.from({length: parameterCount}, (_, i) => i + 1).filter((index) => !data.has(index));
  const dataComesFirst = [...data].every((index) => others.every((other) => index < other));
  return dataComesFirst ? data : new Set();
}

function parameterIndex(expr: Expr): number | undefined {
  const unwrapped = unwrapCasts(expr);
  return unwrapped.type === 'parameter' ? Number(unwrapped.name.slice(1)) : undefined;
}

function unwrapCasts(expr: Expr): Expr {
  return expr.type === 'cast' ? unwrapCasts(expr.operand) : expr;
}
