---
status: backlog
size: huge
---

pgkit supported postgres. it has basically the same core features. we should be able to support it.

Actually, a thought for the implementation. We could probably get pretty far by structuring thusly:

- add packages/pg as a separate project (`@sqlfu/pg`)
- copy-paste the parts of pgkit that are currently missing, namely:
  - typegen (completely different implementation but end result is very similar)
  - migra + schemainspect (these could contribute to basically a swap-in schemadiff/ replacement)

Then the main `packages/sqlfu` lib would just have to make certain parts pluggable:
- `diffSchemaSql` could default to sqlite somehow but you could pass in the pg impl somehow
- similar for `generateQueryTypesForConfig` (or maybe another entrypoint which we introduce that makes it easier to swap out underlying implementations).

If in either case pgkit isn't as useful as typesql, maybe we could use typesql instead
similarly we could use the actual sql-formatter library or whatever else we've vendored in for now to make lighter for sqlite but might want the "full" version of for postgres.

some notes:
- we'd want `@sqlfu/pg` to be mostly a dev dependency - for schema diffing and type generation, but both of those should occur at dev-time not at runtime.
- it'd definitely require changes in the main package but I think the documented entrypoints could hopefully stay the same