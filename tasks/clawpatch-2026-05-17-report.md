# Clawpatch report 2026-05-17

Source run: `20260516T231103-8805e6`

Reviewed feature records:

- `feat_config_7528cb5b98` - Project config `package.json`
- `feat_release_4862937c51` - Package script `lint`
- `feat_release_51170e0f9c` - Package script `build`

## Findings

### Root test script skips the `@sqlfu/pg` test suite

- id: `fnd_sig-feat-config-7528cb5b98-eb46c_f96db235a2`
- category: `test-gap`
- severity: `medium`
- confidence: `high`
- revalidation: fixed

Evidence summary:

- root `build` and `typecheck` included `@sqlfu/pg`
- root `test` only ran `sqlfu` and `@sqlfu/ui`
- `packages/pg/test/*` already contained regression coverage for diffing,
  materialization, typegen, and migration locking

Fix summary:

- root `test` now includes `pnpm --filter @sqlfu/pg test`
- pg tests now skip with an explicit message when the local Postgres fixture is
  not reachable, so the root test command does not silently acquire a service
  prerequisite
- `packages/sqlfu/test/workspace-scripts.test.ts` pins the release-built
  package coverage shape so this drift is harder to reintroduce

### Root test script skips the pg package that the release build now includes

- id: `fnd_sig-feat-release-51170e0f9c-9385_a0eac65cb8`
- category: `test-gap`
- severity: `low`
- confidence: `high`
- revalidation: fixed

Evidence summary:

- duplicate signal from the root build-script feature record
- same underlying issue and same fix as the medium finding above

## Why the raw `.clawpatch/` state is not committed

Clawpatch persisted useful local audit state under `.clawpatch/`, but that
directory includes machine-specific paths, feature snapshots, run metadata, and
finding JSON that becomes stale after revalidation. This sanitized report keeps
the reviewable finding and fix record without checking in local tool state.
