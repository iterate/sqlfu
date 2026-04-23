---
status: needs-grilling
size: large
---

# Public import surface redesign for `sqlfu`

Being re-grilled via `grill-you`. Supersedes closed PR #48 (which scoped too narrowly to `core/config.ts`). The full dossier lives at `/tmp/grillings/sqlfu/import-surface/dossier.md`; the live transcript at `/tmp/grillings/sqlfu/import-surface/interview.md`. This file will be rewritten when the interview finishes.

## Problem statement (verbatim from user)

> sub-claude was right. we should evict it. remember, this is pre-alpha and there are zero users. i wanted to think through how imports *should* work in sqlfu, not how they somewhat arbitrarily do

Desired surface, from the user's prompt:

```
sqlfu         — near-zero-cost: adapters, types, no-dep helpers, maybe a just-run-the-sql migrator
sqlfu/api     — all the smart stuff: diff engine, smart migrator, typegen, formatter, parser (name bikesheddable)
sqlfu/lint-plugin — the eslint plugin, can have node deps, can't add bloat
sqlfu/cli     — maybe unneeded? side-effectful today
sqlfu/browser — mostly used by the ui package — maybe internal?
sqlfu/ui      — ui server entry — also helpful for external consumers?
sqlfu/ui/browser — confusing
sqlfu/outbox  — niche, clear
```

Questions in scope: `sqlfu/config`? `sqlfu/core`? `sqlfu/client`? Where does `node:child_process`-importing code belong? Is `core/` meaningful?

## Status

Grilling is in progress. Once complete, this file gets a concrete spec with (a) the final entry-point list + contracts, (b) a per-file audit table mapping every current `.ts` to its new home, (c) the per-entry enforcement rules, (d) the implementation plan.
