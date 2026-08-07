status: ready
size: medium

# Prove sqlfu runs on celld

## Status

Specified and ready to implement. Research confirms celld v0.1.0 supports module Workers and SQLite-backed Durable Objects, while D1 is planned but not yet available. No runtime compatibility test or CI setup has been added yet.

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

- [ ] Add a red end-to-end spec that deploys a generated sqlfu Worker/Durable Object app to a real celld process.
- [ ] Prove the app can migrate a fresh cell, insert bound values, and query rows through sqlfu.
- [ ] Prove Worker routing keeps distinct named Durable Object cells isolated.
- [ ] Add disposable fixtures for the celld process, its working state, and test project without test hooks or Miniflare.
- [ ] Add dedicated CI setup for pinned celld and a real S3-compatible MinIO service.
- [ ] Document the local command and required binaries close to the test.
- [ ] Run the focused celld compatibility spec and the relevant existing Durable Object suite.
- [ ] Update this task with implementation notes, move it to `tasks/complete/`, and refresh the pull request body.

## Implementation notes

- celld upstream: <https://github.com/denoland/celld>
- Compatibility reference: <https://github.com/denoland/celld/blob/main/docs/cloudflare-compat.md>
- Initial target release: `v0.1.0`, published 2026-08-05.
- Existing sqlfu coverage to mirror lives in `packages/sqlfu/test/adapters/durable-object.test.ts`; that suite uses Miniflare and remains useful as fast broad coverage, while this task adds a smaller real-runtime contract test.
