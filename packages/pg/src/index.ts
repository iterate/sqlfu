// `@sqlfu/pg` — postgres dialect for sqlfu. The package implements the
// `Dialect` interface from sqlfu and re-exports it as `pgDialect`.
//
// Usage:
//
//   import {pgDialect} from '@sqlfu/pg';
//   import {defineConfig, createNodePostgresClient} from 'sqlfu';
//   import {Pool} from 'pg';
//
//   export default defineConfig({
//     dialect: pgDialect,
//     db: () => createNodePostgresClient(new Pool({connectionString: ...})),
//     // ...
//   });
//
// `@sqlfu/pg` is intended as a dev dependency — it powers `sqlfu draft`,
// `sqlfu generate`, and `sqlfu check` against postgres. The runtime client
// adapter (`createNodePostgresClient`) lives in `sqlfu` itself; install
// `pg` separately and pass a `Pool`.
export {pgDialect} from './dialect.js';
