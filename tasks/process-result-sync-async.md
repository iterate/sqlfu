---
status: in-progress
size: medium
branch: try/process-result-sync-async
---

# Split Observability Hooks By Client Syncness

## Status Summary

Early experiment. The task spec is in place and implementation has not started yet. The goal is to find out whether the public observability API can drop `processResult` from common hook authoring by splitting sync and async hook types, while preserving the current `instrument(client, ...hooks)` ergonomics for built-in hooks.

## Assumptions

- The docs concern is real: `processResult` makes the PostHog and DogStatsD recipes look more complicated than the sync `node:sqlite` examples need to be.
- `instrumentClient` already knows whether a client is sync or async via `client.sync`, so the wrapper should be able to choose a sync or async hook path without asking custom hook authors to write a promise-shape helper.
- Built-in helpers like `instrument.otel()` and `instrument.onError()` should remain one-liners that work for either client kind.
- It is acceptable for public custom hook types to have explicit sync and async variants, even if that means generic "works for both" hooks use a small adapter type.

## Checklist

- [ ] Add readable sync and async query hook types that do not expose `processResult`.
- [ ] Update instrumentation internals to select the sync or async hook path from `client.sync`.
- [ ] Keep `instrument.otel({tracer})` and `instrument.onError(report)` usable with both sync and async clients.
- [ ] Rewrite docs and observability recipe tests to remove `processResult` from sync examples.
- [ ] Run focused observability tests and typecheck.
- [ ] If the experiment works, move this task to `tasks/complete/` with a date prefix before final handoff.

## Implementation Notes

- 2026-04-30: Current API has a single generic `QueryExecutionHook` that receives `{context, execute, processResult}`. The proposed shape is to split sync and async hook args so sync recipes can use ordinary `try/catch`, while built-in helpers can provide both variants behind a single value.
