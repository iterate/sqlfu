---
status: done
size: small
---

## generate-preflight: warn or error when generate runs against an empty/stale database

**Status:** Complete. `sqlfu generate` with `generate.authority: 'live_schema'` now fails before writing generated files when the configured live database has no user schema but the project has schema definitions or migrations. Focused CLI, authority, and package typecheck commands pass.

---

## Problem

`sqlfu generate` reads the live database schema to produce TypeScript types. If a user runs `generate` before `migrate` (easy to do -- the old README Quick Start showed this order), the live database has no schema and the generated wrappers are hollow: they compile, they import cleanly, and they are wrong.

There is no warning, no error, and no indication that anything went wrong. The user ends up with `.generated/` files that have empty or incorrect types, which only surface as TypeScript errors or runtime surprises later.

This is a real footgun for new users following the walkthrough.

## Conservative bedtime assumptions

- Treat an empty live database as a misconfiguration when the project already has schema definitions or pending migrations. `generate` should fail rather than create hollow wrappers that appear valid.
- Prefer reusing the same live-vs-desired schema plumbing that powers `sqlfu check` / migration checks, so `generate` and `check` agree about obvious drift.
- Keep `generate` live-schema-first. Do not add `--from=replay`, `--from=definitions`, or any other source mode in this task.
- Do not block projects with no schema definitions and no migrations; an empty database may be intentional there.
- Make the diagnostic tell the user what happened and what to run next, not just that type generation failed.

## Target behavior

When a project has schema definitions and an empty live database:

```sh
sqlfu generate
```

should exit non-zero before writing misleading generated files, with stderr that points at the likely cause and next command:

```txt
sqlfu generate cannot read your schema from an empty live database.
Your project has schema definitions or pending migrations, but the configured database has no user tables/views.
Run sqlfu migrate first, then run sqlfu generate again.
```

The exact wording can differ, but the diagnostic must include:

- `sqlfu generate`
- empty live database / no live schema
- schema definitions or pending migrations
- `sqlfu migrate`

## Checklist

- [x] Add a failing integration/CLI spec for `sqlfu generate` against an empty live database in a project with schema definitions. The failure should assert a non-zero exit and the actionable diagnostic, not current hollow output. _Added `cli-config.test.ts` coverage for `generate.authority: 'live_schema'` with an untouched `app.db`._
- [x] Implement the smallest preflight that catches the empty/stale live database case before generation writes hollow wrappers. _`readLiveSchema` now checks for empty extracted schema and errors if definitions or migration files indicate expected schema._
- [x] Preserve normal generation when the live database has already been migrated. _Existing `generate-authority.test.ts` live-schema flow still passes after migrating first._
- [x] Run focused tests and typecheck if feasible. _Ran `pnpm --filter sqlfu test --run test/cli-config.test.ts`, `pnpm --filter sqlfu test --run test/generate-authority.test.ts`, and `pnpm --filter sqlfu typecheck`._
- [x] Move this task to `tasks/complete/2026-05-14-generate-preflight.md` once the PR implementation is complete. _Moved on this branch after implementation and verification._

## Original solution space

- **Preflight check**: chosen for the clear empty-live-schema misconfiguration.
- **Warn-only mode**: left out because a warning still allows hollow generated files.
- **`--from` flag**: left out. Current `origin/main` already has `generate.authority`; this task does not add another source-selection surface.
- **Something else**: the right fix may be different once the full solution space is explored.

## Correctness note

`generate` reads the live DB precisely so it reflects what the app runs against, including any post-`sync` drift. A replay-based fallback would lose that guarantee. The preflight direction (error on obvious misconfigurations) may be cleaner than adding a new mode.

## Notes for grilling

- Is this common enough to warrant an error vs. a warning?
- What does the user experience look like if we add a preflight? Does it block `generate` in CI environments that don't have a live DB?
- Is `--from=replay` a realistic option given the current generate internals?

## Implementation notes

- 2026-05-14: Bedtime decision is to error for the clear misconfiguration rather than warn. This biases toward preventing silent wrong generated types in pre-alpha, where deleting or tightening behavior is preferred over preserving legacy tolerance.
- 2026-05-14: Current `origin/main` defaults `generate.authority` to `'desired_schema'`, so the live database preflight is scoped to the explicit `'live_schema'` authority path. The fix does not change the default authority or add replay modes.
