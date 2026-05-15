---
status: ready
size: small
---

## 2026-05-15 Status Summary

Ready for implementation. The chosen bedtime direction is to make new-user docs and init output tell one default story: if the database path is omitted, sqlfu uses `.sqlfu/app.db`. The main remaining work is to confirm the current code path, update any visible `./db/app.sqlite` defaults, and add focused coverage for init output.

## Task

The Getting Started walkthrough currently points new users at `./db/app.sqlite`, while the product direction is that omitted database config should default to `.sqlfu/app.db`. That means new users should not have to think about a separate `db/` directory on first run, and generated setup/docs should not make `./db/app.sqlite` look like the blessed path.

## Assumptions

- The default project database path is `.sqlfu/app.db` when a user omits an explicit database path.
- `sqlfu init` should prefer omission over spelling out the default path, unless the implementation requires an explicit value for correctness.
- Getting Started should introduce the omitted-db default directly and avoid teaching `./db/app.sqlite` as the happy path.
- Users can still configure any SQLite path explicitly later; this task is only about the default story for new projects.

## Checklist

- [ ] Inspect init/config code to confirm where the omitted database path is resolved.
- [ ] Add or update focused test coverage for generated init output before changing product behavior if output changes.
- [ ] Update init preview/CLI output so the generated config aligns with the omitted-db default.
- [ ] Update Getting Started and overview docs to avoid visible `./db/app.sqlite` defaults.
- [ ] Run focused tests/checks and record the results.

## Implementation Notes

- 2026-05-15: Bedtime assumption accepted: prefer simplifying setup around the `.sqlfu/app.db` omitted-db default instead of preserving the older visible `./db/app.sqlite` path.
