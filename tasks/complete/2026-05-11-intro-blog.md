---
status: done
size: small
---

# Introducing sqlfu blog post

## Status summary

Done. PR #100 merged on 2026-05-11 with the trimmed launch post, the direct SQL-first argument, iterate/agent motivation, feature list, limits, and acknowledgements preserved. Website verification was green before merge.

## 2026-05-09 bedtime pass

Branch: `bedtime-introducing-sqlfu-2026-05-09`.

Scope:

- Keep the existing Astro content-collection blog location instead of restoring the older `blog/` sync pipeline.
- Cut the post from roughly 2,750 words to a much tighter first-release announcement.
- Preserve the core argument: sqlfu means schema, migrations, queries, generated types, and review artifacts stay in SQL.
- Keep the ORM/query-builder comparisons fair, but remove repeated setup, invented timeline, and anything that reads like generic anti-ORM filler.
- Keep acknowledgements and prior art, but move them into a compact closing section rather than a long bibliography.

Assumptions:

- The direct `website/src/content/blog/*.md` layout is intentional current work and should be carried forward.
- "AGGRESSIVELY trim down" means the post should lose entire sections where the point repeats the README or docs, not just sentence-level polish.
- The post should remain opinionated and recognisably in the project's voice, but it should read like a publishable launch post rather than a maximal draft.

Checklist:

- [x] Commit this task-file specification before implementation. _first commit `74e106c`; PR #100 opened as draft immediately after._
- [x] Rewrite `website/src/content/blog/introducing-sqlfu.md` to a shorter, sharper post. _cut the long YC/startup framing, collapsed ORM/query-builder sections, kept the query example, and moved prior art/thanks into one compact closing section._
- [x] Update this task with implementation notes and checked breadcrumbs. _this pass now records scope, assumptions, word-count target, and implementation notes._
- [x] Run the relevant website verification. _`pnpm --filter @sqlfu/ui build` and `pnpm --filter sqlfu-website build` passed; Astro emitted existing duplicate content-id warnings but built 48 pages and website tests passed._
- [x] Push the branch and open/update the PR. _PR #100 was updated, marked ready, and merged on 2026-05-11._

Need to write an "introducing sqlfu" blogpost with:

- why it exists
- why not an ORM
- why not a query builder
- prior art
- acknowledgements - libraries used in the package, in the ui, libraries vendored and adapated
- what it enables/features/goodies listing
- how we use it at iterate

Implementation notes:

- The old draft was 2,750 words. The rewrite is 1,248 words.
- The post now treats `sqlfu` as "SQL in, TypeScript out" rather than opening with a long fictional startup timeline.
- Kept fair comparisons to ORMs/query builders. Drizzle and Kysely are framed as good tools; sqlfu's distinction is static checked-in SQL artifacts.
- Acknowledgements now cover TypeSQL, sql-formatter, prettier-plugin-sql-cst, Drizzle Studio, CodeMirror, React, TanStack Query, Radix UI, sqlite-wasm, Atlas/Skeema, pgkit, and the schemainspect/migra lineage without turning the post into a bibliography.
