---
status: in-progress
size: medium
---

# Drizzle benchmark comparison harness

Status summary: local worktree is set up and the Drizzle benchmark source has been traced to `drizzle-team/drizzle-benchmarks`. The main missing piece is a local sqlfu server target that can run against the same seeded Postgres database and K6 request mix, then basic verification that the harness scripts typecheck or start.

## Goal

Let sqlfu be benchmarked beside the public Drizzle benchmark that backs the `Drizzle v1.0.0-rc.1 JIT vs Go v1.25.5` screenshot.

## Current understanding

The screenshot came from Drizzle's public benchmark dashboard. The visible run compares `Drizzle v1.0.0-rc.1 JIT` on `Bun v1.3.13 / Bun SQL` with `Go v1.25.5` for the micro e-commerce PostgreSQL benchmark. The dashboard links to `https://github.com/drizzle-team/drizzle-benchmarks`, whose README describes a two-machine K6 setup over 1GB ethernet.

## Assumptions

- Keep this as a benchmark harness, not a normal package API change.
- Do not push the branch or open a PR yet.
- Avoid committing Drizzle's generated `data/requests.json` corpus; the upstream generator can recreate it.
- Since sqlfu currently has SQLite-focused adapters and generated type analysis, use a benchmark-local Postgres sqlfu client wrapper around `pg.Pool` and typed query functions. That is enough to measure the "raw SQL plus hand-shaped rows" runtime path without implying Postgres typegen support exists.
- Use the same endpoint routes and SQL shapes as Drizzle/Go so results are comparable.

## Checklist

- [ ] Save and inspect the tweeted screenshot from the clipboard.
- [ ] Trace the public benchmark source and note the exact Drizzle dashboard/repo links.
- [ ] Create a local worktree branch without pushing.
- [ ] Add a copied/adapted benchmark harness with explicit Drizzle attribution.
- [ ] Add a `start:sqlfu` benchmark server target using sqlfu-style query wrappers.
- [ ] Document how to generate requests and run Drizzle, Go, and sqlfu targets locally.
- [ ] Run focused verification for the new harness.

## Implementation Notes

- Clipboard screenshot saved locally at `/tmp/drizzle-claim.9mHSnP/drizzle-tweet.png`.
- Upstream benchmark clone for inspection: `/tmp/drizzle-benchmarks-ignoreme`.
