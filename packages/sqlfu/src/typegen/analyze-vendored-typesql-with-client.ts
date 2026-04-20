/*
 * Browser-safe entrypoint to the vendored TypeSQL analyzer. Mirrors
 * `analyze-vendored-typesql.ts` but passes an already-open sqlite client
 * instead of a database URI, so callers running sqlite-wasm (e.g. demo
 * mode) can reuse the same analysis pipeline.
 */

import type {VendoredQueryAnalysis, VendoredQueryInput} from './analyze-vendored-typesql.js';

export type {VendoredQueryAnalysis, VendoredQueryInput};

type VendoredTypesqlModule = {
  analyzeSqliteQueriesWithClient(
    client: unknown,
    queries: readonly VendoredQueryInput[],
  ): Promise<readonly VendoredQueryAnalysis[]>;
};

async function loadVendoredTypesql(): Promise<VendoredTypesqlModule> {
  const modulePath = import.meta.url.endsWith('.ts') ? '../vendor/typesql/sqlfu.ts' : '../vendor/typesql/sqlfu.js';

  return import(/* @vite-ignore */ modulePath) as Promise<VendoredTypesqlModule>;
}

export async function analyzeVendoredTypesqlQueriesWithClient(
  client: unknown,
  queries: readonly VendoredQueryInput[],
): Promise<readonly VendoredQueryAnalysis[]> {
  const {analyzeSqliteQueriesWithClient} = await loadVendoredTypesql();
  return analyzeSqliteQueriesWithClient(client, queries);
}
