import {DEFAULT_CLOUDFLARE_API_BASE} from './d1-http.js';

export interface FindCloudflareD1ByNameOptions {
  accountId: string;
  apiToken: string;
  name: string;
  fetch?: typeof fetch;
  apiBase?: string;
}

export interface CloudflareD1Identity {
  databaseId: string;
  databaseName: string;
  accountId: string;
}

interface CloudflareListEnvelope<T> {
  success: boolean;
  errors?: Array<{code?: number; message: string}>;
  result?: T;
}

interface CloudflareD1Listing {
  uuid: string;
  name: string;
}

export async function findCloudflareD1ByName(options: FindCloudflareD1ByNameOptions): Promise<CloudflareD1Identity> {
  const fetchFn = options.fetch || globalThis.fetch;
  const apiBase = options.apiBase || DEFAULT_CLOUDFLARE_API_BASE;
  const url = `${apiBase}/accounts/${options.accountId}/d1/database?name=${encodeURIComponent(options.name)}`;

  const response = await fetchFn(url, {
    method: 'GET',
    headers: {authorization: `Bearer ${options.apiToken}`, accept: 'application/json'},
  });

  let envelope: CloudflareListEnvelope<CloudflareD1Listing[]> | undefined;
  const responseText = await response.text();
  if (responseText) {
    try {
      envelope = JSON.parse(responseText) as CloudflareListEnvelope<CloudflareD1Listing[]>;
    } catch {
      // fall through
    }
  }

  if (!response.ok || envelope?.success === false) {
    const cfErrors = envelope?.errors
      ?.map((e) => e.message)
      .filter(Boolean)
      .join('; ');
    throw new Error(
      `Cloudflare D1 list failed (${response.status} ${response.statusText}): ${cfErrors || responseText || 'no body'}`,
    );
  }

  const matches = envelope?.result || [];
  if (matches.length === 0) {
    throw new Error(`No Cloudflare D1 database found for name "${options.name}" in account ${options.accountId}.`);
  }
  if (matches.length > 1) {
    const ids = matches.map((m) => m.uuid).join(', ');
    throw new Error(
      `Multiple Cloudflare D1 databases match name "${options.name}" in account ${options.accountId}: ${ids}. Pass {databaseId} explicitly.`,
    );
  }

  const {uuid, name} = matches[0]!;
  return {databaseId: uuid, databaseName: name, accountId: options.accountId};
}
