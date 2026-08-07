status: blocked-on-github-auth
size: medium

# Prove sqlfu runs on celld

## Status

Implementation is complete and locally green. A real celld v0.1.0 process now covers Worker routing, inline sqlfu migration/query use, and isolated named cells against real MinIO storage; dedicated pinned CI setup is included. The branch cannot yet be pushed or opened as a draft PR because this machine has no GitHub HTTPS or SSH credentials.

## Goal

Prove sqlfu's Durable Object adapter works in the real celld runtime, without Miniflare or another Workers-runtime approximation.

## Scope decisions

- Pin the compatibility test to celld v0.1.0 so CI is repeatable and an upstream release cannot silently change the contract under this PR.
- Exercise a module Worker routing requests to a SQLite-backed Durable Object. Worker support is part of the same public path, not a separate adapter claim.
- Exercise sqlfu through its public package surface: create the Durable Object client, apply a migration, bind values, write rows, and read typed results.
- Run celld against a real MinIO process in tests. MinIO supplies celld's required S3-compatible bucket; it does not replace or approximate the runtime under test.
- Do not add D1 coverage. celld's compatibility guide lists D1 as planned, and v0.1.0 rejects unsupported Wrangler configuration instead of providing a D1 binding.
- Keep this as compatibility evidence rather than adding a celld-specific sqlfu adapter unless the red test exposes a genuine product gap.

## Checklist

- [x] Add a red end-to-end spec that deploys a generated sqlfu Worker/Durable Object app to a real celld process. _Added `packages/sqlfu/test/adapters/celld.test.ts`; the tracer first failed in the real deployment path before its fixture issues were fixed._
- [x] Prove the app can migrate a fresh cell, insert bound values, and query rows through sqlfu. _The generated Worker uses public `defineConfig`, `sql.run`, `sql.many`, and `createDurableObjectClient` exports inside celld._
- [x] Prove Worker routing keeps distinct named Durable Object cells isolated. _The spec writes different rows to `alpha` and `beta`, then reads each cell independently through its Worker route._
- [x] Add disposable fixtures for the celld process, its working state, and test project without test hooks or Miniflare. _The async-disposable fixture owns real celld, MinIO, MinIO client config, temporary object state, and the bundled Worker project._
- [x] Add dedicated CI setup for pinned celld and a real S3-compatible MinIO service. _The `celld` unit-test job downloads celld v0.1.0 plus pinned MinIO server/client binaries before running the opt-in spec._
- [x] Document the local command and required binaries close to the test. _An opt-in note above the test gives the one-line command and names all three binaries._
- [x] Run the focused celld compatibility spec and the relevant existing Durable Object suite. _The celld spec, all 14 existing Durable Object tests, sqlfu typecheck, ESLint, formatting, and diff checks pass locally._
- [ ] Update this task with implementation notes, move it to `tasks/complete/`, and refresh the pull request body. _Task notes are current; moving and PR refresh wait on GitHub authentication so the draft PR can be created first._

## Implementation notes

- celld upstream: <https://github.com/denoland/celld>
- Compatibility reference: <https://github.com/denoland/celld/blob/main/docs/cloudflare-compat.md>
- Initial target release: `v0.1.0`, published 2026-08-05.
- Existing sqlfu coverage to mirror lives in `packages/sqlfu/test/adapters/durable-object.test.ts`; that suite uses Miniflare and remains useful as fast broad coverage, while this task adds a smaller real-runtime contract test.
- 2026-08-07: Installed celld v0.1.0 with its official installer, plus Homebrew `minio` and `minio-mc`, for local verification.
- 2026-08-07: The first red run exposed two fixture mistakes: treating execa's running `exitCode: null` as an exit, then omitting celld's explicit esbuild path. Fixing those reached the runtime and showed the expected sqlfu run result is `{rowsAffected: 1}`.
- 2026-08-07: D1 remains excluded because celld's compatibility reference marks it as planned. The module Worker and Durable Object binding used here are supported celld v0.1.0 surfaces.
- 2026-08-07: `git push` failed over HTTPS (`could not read Username`) and SSH (`Permission denied (publickey)`). No draft PR or monitor exists yet.
