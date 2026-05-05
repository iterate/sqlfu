---
status: complete
size: medium
branch: sqlfu-types-view-main
base: main
pr: TBD
date: 2026-05-05
---

# `sqlfu_types` view for plain TypeScript JSON columns

## Status Summary

Done in a fresh branch based on `main`. The implementation ports the view-based
plain TypeScript logical-type metadata from the earlier PR, gates it behind
`generate.experimentalJsonTypes`, keeps `sqlfu_types` out of generated table
exports, refreshes fixtures, and updates docs/agent guidance. The PR number will
be filled in after the draft replacement PR is opened.

## Summary Ask

Replace the table/default-value metadata experiment with a reserved
`sqlfu_types` view:

```sql
create view sqlfu_types as
select
  'slack_payload' as name,
  'json' as encoding,
  'typescript' as format,
  '{
    action: "message" | "reaction";
    content: string
  }' as definition;
```

Generated wrappers should use the plain TypeScript `definition` for table rows,
query params, and query results, serialize JSON inputs with `JSON.stringify`,
and parse JSON outputs with `JSON.parse(...) as Result["column"]`.

## Checklist

- [x] Start over from latest `main` in a fresh worktree. _Created branch/worktree `sqlfu-types-view-main` from `origin/main`._
- [x] Load `sqlfu_types` metadata only when experimental JSON types are enabled. _`loadSchema` gates `loadSqlfuTypes` behind `generate.experimentalJsonTypes`._
- [x] Treat `sqlfu_types` as reserved schema metadata. _`loadSchema` skips it when emitting generated row types._
- [x] Support `encoding = 'json'`, `format = 'typescript'`, and plain TypeScript `definition`. _`loadSqlfuTypes` validates rows and normalizes multiline definitions._
- [x] Generate typed JSON params/results without validator schema generation. _Plain wrappers and validator wrappers keep runtime schemas broad while exporting concrete namespace types._
- [x] Simplify generated JSON runtime code. _Inputs use `JSON.stringify(params.payload)`, outputs inline `JSON.parse(row.payload) as Result["payload"]`, and the old `TextDecoder` helper is gone._
- [x] Normalize generated query object property order. _DDL, plain, validator, and Effect wrappers now render query objects as `name`, `sql`, `args`._
- [x] Update docs, fixture snapshots, and runtime coverage. _Docs mark the feature experimental; `logical-types.md` has the happy path first and zod coverage at the bottom._
- [x] Verify the branch. _Ran focused and full generate fixtures, runtime generate tests, typecheck, and `git diff --check`._
- [ ] Open the draft replacement PR and update this task. _Pending PR creation._

## Implementation Notes

- This branch deliberately uses `main`'s existing
  `generate.experimentalJsonTypes` flag instead of making metadata always-on.
- `encoding` and `format` are present so future formats such as JSON Schema can
  be introduced without overloading the plain TypeScript path.
- The generated validator schemas still use `unknown` for these payloads because
  the `definition` string is only a TypeScript surface, not a runtime schema.
