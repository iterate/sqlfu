/*
 * Vendored from `@pgkit/migra` (Apache-2.0, Copyright Misha Kaletsky).
 * Source: https://github.com/mmkal/pgkit/tree/main/packages/migra
 *
 * Sqlfu modifications:
 *   - Pgkit `Queryable` import replaced with the local pgkit-compat shim
 *     (re-exported from `../schemainspect/index.js`).
 *   - `@pgkit/schemainspect` imports replaced with the vendored
 *     `../schemainspect/index.js`.
 *   - `command.ts` (CLI front-end depending on tRPC + zod) dropped —
 *     sqlfu invokes migra programmatically.
 *   - All relative imports adjusted for `NodeNext` resolution.
 *
 * Apache-2.0 license preserved in `./LICENSE`. See `pg-package.md`.
 */
export {Changes} from './changes.js'
export {Migration} from './migra.js'
export {Statements, UnsafeMigrationException} from './statements.js'

export {PostgreSQL} from '../schemainspect/index.js'
