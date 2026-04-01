---
name: vendor-sqlite3def
description: Vendor and update the sqldef sqlite3def implementation in this repo by porting the upstream Go code to TypeScript under `packages/sqlfu/src/vendors/sqlite3def` and porting the relevant upstream sqlite3def tests to Vitest. Use when Codex needs to scaffold or refresh the vendored sqlite3def implementation, inspect the upstream `sqldef/sqldef` GitHub repository, update vendored tests first, then implement source changes until the relevant tests pass.
---

# Vendor sqlite3def

Port `sqlite3def` from `sqldef/sqldef` into this repo for pure TypeScript / JS runtimes, including Cloudflare Workers and Durable Objects. Treat the vendored source of truth as `packages/sqlfu/src/vendors/sqlite3def/`. Treat the vendored test suite as the driver for correctness.

This is a large, brute-force vendoring task. Bias toward an autonomous hands-off loop rather than repeatedly stopping for approval on normal implementation choices. The upstream design and tests already exist. The job is to port them faithfully and keep moving.

## Workspace setup

Do this work in a neighboring git worktree, not in the user's current checkout.

Use a sibling directory of the current repo, for example:

```bash
git worktree add ../sqlfu-vendor-sqlite3def -b vendor-sqlite3def
```

If that branch name already exists or the worktree already exists, reuse the existing neighboring worktree rather than failing.

Carry out the port inside that worktree. At the end, report the worktree path used.

Do not rewrite history. If you make commits in the worktree, use normal commits only.

## Upstream source

Read the upstream SQLite-specific implementation from `https://github.com/sqldef/sqldef`.

Prefer a local clone:

1. Use `~/src/sqldef` if it already exists.
2. Otherwise clone a fresh copy to `/tmp/sqldef`.

Read these files first:

- `cmd/sqlite3def/sqlite3def.go`
- `cmd/sqlite3def/sqlite3def_test.go`
- `cmd/sqlite3def/tests*.yml`
- `parser/parser.go`
- `parser/token.go`
- `parser/node.go`
- `schema/parser.go`
- `schema/generator.go`
- `database/sqlite3/database.go`
- `database/parser.go`
- Any transitive parser / schema / database files needed to satisfy failing tests

Record the upstream tag and commit in `packages/sqlfu/src/vendors/sqlite3def/README.md`. Add attribution comments at the top of any heavily-inspired vendored source files, including the upstream path and a short summary of modifications.

## Provenance conventions

Make upstream provenance explicit so future update passes are mechanical.

In `packages/sqlfu/src/vendors/sqlite3def/README.md`, record:

- upstream repository URL
- upstream release tag
- upstream commit SHA used for the current vendor snapshot
- date of the snapshot
- list of intentionally skipped features or tests
- list of local structural deviations from upstream

At the top of every vendored source file, add a short comment header like:

```ts
// Ported from sqldef/sqldef
// Upstream file: parser/token.go
// Upstream commit: <sha>
// Local modifications:
// - translated from Go to TypeScript
// - adapted module/import shape for this repo
// - preserved behavior for JS-only runtimes where practical
```

Keep the header short and factual. If a file is inspired by multiple upstream files, list each path.

When a vendored file significantly diverges from upstream, update the `Local modifications` bullets rather than removing provenance.

## Architecture decision

Do not try to reuse `parser/parser.y` directly.

Upstream `parser/parser.y` is a goyacc grammar, not a practical direct input to a TypeScript toolchain. The preferred implementation path in this repo is:

1. Port the already-generated parser in `parser/parser.go`.
2. Port the handwritten tokenizer and parser entrypoint in `parser/token.go`.
3. Port the AST / formatter types from `parser/node.go`.
4. Port the schema parsing and generation layers that consume that AST.

Treat `parser/parser.y` only as an upstream reference for understanding behavior, not as the artifact to port.

This is intentionally a heavyweight vendoring strategy. Prefer fidelity and updateability over elegance.

## Target layout

Use this folder structure under `packages/sqlfu/src/vendors/sqlite3def/`:

- `README.md`
- `index.ts`
- `cmd/`
- `database/`
- `parser/`
- `schema/`
- `shared/`

Use this concrete shape unless there is a strong reason not to:

- `cmd/sqlite3def.ts`
  Thin repo-facing entrypoints analogous to upstream `cmd/sqlite3def/sqlite3def.go`. Keep CLI-specific concerns thin.
- `database/sqlite3.ts`
  SQLite database adapter and export helpers, based on upstream `database/sqlite3/database.go`.
- `database/parser.ts`
  DDL splitting and parser wiring based on upstream `database/parser.go`.
- `parser/parser.ts`
  The port of the generated upstream parser from `parser/parser.go`.
- `parser/tokenizer.ts`
  The tokenizer / lexer and `parseDDL(...)` entrypoint based on upstream `parser/token.go`.
- `parser/ast.ts`
  AST nodes and SQL formatting helpers based on upstream `parser/node.go`.
- `schema/parser.ts`
  Parsing from AST into schema-domain objects based on upstream `schema/parser.go`.
- `schema/generator.ts`
  Diff / SQL generation based on upstream `schema/generator.go`.
- `shared/`
  Small shared utilities needed by the vendored port. Do not use this as a dumping ground for arbitrary repo abstractions.

Keep vendored tests under `packages/sqlfu/test/vendors/sqlite3def/`.

Mirror upstream file names and module boundaries where practical so future updates can be applied by diff.

## Git update workflow

When updating from one upstream snapshot to another, prefer path-scoped diffs over rereading the whole upstream repo.

Use commands in this shape:

```bash
git -C /tmp/sqldef diff <old-sha>..<new-sha> -- cmd/sqlite3def
git -C /tmp/sqldef diff <old-sha>..<new-sha> -- database/sqlite3 database/parser.go
git -C /tmp/sqldef diff <old-sha>..<new-sha> -- parser/node.go parser/token.go parser/parser.go
git -C /tmp/sqldef diff <old-sha>..<new-sha> -- schema/parser.go schema/generator.go
```

Also use targeted history when needed:

```bash
git -C /tmp/sqldef log --oneline <old-sha>..<new-sha> -- parser/
git -C /tmp/sqldef log --oneline <old-sha>..<new-sha> -- schema/
git -C /tmp/sqldef blame <new-sha> -- parser/token.go
```

Start with the snapshot commit recorded in the vendored README. Do not guess which upstream revision the current vendor tree came from.

## Working mode

Use tests as the driver.

1. Port the upstream sqlite3def tests to Vitest before implementing much source.
2. Run the vendored tests.
3. Implement only enough source to satisfy the next layer of failures.
4. Repeat until the relevant vendored tests pass.

Expect the first run to fail because the implementation does not exist yet. That is correct.

Do not shell out to the upstream `sqlite3def` binary as the final implementation. The goal is a TypeScript port. During development, using the binary as a temporary oracle is acceptable if it helps confirm behavior, but remove that dependency from the shipped vendored implementation.

Prefer vendored code that is mechanically close to upstream over clever rewrites. For parser and schema code, boring is good.

Stay in an autonomous implementation loop for substantial stretches of time. Do not stop to ask for routine guidance when the next step is discoverable from:

- upstream code
- upstream tests
- failing local tests
- the vendored README provenance notes

Only stop when blocked by a real ambiguity with material product impact.

## Test selection

Port broadly across SQLite behavior. The goal is a general-purpose SQLite implementation, not a thin wrapper around this repo's current call sites.

Still make deliberate decisions about scope. SQLite-only is in scope. Cross-database behavior is not.

Skip a feature when it is clearly outside SQLite scope, impossible in JS-only runtimes, or not worth carrying yet for documented reasons. When skipping:

- Do not implement the feature.
- Do not keep the test active.
- Leave a short inline `//` comment at the closest source boundary explaining that the upstream behavior is intentionally not vendored here.
- Add a note to `packages/sqlfu/src/vendors/sqlite3def/README.md` listing the skipped upstream test or feature and why it is out of scope for this repo.

Prefer `test.skip(...)` or omitting the ported test entirely over keeping a permanently failing test.

Do not skip parser / generator behavior merely because this repo does not currently exercise it. Bias toward carrying upstream SQLite behavior unless there is a concrete reason not to.

## Porting guidelines

Prioritize SQL generation semantics over perfect CLI parity.

Conceptually adapt platform-specific or filesystem-specific behavior to this repo's TypeScript architecture. For example:

- Prefer repo-native TypeScript APIs and helpers over reproducing the Go CLI shape exactly.
- If a small CLI wrapper is still useful, prefer this repo's `trpc-cli` and existing CLI patterns instead of mirroring Go flag parsing one-to-one.
- Preserve observable SQL diff behavior whenever that behavior is covered by relevant tests.

For parser internals, prefer a direct port over a redesign:

- Do not replace the upstream parser with a fresh hand-written parser unless the generated-parser port is clearly blocked.
- Do not introduce a new parser-generator toolchain unless there is a strong reason and the output remains easy to diff against upstream behavior.
- Do not start from `parser/parser.y`.
- Start from `parser/parser.go`, `parser/token.go`, and `parser/node.go`.

Use lower-case SQL keywords in new SQL literals added in this repo.

Prefer simple required parameters over optional bags and fallback-heavy APIs.

## Test porting style

Port Go tests to readable Vitest specs.

- Keep the test body near the top of the file.
- Put fixtures and helpers at the bottom.
- Avoid `beforeEach`, `beforeAll`, `afterEach`, and `afterAll`.
- Avoid mocks unless there is no reasonable way to inject a dependency.
- Prefer integration-style tests when they better express actual usage.

When porting table-driven upstream tests from `tests*.yml`, keep the data easy to audit. It is acceptable to translate them into explicit Vitest cases or to load structured fixtures, whichever keeps the tests readable.

## Port order

Do the port in this order. Do not improvise the dependency order unless a failing test proves a different order is necessary.

1. Scaffold the vendor tree and README.
2. Port the SQLite command tests and fixture data to Vitest.
3. Port `database/sqlite3/database.go` into `database/sqlite3.ts`.
4. Port `database/parser.go` into `database/parser.ts`.
5. Port `parser/node.go` into `parser/ast.ts`.
6. Port `parser/token.go` into `parser/tokenizer.ts`.
7. Port `parser/parser.go` into `parser/parser.ts`.
8. Port `schema/parser.go` into `schema/parser.ts`.
9. Port `schema/generator.go` into `schema/generator.ts`.
10. Wire the thin command / API surface in `cmd/sqlite3def.ts` and `index.ts`.
11. Run vendored tests and then broader repo tests.

Reasoning:

- The database export layer is comparatively small and gives early wins.
- The AST types are needed by tokenizer and parser actions.
- The tokenizer is the parser entrypoint and is easier to reason about before the generated parser body.
- The generated parser depends on both tokenizer and AST structures.
- The schema layers are only worth porting after the parser can produce the required structures.

## Implementation loop

Within that fixed port order, use this loop:

1. Scaffold `packages/sqlfu/src/vendors/sqlite3def/` and `packages/sqlfu/test/vendors/sqlite3def/`.
2. Port upstream sqlite3def tests and fixtures with minimal adaptation.
3. Run the narrowest possible Vitest command for the vendored tests.
4. Read the first failing assertion or first missing module.
5. Implement the next file in the prescribed port order.
6. Keep porting code mechanically from upstream until the current failure moves.
7. If a failing test reaches a clearly out-of-scope feature, skip and document it inline plus in the vendored README.
8. Repeat until the vendored SQLite tests pass.
9. Run the broader relevant `packages/sqlfu/test/*.test.ts` coverage to confirm integration with the rest of the repo.

Do not restart from scratch on each failure. Let the failures pull the implementation into existence incrementally, but keep the overall file order stable.

For this skill, prefer long autonomous execution over frequent check-ins. The goal is to let the agent chew through a large amount of transliteration and test-fixing work with minimal supervision.

## Update workflow

When rerunning this skill for a new upstream release, do not rebuild the vendor tree from scratch.

1. Read the vendored README to find the currently-recorded upstream tag and commit.
2. Fetch or inspect the upstream repo at the new tag.
3. Review the diff between the old and new upstream versions, starting with:
   - `cmd/sqlite3def/`
   - `database/sqlite3/`
   - `database/parser.go`
   - `parser/node.go`
   - `parser/token.go`
   - `parser/parser.go`
   - `schema/parser.go`
   - `schema/generator.go`
4. Update the Vitest ports first.
5. Update vendored files in the same order described in `Port order`.
6. Run tests and update the source implementation until the updated tests pass.
7. Refresh the provenance notes and the skipped-feature list in the vendored README.

Prefer a targeted upstream diff over rereading the whole repo.

## Deliverables

Produce at least these artifacts:

- `packages/sqlfu/src/vendors/sqlite3def/` source files
- `packages/sqlfu/src/vendors/sqlite3def/README.md` with upstream provenance, deliberate deviations, and skipped features
- Vendored Vitest coverage for the kept upstream behavior

Before finishing, report:

- which upstream tag and commit were used
- which upstream tests were ported
- which upstream tests or features were skipped, with reasons
- which local test commands were run
