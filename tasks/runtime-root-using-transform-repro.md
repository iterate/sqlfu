---
status: ready
size: small
---

# Reproduce runtime root ERM syntax in build output

Status summary: Spec only so far. The replacement for PR 142 should prove the actual downstream problem with a tiny script before changing source code. Nothing has been fixed yet.

## Problem

PR 142 tried to remove `using` / `await using` from selected runtime source files by hand. That is too local and too random: the real problem is that the published `sqlfu` root runtime import graph can contain explicit resource management syntax after `pnpm build`, and bundlers targeting older JavaScript syntax can fail before user code runs.

The likely product direction is to keep authoring with explicit resource management in source, then have the build step transform package output to plain `try` / `finally` where the published runtime surface needs it.

## Assumptions

- Source code may keep `using` and `await using`.
- The repro should run from a clean checkout with installed dependencies.
- The repro can be a shell script rather than a formal test for now.
- The important signal is downstream parser compatibility of the built package surface, not a regex assertion against authored source.

## Checklist

- [ ] Close PR 142 in favor of a focused repro branch.
- [ ] Add a script that runs `pnpm --filter sqlfu build`.
- [ ] Make the script bundle or parse the built root `sqlfu` entry with a realistic lower syntax target.
- [ ] Make the script fail on current `main` with the bundler/parser error that motivated PR 142.
- [ ] Document the expected next fix: transform built ERM syntax during `pnpm build`, rather than hand-editing runtime source.

## Acceptance Criteria

- A reviewer can run one shell script and see the failure.
- The failure points at explicit resource management syntax in the built root runtime import graph.
- The task and PR body explain why the repro replaces PR 142.
