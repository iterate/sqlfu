---
status: in-progress
size: small
---

# Introducing sqlfu blog post

## Status summary

2026-05-09 bedtime pass is in progress. The blog now exists in `website/src/content/blog/introducing-sqlfu.md`; this pass will aggressively shorten it, keep the SQL-first argument, and make the acknowledgements/prior-art section concise. Missing pieces are the rewrite, website build verification, and PR handoff.

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

- [ ] Commit this task-file specification before implementation.
- [ ] Rewrite `website/src/content/blog/introducing-sqlfu.md` to a shorter, sharper post.
- [ ] Update this task with implementation notes and checked breadcrumbs.
- [ ] Run the relevant website verification.
- [ ] Push the branch and open/update the PR.

Need to write an "introducing sqlfu" blogpost with:

- why it exists
- why not an ORM
- why not a query builder
- prior art
- acknowledgements - libraries used in the package, in the ui, libraries vendored and adapated
- what it enables/features/goodies listing
- how we use it at iterate
