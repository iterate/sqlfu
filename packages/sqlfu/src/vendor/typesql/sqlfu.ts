/*
 * Vendored from https://github.com/wsporto/typesql at
 * f0356201d41f3f317824968a3f1c7a90fbafdc99 (MIT).
 *
 * Local additions:
 * - avoid the upstream file-oriented compile pipeline when sqlfu generates wrappers
 * - re-export the browser-safe client-level entrypoint from sqlfu-with-client.ts, which sqlfu calls with a
 *   database it already has open (typegen's in-memory scratch database)
 */
import {
	analyzeSqliteQueriesWithClient,
	type SqlfuQueryAnalysis,
	type SqlfuQueryInput,
} from './sqlfu-with-client.js';

export {analyzeSqliteQueriesWithClient};
export type {SqlfuQueryAnalysis, SqlfuQueryInput};
