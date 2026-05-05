import type {D1DatabaseLike} from '../adapters/d1.js';
import type {AsyncClient} from '../types.js';
import {readAlchemyD1State, type ReadAlchemyD1StateOptions} from './alchemy-state.js';
import {createD1HttpClient, type CreateD1HttpClientOptions} from './d1-http.js';

export interface CreateAlchemyD1ClientOptions extends ReadAlchemyD1StateOptions {
  /**
   * Cloudflare API token. Defaults to `process.env.CLOUDFLARE_API_TOKEN` if
   * omitted; throws if neither is set.
   */
  apiToken?: string;
  fetch?: CreateD1HttpClientOptions['fetch'];
  apiBase?: CreateD1HttpClientOptions['apiBase'];
}

export function createAlchemyD1Client(options: CreateAlchemyD1ClientOptions): {
  client: AsyncClient<D1DatabaseLike>;
} {
  const {databaseId, accountId} = readAlchemyD1State({
    stack: options.stack,
    stage: options.stage,
    fqn: options.fqn,
    alchemyDir: options.alchemyDir,
    cwd: options.cwd,
  });

  const apiToken = options.apiToken || process.env.CLOUDFLARE_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      'createAlchemyD1Client requires an apiToken. Pass it explicitly or set CLOUDFLARE_API_TOKEN in the environment.',
    );
  }

  return {
    client: createD1HttpClient({
      accountId,
      apiToken,
      databaseId,
      fetch: options.fetch,
      apiBase: options.apiBase,
    }),
  };
}
