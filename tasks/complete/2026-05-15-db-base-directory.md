---
status: complete
size: small
---

## 2026-05-15 Status Summary

Done. Runtime code already used `.sqlfu/app.db` when `db` was omitted; this task aligned init output and user-facing docs with that behavior. No remaining implementation work is known beyond reviewing the PR.

## Task

The Getting Started walkthrough currently points new users at `./db/app.sqlite`, while the product direction is that omitted database config should default to `.sqlfu/app.db`. That means new users should not have to think about a separate `db/` directory on first run, and generated setup/docs should not make `./db/app.sqlite` look like the blessed path.

## Assumptions

- The default project database path is `.sqlfu/app.db` when a user omits an explicit database path.
- `sqlfu init` should prefer omission over spelling out the default path, unless the implementation requires an explicit value for correctness.
- Getting Started should introduce the omitted-db default directly and avoid teaching `./db/app.sqlite` as the happy path.
- Users can still configure any SQLite path explicitly later; this task is only about the default story for new projects.

## Checklist

- [x] Inspect init/config code to confirm where the omitted database path is resolved. _Confirmed `openConfigDb` already falls back to `.sqlfu/app.db` when `db` is omitted._
- [x] Add or update focused test coverage for generated init output before changing product behavior if output changes. _Updated `packages/sqlfu/test/init.test.ts` to require no `db:` field and no `db/` scaffold._
- [x] Update init preview/CLI output so the generated config aligns with the omitted-db default. _Removed `db: './db/app.sqlite'` from `createDefaultInitPreview` and stopped `initializeProject` from creating `db/`._
- [x] Update Getting Started and overview docs to avoid visible `./db/app.sqlite` defaults. _Updated README config snippets, Getting Started, local SQLite guides, Turso local fallback, and runtime validation config examples._
- [x] Run focused tests/checks and record the results. _Ran the focused init test, the omitted-db CLI test, and `pnpm --filter sqlfu typecheck`._

## Implementation Notes

- 2026-05-15: Bedtime assumption accepted: prefer simplifying setup around the `.sqlfu/app.db` omitted-db default instead of preserving the older visible `./db/app.sqlite` path.
- 2026-05-15: Initial red check for `init.test.ts` was attempted via `pnpm --filter sqlfu test -- init.test.ts`; after installing dependencies it ran the broader suite and showed the expected init failure plus unrelated existing suite failures in import-surface/UI resolution. Focused Vitest invocations were used for final verification.
