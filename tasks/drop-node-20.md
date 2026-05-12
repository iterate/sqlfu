---
status: ready
size: small
---

# Drop Node 20 support

## Status summary

Implementation not started yet. This pass will first remove internal Node 20
runtime fallbacks, then align package metadata and docs around Node 22+. The
main thing to verify is whether `better-sqlite3` is still needed for adapter
tests after the runtime scripts move to `node:sqlite`.

## Assumptions for this pass

- `node:sqlite` is the default internal sqlite host now that the minimum runtime
  is Node 22.
- The public `better-sqlite3` adapter tests should stay if they intentionally
  prove the adapter still works for users.
- `better-sqlite3` should only leave `packages/sqlfu/package.json` if every
  remaining reference is type-only, generated output, or otherwise not required
  by real tests.
- Root `README.md` should be regenerated through the existing docs flow if the
  source README changes, rather than edited as the source of truth.

CI already runs on Node 22 (bumped in the `config-db-pluggable` PR because
Node 20 can't strip type-only imports from the vendored sql-formatter).
The runtime still has Node-20 fallbacks that can come out.

- [ ] `openMainDevDatabase` in `packages/sqlfu/src/typegen/index.ts` —
  drop the `better-sqlite3` fallback, leave only the `node:sqlite`
  path. Delete the "Node 22" explanation comment.
- [ ] `scripts/generate-internal-queries.ts` — stop importing
  `better-sqlite3`; use `node:sqlite` (or just go through the node host
  like typegen now does). Delete the Node-20 comment.
- [ ] Root + package `engines.node` — set to `>=22`.
- [ ] `packages/sqlfu/package.json` devDependencies — remove
  `better-sqlite3` if no tests still need it (grep: `errors.test.ts`,
  `core-sqlite.test.ts`, `generate-authority.test.ts`,
  `recipes/id-helpers.test.ts`, `test/better-sqlite3.d.ts` — these
  assert the adapter itself works, keep them).
- [ ] README + docs — any "supports Node 20+" phrasing becomes
  "Node 22+".

Not blocking anything; pick up whenever convenient.
