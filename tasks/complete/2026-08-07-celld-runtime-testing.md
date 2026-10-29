status: done
size: medium

# Prove sqlfu runs on celld

## Status

Done in draft PR [#154](https://github.com/iterate/sqlfu/pull/154). A real celld v0.6.3 node (started with `celld dev`) covers Worker routing, inline sqlfu migration/query use, isolated named Durable Object cells, and a D1 binding through `createD1Client`. A dedicated CI job downloads one pinned celld binary.

## Goal

Prove sqlfu's Durable Object adapter works in the real celld runtime, without Miniflare or another Workers-runtime approximation.

## Scope decisions

- Pin the compatibility test to one celld release so CI is repeatable and an upstream release cannot silently change the contract under this PR. _Bumped from v0.1.0 to v0.6.3 on 2026-10-29._
- Exercise a module Worker routing requests to a SQLite-backed Durable Object. Worker support is part of the same public path, not a separate adapter claim.
- Exercise sqlfu through its public package surface: create the Durable Object client, apply a migration, bind values, write rows, and read typed results.
- ~~Run celld against a real MinIO process in tests.~~ _Replaced on 2026-10-29: `celld dev` (since v0.4.0) runs one real celld node on a local object store, so no S3-compatible server is needed. The bucket was only ever a celld prerequisite, not something sqlfu touches._
- Do not add D1 coverage. celld's compatibility guide lists D1 as planned, and v0.1.0 rejects unsupported Wrangler configuration instead of providing a D1 binding. _Reversed on 2026-10-29: celld added D1 in v0.3.0, and the spec now covers it._
- Keep this as compatibility evidence rather than adding a celld-specific sqlfu adapter unless the red test exposes a genuine product gap.

## Checklist

- [x] Add a red end-to-end spec that deploys a generated sqlfu Worker/Durable Object app to a real celld process. _Added `packages/sqlfu/test/adapters/celld.test.ts`; the tracer first failed in the real deployment path before its fixture issues were fixed._
- [x] Prove the app can migrate a fresh cell, insert bound values, and query rows through sqlfu. _The generated Worker uses public `defineConfig`, `sql.run`, `sql.many`, and `createDurableObjectClient` exports inside celld._
- [x] Prove Worker routing keeps distinct named Durable Object cells isolated. _The spec writes different rows to `alpha` and `beta`, then reads each cell independently through its Worker route._
- [x] Add disposable fixtures for the celld process, its working state, and test project without test hooks or Miniflare. _The async-disposable fixture owns one `celld dev` process and a temp project dir (which also holds celld's local state)._
- [x] Add dedicated CI setup for pinned celld and a real S3-compatible MinIO service. _The `celld` unit-test job downloads the pinned celld v0.6.3 binary before running the opt-in spec. MinIO dropped on 2026-10-29._
- [x] Document the local command and required binaries close to the test. _An opt-in note above the test gives the one-line command and the minimum celld version._
- [x] Run the focused celld compatibility spec and the relevant existing Durable Object suite. _The celld spec, all 14 existing Durable Object tests, sqlfu typecheck, ESLint, formatting, and diff checks pass locally._
- [x] Update this task with implementation notes, move it to `tasks/complete/`, and refresh the pull request body. _Filed as `tasks/complete/2026-08-07-celld-runtime-testing.md`; draft PR #154 includes runtime scope and before/after evidence._

## Implementation notes

- celld upstream: <https://github.com/denoland/celld>
- Compatibility reference: <https://github.com/denoland/celld/blob/main/docs/cloudflare-compat.md>
- Initial target release: `v0.1.0`, published 2026-08-05.
- Existing sqlfu coverage to mirror lives in `packages/sqlfu/test/adapters/durable-object.test.ts`; that suite uses Miniflare and remains useful as fast broad coverage, while this task adds a smaller real-runtime contract test.
- 2026-08-07: Installed celld v0.1.0 with its official installer, plus Homebrew `minio` and `minio-mc`, for local verification.
- 2026-08-07: The first red run exposed two fixture mistakes: treating execa's running `exitCode: null` as an exit, then omitting celld's explicit esbuild path. Fixing those reached the runtime and showed the expected sqlfu run result is `{rowsAffected: 1}`.
- 2026-08-07: D1 remains excluded because celld's compatibility reference marks it as planned. The module Worker and Durable Object binding used here are supported celld v0.1.0 surfaces.
- 2026-08-07: GitHub device authentication plus the `workflow` OAuth scope unblocked the push. Opened draft PR [#154](https://github.com/iterate/sqlfu/pull/154).
- 2026-10-29: Re-checked before taking the PR out of draft. `main` had not moved since the branch point. celld was at v0.6.3, 12 releases past the v0.1.0 pin. The breaking CLI changes since then were: `--advertise` now names the internal listener (v0.2.0), and health moved to `/.well-known/celld/health` (v0.4.0). Every listed asset still exists.
- 2026-10-29: Executive decision: switched the fixture from `celld deploy` + `celld` + MinIO + `mc` to `celld dev --no-watch`. It starts the same node binary (`celld --no-control-plane --listen ...`) on a local object store. It is ready in about 2s and exits in about 0.1s on SIGTERM. MinIO's GitHub repo is archived, and its latest release (RELEASE.2025-10-15T17-29-55Z, a CVE fix) ships source only, so the old pin was a dead end. The CI job now downloads one binary.
- 2026-10-29: A throwaway probe ran sqlfu's `createD1Client` against a celld v0.6.3 D1 binding under `celld dev`. Migrate, a named-param `sql.run` insert, and a `sql.many` select all worked. celld's D1 docs say it binds only `?`/`?NNN`, so sqlfu's D1 adapter must already convert named params before binding. Adding D1 to this spec is cheap (one more binding and route), but it widens the PR's claim, so it is left as a decision for the reviewer.
- 2026-10-29: The reviewer asked for D1 coverage. The spec's Worker now has a `d1_databases` binding and a `/d1` route that builds a `createD1Client` and migrates on each request. The Durable Object route moved to `/durable-object/<cell>`. Two tests, each with its own `celld dev` process; together they take about 1.6s locally.
