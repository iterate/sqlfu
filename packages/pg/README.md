# @sqlfu/pg

Postgres dialect for [sqlfu](https://sqlfu.dev). It points `sqlfu draft`,
`migrate`, `check`, `generate`, `format` and the Admin UI at Postgres.

```sh
npm install sqlfu pg
npm install --save-dev @sqlfu/pg
```

```ts
import {pgDialect} from '@sqlfu/pg';
import {defineConfig} from 'sqlfu';

export default defineConfig({
  dialect: pgDialect({adminUrl: process.env.DATABASE_URL!}),
  // db, definitions, migrations, queries...
});
```

Early: several common Postgres features aren't handled yet. Setup, runtime usage
and known gaps: [Postgres guide](https://sqlfu.dev/docs/guides/postgres).

Schema inspection, diffing and query analysis are vendored from
[pgkit](https://github.com/mmkal/pgkit) (`schemainspect`, `migra`, `typegen`).
See `src/vendor/` for attribution and local changes.
