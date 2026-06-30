import type {
  AsyncClient,
  AsyncSqlTag,
  QueryArg,
  QueryResultMode,
  ResultRow,
  RootSqlTag,
  SqlResultMapper,
  SqlMappableQuery,
  SqlMappableQueryNoArgs,
  RunResult,
  SqlFragment,
  SqlModeTag,
  SqlQuery,
  SqlRowsPromise,
  SqlValue,
  SyncClient,
  SyncSqlTag,
} from './types.js';

const emptyFragment: SqlFragment = {sql: '', args: []};
const sqlQueryMapper = Symbol('sqlfu.sqlQueryMapper');

type MappableSqlQuery = SqlQuery | (Omit<SqlQuery, 'args'> & {args: []});
type RuntimeMappableSqlQuery = MappableSqlQuery & {
  [sqlQueryMapper]?: SqlResultMapper;
};

export class AsyncBoundRows<TRow extends ResultRow> implements SqlRowsPromise<TRow> {
  query: SqlQuery;
  #client: AsyncClient;

  constructor(client: AsyncClient, query: SqlQuery) {
    this.#client = client;
    this.query = query;
  }

  then<TResult1 = TRow[], TResult2 = never>(
    onfulfilled?: ((value: TRow[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      return Promise.resolve(this.#client.all<TRow>(this.query)).then(onfulfilled, onrejected);
    } catch (error) {
      return Promise.reject(error).then(onfulfilled, onrejected);
    }
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<TRow[] | TResult> {
    return this.then(undefined, onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<TRow[]> {
    return Promise.resolve(this.then((value) => value)).finally(onfinally ?? undefined);
  }
}

export class SyncBoundRows<TRow extends ResultRow> implements SqlRowsPromise<TRow> {
  query: SqlQuery;
  #client: SyncClient;

  constructor(client: SyncClient, query: SqlQuery) {
    this.#client = client;
    this.query = query;
  }

  then<TResult1 = TRow[], TResult2 = never>(
    onfulfilled?: ((value: TRow[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      return Promise.resolve(this.#client.all<TRow>(this.query)).then(onfulfilled, onrejected);
    } catch (error) {
      return Promise.reject(error).then(onfulfilled, onrejected);
    }
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<TRow[] | TResult> {
    return this.then(undefined, onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<TRow[]> {
    return Promise.resolve(this.then((value) => value)).finally(onfinally ?? undefined);
  }
}

export function isSqlFragment(value: unknown): value is SqlFragment {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'sql' in value &&
    'args' in value &&
    Array.isArray((value as SqlFragment).args),
  );
}

function runtimeSql<TType = unknown>(
  strings: TemplateStringsArray,
): SqlMappableQueryNoArgs<TType>;
function runtimeSql<TType = unknown>(
  strings: TemplateStringsArray,
  ...values: SqlValue[]
): SqlMappableQuery<TType>;
function runtimeSql<TType = unknown>(
  strings: TemplateStringsArray,
  ...values: SqlValue[]
): SqlMappableQuery<TType> {
  let text = '';
  const args: QueryArg[] = [];

  for (const [index, chunk] of strings.entries()) {
    text += chunk;

    if (index >= values.length) {
      continue;
    }

    const value = values[index];
    if (isSqlFragment(value)) {
      text += value.sql;
      args.push(...value.args);
      continue;
    }

    text += '?';
    args.push(value);
  }

  return attachSqlQueryMap({sql: collapseWhitespace(stripSqlComments(text)), args}) as SqlMappableQuery<TType>;
}

export const sql = Object.assign(runtimeSql, {
  many: modeSqlTag('many'),
  nullableOne: modeSqlTag('nullableOne'),
  one: modeSqlTag('one'),
  run: modeSqlTag('metadata'),
  metadata: modeSqlTag('metadata'),
}) as RootSqlTag;

function modeSqlTag<TMode extends QueryResultMode>(mode: TMode): SqlModeTag<TMode> {
  return ((strings: TemplateStringsArray, ...values: SqlValue[]) => {
    return attachSqlQueryMap({...runtimeSql(strings, ...values), mode});
  }) as SqlModeTag<TMode>;
}

export function readSqlQueryMapper(query: MappableSqlQuery): SqlResultMapper | undefined {
  return (query as RuntimeMappableSqlQuery)[sqlQueryMapper];
}

function attachSqlQueryMap<TQuery extends MappableSqlQuery>(
  query: TQuery,
  mapper?: SqlResultMapper,
): TQuery & {map: SqlMappableQuery['map']} {
  if (mapper) {
    Object.defineProperty(query, sqlQueryMapper, {
      value: mapper,
    });
  }
  Object.defineProperty(query, 'map', {
    value(nextMapper: SqlResultMapper) {
      const previousMapper = readSqlQueryMapper(query);
      const combinedMapper = previousMapper
        ? (result: ResultRow) => nextMapper(previousMapper(result))
        : nextMapper;
      return attachSqlQueryMap({...query}, combinedMapper);
    },
  });
  return query as TQuery & {map: SqlMappableQuery['map']};
}

export function raw(value: string): SqlFragment {
  return {sql: value, args: []};
}

export function join(values: SqlValue[], separator = ', '): SqlFragment {
  if (values.length === 0) {
    return emptyFragment;
  }

  let text = '';
  const args: QueryArg[] = [];

  values.forEach((value, index) => {
    if (index > 0) {
      text += separator;
    }

    if (isSqlFragment(value)) {
      text += value.sql;
      args.push(...value.args);
      return;
    }

    text += '?';
    args.push(value);
  });

  return {sql: text, args};
}

export function bindSyncSql(client: SyncClient): SyncSqlTag {
  const boundSql = <TRow extends ResultRow = ResultRow>(strings: TemplateStringsArray, ...values: SqlValue[]) =>
    new SyncBoundRows<TRow>(client, sql(strings, ...values));

  boundSql.all = <TRow extends ResultRow = ResultRow>(strings: TemplateStringsArray, ...values: SqlValue[]) =>
    client.all<TRow>(sql(strings, ...values));

  boundSql.run = (strings: TemplateStringsArray, ...values: SqlValue[]): RunResult =>
    client.run(sql(strings, ...values));

  return boundSql;
}

export function bindAsyncSql(client: AsyncClient): AsyncSqlTag {
  const boundSql = <TRow extends ResultRow = ResultRow>(strings: TemplateStringsArray, ...values: SqlValue[]) =>
    new AsyncBoundRows<TRow>(client, sql(strings, ...values));

  boundSql.all = <TRow extends ResultRow = ResultRow>(strings: TemplateStringsArray, ...values: SqlValue[]) =>
    client.all<TRow>(sql(strings, ...values));

  boundSql.run = (strings: TemplateStringsArray, ...values: SqlValue[]): Promise<RunResult> =>
    client.run(sql(strings, ...values));

  return boundSql;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Remove sql comments before whitespace collapsing — otherwise a `--` line
 * comment swallows everything after it once newlines become spaces. Respects
 * string literals and quoted identifiers so `--` inside them survives.
 */
function stripSqlComments(value: string): string {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const char = value[i];
    const next = value[i + 1];
    if (char === '-' && next === '-') {
      const lineEnd = value.indexOf('\n', i + 2);
      if (lineEnd === -1) break;
      i = lineEnd;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = value.indexOf('*/', i + 2);
      out += ' ';
      i = end === -1 ? value.length : end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      const end = scanQuoted(value, i, char);
      out += value.slice(i, end);
      i = end;
      continue;
    }
    if (char === '$') {
      // Postgres dollar-quoted strings ($$...$$, $tag$...$tag$) are data;
      // @sqlfu/pg shares this tag. Null means "not a dollar string" (e.g. a
      // $1 placeholder) and the $ is treated as a plain character.
      const end = scanDollarQuoted(value, i);
      if (end !== null) {
        out += value.slice(i, end);
        i = end;
        continue;
      }
    }
    if (char === '[') {
      const end = value.indexOf(']', i + 1);
      const stop = end === -1 ? value.length : end + 1;
      out += value.slice(i, stop);
      i = stop;
      continue;
    }
    out += char;
    i += 1;
  }
  return out;
}

function scanDollarQuoted(value: string, start: number): number | null {
  let cursor = start + 1;
  while (cursor < value.length) {
    const char = value[cursor];
    if (char === '$') {
      const tag = value.slice(start, cursor + 1);
      const end = value.indexOf(tag, cursor + 1);
      return end === -1 ? null : end + tag.length;
    }
    if (!/[A-Za-z0-9_]/.test(char)) return null;
    cursor += 1;
  }
  return null;
}

function scanQuoted(value: string, start: number, quote: string): number {
  let cursor = start + 1;
  while (cursor < value.length) {
    if (value[cursor] === quote) {
      if (value[cursor + 1] === quote) {
        cursor += 2;
        continue;
      }
      return cursor + 1;
    }
    cursor += 1;
  }
  return value.length;
}
