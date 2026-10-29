---
status: done
size: large
---

# Spike: `.sql` imports typed by a TypeScript content mapper

## Status (for humans)

Spike done, and it works. `tsc --runExternalCode` (TypeScript 7.1 beta) types `import {listPosts} from './sql/queries.sql'` straight from `definitions.sql`: no `sqlfu generate`, no `.generated/`, no database. `node --import sqlfu/register` runs the same imports. Docs are written, as they'd look if merged. Not done: bundler plugins, editor (`tsc --lsp`) testing. Recommendation for #148 is at the bottom.

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

- [x] Content mapper process (`sqlfu` package.json `typescript.contentMapper`): JSON-RPC `initialize` / `openProject` / `transform` / `closeProject` _— `src/node/content-mapper.ts`, framing adapted from reylo's `src/rpc.ts`_
- [x] `transform` of a multi-query `.sql` file returns one named export per `@name` query, same shape as today's generated wrapper _— `createQueryModuleRenderer` in `src/typegen/index.ts` calls the existing `splitQueryDocument` + `renderQueryDocument`_
- [x] Types come from `definitions.sql` via the existing typegen pipeline: no live DB, no generated files on disk _— scratch db in a private temp dir; test asserts no `sql/.generated` and no `.sqlfu/`_
- [x] `definitions.sql` and migration files don't break the type check _— any `.sql` outside `config.queries` maps to `export {}`_
- [x] A query the analyzer rejects (bad column) surfaces as a diagnostic in the `.sql` file, not a crash _— spans the failing query: `sql/queries.sql(5,1): error sqlfu1: listAuthors: no such table: authors`_
- [x] Editing `definitions.sql` re-types queries (`watchedFiles` / `configIdentity`) _— covered for `tsc` runs; `watchedFiles` is returned but untested without an editor_
- [x] Node loader: `node --import sqlfu/register main.ts` loads `.sql` imports at run time _— `src/node/register.ts` + `register-hooks.ts`, async `module.register` hook returning `module-typescript`_
- [x] Spec test _— `packages/sqlfu/test/content-mapper.test.ts`, 4 tests, ~1s total_
- [x] Write up findings _— below_

Out of scope for the spike: bundler plugins (Vite, esbuild, wrangler), source mappings beyond whole-query spans, editor (`tsc --lsp`) testing, Postgres, publishing.

## Assumptions (made while AFK-ish, review these)

- The mapper ships inside the `sqlfu` package (no separate package), the same way reylo ships its mapper in `reylo`. `"package": "sqlfu"` in tsconfig.
- Import path is the bare file, `./sql/queries.sql`, not `./sql/queries.sql.ts`.
- Mapper reuses existing typegen for analysis and wrapper rendering rather than a new renderer. If that's awkward, a thin per-file entry point is added to `typegen/index.ts`.
- The spike lives on its own branch off main, not on top of #148.
- Reylo is a reference for the protocol and the Node loader; anything copied gets an attribution comment.

## Findings

What worked:

- The protocol is small. The mapper is ~100 lines, the loader ~30, and the renderer ~100, nearly all of it calls into existing typegen.
- Fast: `tsc` on the test fixtures takes ~0.2s, cold, analyzer included.
- Mapper diagnostics read like TypeScript's: `sql/queries.sql(5,1): error sqlfu1: ...`. While a `.sql` file has an error, `tsc` holds back TS errors (TypeScript's behavior, reylo documents the same), so you fix SQL first.
- Node's own type stripping does the run-time half: the load hook returns the same TS the mapper gives `tsc`, as `format: 'module-typescript'`.
- `@ts-expect-error` in the fixture proves the types are real (it fails if they degrade to `any`).

What's rough:

- **Inline configs can't use it.** `sql` tags in `sqlfu.config.ts` are TypeScript, not a foreign file, so no mapper sees them. The mapper refuses inline configs with an error saying so.
- **TypeScript 7.1 is beta**, needs `--runExternalCode`, and VS Code runs mappers only in trusted workspaces.
- **Repo tooling:** TS 7.1 can't be the workspace's `typescript` (typescript-eslint, ts-morph and astro need its JS API, which TS 7 doesn't have). It's installed as the alias `typescript-content-mappers`, and the root `package.json` now declares `typescript ^5.9.3` explicitly. Before that, `autoInstallPeers` resolved typescript-eslint's peer to the highest `typescript` in the lockfile, which became the beta, and eslint crashed.
- **Diagnostics span the whole query.** The vendored typesql reports no position. A schema build failure lands at `1:1` of each query file; it could also be reported on `definitions.sql` itself, which the mapper also transforms.
- **`watchedFiles` is a guess:** the sqlfu config plus `definitions.sql` beside it, rather than `config.definitions` / migrations per authority. The protocol also says not to list files that are themselves transformed, which `definitions.sql` is. Needs an editor test to settle.
- **Run time does analysis at load time:** the loader builds the scratch database and runs typesql when the first `.sql` file loads. In production that means shipping the analyzer, or adding a build step (a bundler plugin, or `sqlfu generate` as today). Reylo has the same tradeoff and says so in its docs.
- **One config per `.sql` file**, found by walking up. A `queries` folder that contains `definitions.sql` would try to type it as a query.

## Recommendation for #148

The spike is good enough that `.sql` files should stay first-class, and probably become the headline. A file-backed project (`definitions.sql` + `sql/queries.sql`) is the layout that gets "no generate step" on TypeScript 7.1, and on TypeScript < 7.1 it's the same layout with `sqlfu generate`. So making file-backed the default now costs nothing later: moving to the mapper is deleting `.generated/` and adding one `tsconfig.json` entry. Making inline the default now means flipping the default again when 7.1 ships.

Suggested: land #148's machinery (inline command parity, optional `db`, `.map`, init fixes), keep `sqlfu init` and the docs file-backed-first, and keep inline as the documented one-file / Durable Object option.

## Follow-ups

- Bundler plugins: Vite and esbuild (esbuild covers wrangler). Reylo's are a working reference.
- Editor check with `tsc --lsp` in VS Code: hover, go-to-definition into the `.sql` file, re-typing on `definitions.sql` edits, settling `watchedFiles`.
- Span mappings, so a TS error on a generated param or result type points at the query, not `1:1`.
- ~~Docs~~ _— done on this branch, to show what merging would look like: new `docs/sql-imports.md` page ("Import .sql files directly", marked experimental), one-paragraph pointers from the README typegen section, `typegen.md`, `getting-started.md` and `cli.md`, `sqlfu/register` in `imports.md`, reylo in README prior art, and a `contentMappers` rule in the agent skill_
- Decide whether `.generated/` stays as the fallback for TypeScript < 7.1 or goes away once 7.1 is stable.

## Implementation log

- Prototyped the protocol with a 30-line mapper in a scratch dir first: confirmed `tsc --runExternalCode` spawns it, mapper diagnostics print as `file.sql(line,col): error <source><code>`, and TS errors appear once mapper errors clear.
- Checked the Node side the same way: async `module.register` hooks can return `format: 'module-typescript'`, and Node 26 strips a type-only `export namespace` fine. No `registerHooks` + worker bridge needed (reylo uses that, because it also supports Bun and sync `require`).
- Test fixtures copy `packages/sqlfu/package.json` into `node_modules/sqlfu` with `exports` replaced by `publishConfig.exports`, and symlink `dist/`, so `sqlfu/register` and the mapper resolve as from npm.
- The renderer serializes its calls: TypeScript sends transforms concurrently, and a schema change rebuilds the shared scratch database.
- The mapper redirects `console.log` to stderr, since stdout carries the protocol.
- Full sqlfu suite: 1593 passed. 2 failures in `resolve-sqlfu-ui.test.ts`, because `packages/ui` isn't built in a fresh worktree (`#serialized-assets` missing). Unrelated.
- Review follow-up: added a test that `generate: {validator: 'zod', sync: true}` reaches `.sql` imports (types, run time, `.query()`). Rewrote the production Limits bullet to say what running the loader in production takes. Startup measured on Node 26, median of 5: plain node 68ms, with `sqlfu/register` 103ms, plus one 3-query `.sql` import 142ms.
- Docs placement, per the repo's docs rules: a deep-dive page, since it's an alternative to `generate`, not a new product axis; no landing-page change while TS 7.1 is beta. Page title aims at the search "import .sql file typescript". Sidebar: under Concepts, after typegen. `llms.txt`: Core concepts. Checked the page renders on the dev site and its links and anchors resolve.
