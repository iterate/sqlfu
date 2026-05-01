---
status: ready
size: small
---

# Harden schemadiff normalization against weird valid SQLite

**Status summary:** Not started. The immediate `createdAt` / `strftime('%Y...')` lowercasing bug was fixed in `446d946`; this task is the follow-up risk pass. Main missing piece is a small regression suite that proves schemadiff normalization is conservative when SQLite accepts unusual but valid SQL.

False negatives matter more than false positives here. An unnecessary view/trigger recreate is noisy but reviewable; saying "no change" when a literal/default/view/trigger actually changed can silently skip a migration.

- [ ] Add a schemadiff fixture section for semantic string-literal changes in double-quoted SQLite compatibility contexts.
- [ ] Add equivalence fixtures for known acceptable false-positive candidates, or mark them explicitly as current false positives if fixing is out of scope: redundant parentheses, optional trigger `for each row`, and single-table qualified vs unqualified view columns.
- [ ] Make token-normalization failure conservative: prefer raw-preserved comparison / visible diff over treating two objects as equal.
- [ ] Document the intended bias near the normalizer: preserve literals, lowercase only safe token classes, and choose false positives over false negatives.
- [ ] Run the focused schemadiff suite plus full `sqlfu` tests.

## Notes

- Current known false-positive examples include `select a from t` vs `select t.a from t`, `where a = 1` vs `where (a = 1)`, and triggers with/without explicit `for each row`.
- Current known weird false-negative risk: SQLite can treat double-quoted text as string literals in compatibility modes, while the tokenizer classifies double quotes as identifiers.
- A full semantic AST for views/triggers is not required for this pass. The goal is to pin the risk and make normalization fail conservatively.
