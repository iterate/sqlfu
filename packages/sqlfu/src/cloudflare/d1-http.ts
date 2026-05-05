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

interface CloudflareQueryEnvelope<TRow = unknown> {
  success: boolean;
  errors?: Array<{code?: number; message: string}>;
  messages?: unknown[];
  result?: Array<{
    success: boolean;
    results: TRow[];
    meta?: {changes?: number; last_row_id?: number};
  }>;
}

export function createD1HttpClient(options: CreateD1HttpClientOptions): AsyncClient<D1DatabaseLike> {
  const fetchFn = options.fetch || globalThis.fetch;
  const apiBase = options.apiBase || DEFAULT_CLOUDFLARE_API_BASE;
  const queryUrl = `${apiBase}/accounts/${options.accountId}/d1/database/${options.databaseId}/query`;

  const callQuery = async (sql: string, params: unknown[]) => {
    const response = await fetchFn(queryUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({sql, params}),
    });

    let envelope: CloudflareQueryEnvelope | undefined;
    const responseText = await response.text();
    if (responseText) {
      try {
        envelope = JSON.parse(responseText) as CloudflareQueryEnvelope;
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

  const d1Like: D1DatabaseLike = {
    prepare(sql: string): D1PreparedStatement {
      return makeStatement(sql, [], callQuery);
    },
  };
  return createD1Client(d1Like);
}

function makeStatement(
  sql: string,
  params: unknown[],
  callQuery: (
    sql: string,
    params: unknown[],
  ) => Promise<{
    results: unknown[];
    meta?: {changes?: number; last_row_id?: number};
    success: boolean;
  }>,
): D1PreparedStatement {
  return {
    bind(...values: unknown[]): D1PreparedStatement {
      return makeStatement(sql, values, callQuery);
    },
    async all<TRow>() {
      const result = await callQuery(sql, params);
      return {results: result.results as TRow[]};
    },
    async first<TRow>(columnName?: string): Promise<TRow | null> {
      const result = await callQuery(sql, params);
      const row = result.results[0] as Record<string, unknown> | undefined;
      if (!row) return null;
      if (columnName !== undefined) return row[columnName] as TRow;
      return row as TRow;
    },
    async run() {
      const result = await callQuery(sql, params);
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
