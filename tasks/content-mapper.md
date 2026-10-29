---
status: in-progress
size: large
---

# Spike: `.sql` imports typed by a TypeScript content mapper

## Status (for humans)

Spike just started. Goal is to find out whether sqlfu can drop `sqlfu generate` for `.sql` queries on TypeScript 7.1, before deciding whether #148's "inline config is the default" framing should land.

## Why

TypeScript 7.1 (beta) adds content mappers ([typescript-go#4712](https://github.com/microsoft/typescript-go/pull/4712)): a `tsconfig.json` entry that tells `tsc` and the editor to ask an external process for the TypeScript behind a foreign file type. [reylo](https://github.com/colinhacks/reylo) uses it so `import getUser from './get_user.sql'` is typed with no generated files.

sqlfu's per-file generated wrapper (`sql/.generated/*.sql.ts`) is already nearly what a content mapper returns. If sqlfu ships its own mapper:

- no `sqlfu generate` step for `.sql` queries, no `.generated/` folder, no stale types
- SQL errors reported in the `.sql` file, at the query, in `tsc` and the editor
- typed from `definitions.sql` (the `desired_schema` authority), so unlike reylo no running dev database is needed

Content mappers can't reach `sql` tags inside `.ts` files, so this is the argument for keeping `.sql` files first-class rather than demoting them behind inline config (#148).

## Spike scope

Target usage:

```sql
-- sql/queries.sql
/** @name listPosts */
select id, slug from posts order by id desc;

/** @name findPostBySlug */
select id, slug from posts where slug = :slug limit 1;
```

```ts
import {listPosts, findPostBySlug} from './sql/queries.sql';

const posts = await listPosts(client); // {id: number; slug: string}[]
const post = await findPostBySlug(client, {slug: 'hello'}); // {id: number; slug: string} | null
```

```jsonc
// tsconfig.json
{
  "contentMappers": [{"package": "sqlfu", "extensions": [".sql"]}]
}
```

```sh
tsc --noEmit --runExternalCode
node --import sqlfu/register main.ts
```

- [ ] Content mapper process (`sqlfu` package.json `typescript.contentMapper`): JSON-RPC `initialize` / `openProject` / `transform` / `closeProject`
- [ ] `transform` of a multi-query `.sql` file returns one named export per `@name` query, same shape as today's generated wrapper
- [ ] Types come from `definitions.sql` via the existing typegen pipeline: no live DB, no generated files on disk
- [ ] `definitions.sql` and migration files don't break the type check (they're multi-statement DDL, nobody imports them)
- [ ] A query the analyzer rejects (bad column) surfaces as a diagnostic in the `.sql` file, not a crash
- [ ] Editing `definitions.sql` re-types queries (`watchedFiles` / `configIdentity`)
- [ ] Node loader: `node --import sqlfu/register main.ts` loads `.sql` imports at run time
- [ ] Spec test: fixture project, `tsc --runExternalCode` passes on correct usage and fails on misuse; node loader runs a query against a real SQLite db
- [ ] Write up findings: what worked, what's rough, recommendation for #148

Out of scope for the spike: bundler plugins (Vite, esbuild, wrangler), source mappings beyond whole-query spans, editor (`tsc --lsp`) testing, Postgres, publishing.

## Assumptions (made while AFK-ish, review these)

- The mapper ships inside the `sqlfu` package (no separate package), the same way reylo ships its mapper in `reylo`. `"package": "sqlfu"` in tsconfig.
- Import path is the bare file, `./sql/queries.sql`, not `./sql/queries.sql.ts`.
- Mapper reuses existing typegen for analysis and wrapper rendering rather than a new renderer. If that's awkward, a thin per-file entry point is added to `typegen/index.ts`.
- The spike lives on its own branch off main, not on top of #148.
- Reylo is a reference for the protocol and the Node loader; anything copied gets an attribution comment.

## Implementation log
