---
status: done
size: small
---

# Harden schemadiff normalization against weird valid SQLite

**Status summary:** Done for this pass. Added focused normalization fixtures for double-quoted literal-like view/trigger changes, tokenizer-unknown valid SQLite, and documented false-positive candidates. The normalizer now preserves double-quoted comparable tokens and falls back to raw SQL when lightweight tokenization cannot safely rewrite SQL. Full `sqlfu` tests still have unrelated environment/timeout failures noted in the implementation log.

False negatives matter more than false positives here. An unnecessary view/trigger recreate is noisy but reviewable; saying "no change" when a literal/default/view/trigger actually changed can silently skip a migration.

## Assumptions

- SQLite's double-quoted-string compatibility behavior is real enough that schemadiff must not blindly treat every double-quoted token as an identifier in view and trigger SQL bodies.
- The right small fix is not to prove more things equal. The right small fix is to make ambiguous or failed normalization preserve visible diffs.
- Redundant parentheses, optional trigger `for each row`, and single-table qualified view columns are acceptable false-positive candidates unless they are already easy to normalize through existing structured data.
- This pass should stay within the current normalizer and fixture style; no full SQLite AST, parser replacement, or planner rewrite.

## First acceptance bar

- Regression tests prove that semantically different double-quoted literal-like view and trigger text is not normalized into equality; existing basics fixtures continue to cover default preservation/change detection.
- Tests document the current behavior for the known acceptable false-positive candidates.
- The normalizer documents and enforces the bias: preserve literal-like tokens, normalize only safe token classes, and fall back to raw-visible diffs for ambiguous cases.
- Focused schemadiff tests pass; broader `packages/sqlfu` tests are run if the focused loop leaves enough time.

- [x] Add a schemadiff fixture section for semantic string-literal changes in double-quoted SQLite compatibility contexts. _Added `normalization.sql` cases for double-quoted view and trigger literal-like case changes._
- [x] Add equivalence fixtures for known acceptable false-positive candidates, or mark them explicitly as current false positives if fixing is out of scope: redundant parentheses, optional trigger `for each row`, and single-table qualified vs unqualified view columns. _Marked all three as documented false positives in `normalization.sql` by expecting visible recreate diffs._
- [x] Make token-normalization failure conservative: prefer raw-preserved comparison / visible diff over treating two objects as equal. _`normalizeStoredSqlWithIdentifiers` and `normalizeComparableSql` now fall back to trimmed raw SQL when the lightweight tokenizer rejects valid SQLite._
- [x] Document the intended bias near the normalizer: preserve literals, lowercase only safe token classes, and choose false positives over false negatives. _Added comments beside the fallback path and double-quoted comparable token handling in `sqltext.ts`._
- [x] Run the focused schemadiff suite plus full `sqlfu` tests. _Focused schemadiff fixtures passed; `pnpm --filter sqlfu test` was attempted and failed in unrelated timeout/UI asset tests._

## Notes

- Current known false-positive examples include `select a from t` vs `select t.a from t`, `where a = 1` vs `where (a = 1)`, and triggers with/without explicit `for each row`.
- Current known weird false-negative risk: SQLite can treat double-quoted text as string literals in compatibility modes, while the tokenizer classifies double quotes as identifiers.
- A full semantic AST for views/triggers is not required for this pass. The goal is to pin the risk and make normalization fail conservatively.

## Implementation log

- Added `packages/sqlfu/test/schemadiff/fixtures/normalization.sql`.
- Initial red run showed view/trigger double-quoted case changes incorrectly produced an empty diff.
- Tried a double-quoted default fixture, but SQLite rejected it as `default value of column [label] is not constant`; kept default coverage to the existing single-quoted/default-change cases.
- Added a tokenizer-unknown valid SQLite fixture using a unicode alias (`café`) so tokenizer failures preserve a visible view diff instead of aborting inspection.
- Verification:
  - `pnpm --filter sqlfu exec vitest run test/schemadiff/fixtures.test.ts --reporter=verbose` passed.
  - `pnpm --filter sqlfu typecheck` passed.
  - `pnpm exec oxfmt --check packages/sqlfu/src/schemadiff/sqlite/sqltext.ts packages/sqlfu/test/schemadiff/fixtures/normalization.sql tasks/schemadiff-normalization-weird-sql.md` passed for matched files.
  - `pnpm --filter sqlfu test` failed in unrelated areas: `better-auth-adapter.test.ts`, `pkg.test.ts`, `resolve-sqlfu-ui.test.ts`, `adapters/durable-object.test.ts`, `cloudflare/miniflare-d1-path.test.ts`, and one generate fixture timed out.
  - `pnpm format:check` failed on pre-existing unrelated formatting issues across 49 files.
