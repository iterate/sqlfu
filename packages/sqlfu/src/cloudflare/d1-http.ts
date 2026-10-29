import {createD1Client, type D1DatabaseLike, type D1PreparedStatement} from '../adapters/d1.js';
import type {AsyncClient} from '../types.js';

export const DEFAULT_CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface CreateD1HttpClientOptions {
  accountId: string;
  apiToken: string;
  databaseId: string;
  fetch?: typeof fetch;
  apiBase?: string;
}

interface CloudflareStatementResult<TResults> {
  success: boolean;
  results: TResults;
  meta?: {changes?: number; last_row_id?: number};
}

interface CloudflareQueryEnvelope<TResults> {
  success: boolean;
  errors?: Array<{code?: number; message: string}>;
  messages?: unknown[];
  result?: Array<CloudflareStatementResult<TResults>>;
}

/**
 * The two D1 HTTP endpoints a statement uses: `/query` reads rows as objects, `/raw` as arrays of
 * values (with the column names alongside).
 */
interface D1HttpEndpoints {
  query(sql: string, params: unknown[]): Promise<CloudflareStatementResult<unknown[]>>;
  raw(sql: string, params: unknown[]): Promise<CloudflareStatementResult<{columns: string[]; rows: unknown[][]}>>;
}

export function createD1HttpClient(options: CreateD1HttpClientOptions): AsyncClient<D1DatabaseLike> {
  const fetchFn = options.fetch || globalThis.fetch;
  const apiBase = options.apiBase || DEFAULT_CLOUDFLARE_API_BASE;
  const databaseUrl = `${apiBase}/accounts/${options.accountId}/d1/database/${options.databaseId}`;

  const call = async <TResults>(endpoint: 'query' | 'raw', sql: string, params: unknown[]) => {
    const response = await fetchFn(`${databaseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({sql, params}),
    });

    let envelope: CloudflareQueryEnvelope<TResults> | undefined;
    const responseText = await response.text();
    if (responseText) {
      try {
        envelope = JSON.parse(responseText) as CloudflareQueryEnvelope<TResults>;
      } catch {
        // fall through to status-based error
      }
    }

    if (!response.ok || envelope?.success === false) {
      const cfErrors = envelope?.errors
        ?.map((e) => e.message)
        .filter(Boolean)
        .join('; ');
      throw new Error(
        `Cloudflare D1 query failed (${response.status} ${response.statusText}): ${cfErrors || responseText || 'no body'}`,
      );
    }

    const statementResult = envelope?.result?.[0];
    if (!statementResult) {
      throw new Error(`Cloudflare D1 query returned no result for sql: ${sql}`);
    }
    return statementResult;
  };

  const endpoints: D1HttpEndpoints = {
    query: (sql, params) => call('query', sql, params),
    raw: (sql, params) => call('raw', sql, params),
  };
  const d1Like: D1DatabaseLike = {
    prepare(sql: string): D1PreparedStatement {
      return makeStatement(sql, [], endpoints);
    },
  };
  return createD1Client(d1Like);
}

function makeStatement(sql: string, params: unknown[], endpoints: D1HttpEndpoints): D1PreparedStatement {
  return {
    bind(...values: unknown[]): D1PreparedStatement {
      return makeStatement(sql, values, endpoints);
    },
    async all<TRow>() {
      const result = await endpoints.query(sql, params);
      return {results: result.results as TRow[]};
    },
    async raw<TRow>() {
      const result = await endpoints.raw(sql, params);
      return result.results.rows as TRow[];
    },
    async first<TRow>(columnName?: string): Promise<TRow | null> {
      const result = await endpoints.query(sql, params);
      const row = result.results[0] as Record<string, unknown> | undefined;
      if (!row) return null;
      if (columnName !== undefined) return row[columnName] as TRow;
      return row as TRow;
    },
    async run() {
      const result = await endpoints.query(sql, params);
      return {
        success: result.success,
        meta: {
          changes: result.meta?.changes,
          last_row_id: result.meta?.last_row_id,
        },
      };
    },
  };
}
