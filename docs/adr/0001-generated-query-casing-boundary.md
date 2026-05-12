---
status: accepted
---

# Generated query casing is an explicit boundary

sqlfu keeps SQL as the authored source language, but generated query wrappers are application-facing TypeScript. Generated SQL-derived property casing is controlled by `generate.casing: 'camel' | 'preserve'`, defaulting to `'camel'`; generated symbols such as function names, type names, filenames, and `SqlQuery.name` keep their existing naming rules.

In camel mode, generated query `Result` fields and column-derived `Data` inputs use camelCase with local raw-name fallback for casing collisions. User-authored placeholder `Params` preserve the names written in SQL. Row-returning generated queries expose a `RawResult` type and `mapResult` function so callers can reuse sqlfu's explicit raw-row to application-result boundary with other clients.
