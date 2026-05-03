/*
 * Vendored from `@pgkit/schemainspect` (Apache-2.0, Copyright Misha Kaletsky).
 * Source: https://github.com/mmkal/pgkit/tree/main/packages/schemainspect
 *
 * Sqlfu modifications:
 *   - Pgkit `Queryable` import replaced with a local minimal-surface
 *     adapter (`./pgkit-compat.ts`) that wraps sqlfu's `AsyncClient`.
 *   - `PostgreSQL.create` no longer accepts a connection string —
 *     callers must pass a Queryable.
 *   - `getResourceText` (unused) removed; it pulled `node:fs`.
 *   - `queries.ts` codegen preset (required `eslint-plugin-mmkal`)
 *     stripped; the static `export const queries` blob remains.
 *   - All relative imports adjusted for `NodeNext` resolution
 *     (`.js` extensions, directory specifiers as `/index.js`).
 *
 * Apache-2.0 license preserved in `./LICENSE`. See `pg-package.md` for
 * the broader vendoring rationale.
 */
export {BaseInspectedSelectable, type AllRelationTypes} from './inspected.js'

export {get_inspector} from './get.js'
export {ColumnInfo, Inspected} from './inspected.js'
export {DBInspector, NullInspector, to_pytype} from './inspector.js'
export {PostgreSQL} from './pg/index.js'
export {TopologicalSorter} from './graphlib/index.js'

export * as pg from './pg/index.js'
export * as misc from './misc.js'

export * from './isa-asa.js'

// Sqlfu addition: surface the pgkit-compat shim so callers can adapt
// sqlfu's `AsyncClient` to the `Queryable` shape this package expects.
export {adaptAsyncClient, type Queryable, type SqlFragment} from './pgkit-compat.js'
