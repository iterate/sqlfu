---
status: in-progress
size: small
---

# Harden schemadiff normalization against weird valid SQLite

**Status summary:** Spec clarified for the bedtime pass; implementation not started. The first narrow acceptance bar is a focused schemadiff regression suite plus a conservative normalizer tweak so ambiguous token normalization cannot hide real schema differences. Full SQLite AST work and broad equivalence cleanup are out of scope.

False negatives matter more than false positives here. An unnecessary view/trigger recreate is noisy but reviewable; saying "no change" when a literal/default/view/trigger actually changed can silently skip a migration.

## Assumptions

- SQLite's double-quoted-string compatibility behavior is real enough that schemadiff must not blindly treat every double-quoted token as an identifier in SQL bodies or defaults.
- The right small fix is not to prove more things equal. The right small fix is to make ambiguous or failed normalization preserve visible diffs.
- Redundant parentheses, optional trigger `for each row`, and single-table qualified view columns are acceptable false-positive candidates unless they are already easy to normalize through existing structured data.
- This pass should stay within the current normalizer and fixture style; no full SQLite AST, parser replacement, or planner rewrite.

## First acceptance bar

- A regression test proves that semantically different double-quoted literal/default/view/trigger text is not normalized into equality.
- Tests document the current behavior for the known acceptable false-positive candidates.
- The normalizer documents and enforces the bias: preserve literal-like tokens, normalize only safe token classes, and fall back to raw-visible diffs for ambiguous cases.
- Focused schemadiff tests pass; broader `packages/sqlfu` tests are run if the focused loop leaves enough time.

- [ ] Add a schemadiff fixture section for semantic string-literal changes in double-quoted SQLite compatibility contexts.
- [ ] Add equivalence fixtures for known acceptable false-positive candidates, or mark them explicitly as current false positives if fixing is out of scope: redundant parentheses, optional trigger `for each row`, and single-table qualified vs unqualified view columns.
- [ ] Make token-normalization failure conservative: prefer raw-preserved comparison / visible diff over treating two objects as equal.
- [ ] Document the intended bias near the normalizer: preserve literals, lowercase only safe token classes, and choose false positives over false negatives.
- [ ] Run the focused schemadiff suite plus full `sqlfu` tests.

## Notes

- Current known false-positive examples include `select a from t` vs `select t.a from t`, `where a = 1` vs `where (a = 1)`, and triggers with/without explicit `for each row`.
- Current known weird false-negative risk: SQLite can treat double-quoted text as string literals in compatibility modes, while the tokenizer classifies double quotes as identifiers.
- A full semantic AST for views/triggers is not required for this pass. The goal is to pin the risk and make normalization fail conservatively.
