// sqlfu/analyze — the zero-node:*, vendor-blob-inclusive analysis
// surface. Runs anywhere non-Node (workers, browsers, Deno, Bun). Strict
// tier: zero node:* in the runtime graph. Vendor bundles (typesql ~140KB)
// are acceptable here; they are not on the light root.
//
// If you're building a SQL editor, studio, query playground, or doing
// schema inspection in a browser or edge worker, this is the entry.

export {analyzeVendoredTypesqlQueriesWithClient} from './typegen/analyze-vendored-typesql-with-client.js';
export type {VendoredQueryAnalysis, VendoredQueryInput} from './typegen/analyze-vendored-typesql-with-client.js';

export {inspectSqliteSchema} from './schemadiff/sqlite/inspect.js';
export {planSchemaDiff} from './schemadiff/sqlite/plan.js';
export type {SqliteInspectedDatabase} from './schemadiff/sqlite/types.js';

// Editor-diagnostic helpers — analysis-adjacent; they turn analysis
// errors into the shape in-browser SQL editors consume.
export {isInternalUnsupportedSqlAnalysisError, toSqlEditorDiagnostic} from './sql-editor-diagnostic.js';
