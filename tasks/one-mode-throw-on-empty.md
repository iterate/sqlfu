---
status: ready
size: small
---

# Make `one` mode throw on zero rows

Both query runtimes silently return `undefined` (typed as a non-null row) when a `one`-mode query matches no rows — e.g. `delete ... returning` / `update ... returning` with no match:

- generated wrappers: `rows[0]!` in the typegen output (`packages/sqlfu/src/typegen/index.ts`, several emit sites around `resultMode === 'one'`)
- inline runtime: `inlineRowsResult` in `packages/sqlfu/src/config-inline.ts`

pgkit throws `QueryError('Expected one row')` here (`pgkit/packages/client/src/client.ts`), which is the honest semantics: `one` is a promise the types make, so the runtime should enforce it.

Surfaced by a Cursor Bugbot finding on PR #139 (inline durable object sqlfu); deferred there because the same hole exists in the generated wrappers and the semantics change should land for both runtimes together.

- [ ] decide whether `one` with 2+ rows should also throw (pgkit says yes; lean yes for consistency)
- [ ] inline runtime: throw in `inlineRowsResult` when `mode === 'one'` and `rows` is empty
- [ ] generated wrappers: emit the same check instead of `rows[0]!` (all `one`-mode emit sites in `typegen/index.ts`)
- [ ] regenerate fixtures, red test first per repo convention
