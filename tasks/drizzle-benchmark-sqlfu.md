---
status: blocked-on-local-benchmark-run
size: medium
---

# Drizzle benchmark comparison harness

Status summary: benchmark harness and sqlfu target are implemented in `benchmarks/drizzle-sqlfu`, with focused typechecks passing for the sqlfu target and the Postgres benchmark path. The missing piece is running the actual load benchmark locally; Docker daemon is not available in this session and `k6` is not installed.

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

- [x] Save and inspect the tweeted screenshot from the clipboard. _Saved as `/tmp/drizzle-claim.9mHSnP/drizzle-tweet.png`; screenshot shows Drizzle v1.0.0-rc.1 JIT vs Go v1.25.5 on the public benchmark dashboard._
- [x] Trace the public benchmark source and note the exact Drizzle dashboard/repo links. _Dashboard is `https://orm.drizzle.team/benchmarks`; source is `drizzle-team/drizzle-benchmarks`._
- [x] Create a local worktree branch without pushing. _Created `../worktrees/sqlfu/drizzle-benchmark-sqlfu` on branch `drizzle-benchmark-sqlfu`; no push performed._
- [x] Add a copied/adapted benchmark harness with explicit Drizzle attribution. _Added `benchmarks/drizzle-sqlfu`, adapted from `drizzle-team/drizzle-benchmarks`, with top-of-file attribution comments on copied source files._
- [x] Add a `start:sqlfu` benchmark server target using sqlfu-style query wrappers. _Implemented `src/sqlfu-server-node.ts`, `src/sqlfu/pg-client.ts`, and `src/sqlfu/queries.ts`; sqlfu target listens on port `3003`._
- [x] Document how to generate requests and run Drizzle, Go, and sqlfu targets locally. _Documented in `benchmarks/drizzle-sqlfu/README.md`, including `--ignore-workspace` commands and `.env.example`._
- [x] Run focused verification for the new harness. _`pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace typecheck` and `typecheck:postgres` pass._
- [ ] Run the actual local benchmark. _Blocked: `start:docker` cannot connect to `/var/run/docker.sock`, and `k6` is not installed in this environment._

## Implementation Notes

- Clipboard screenshot saved locally at `/tmp/drizzle-claim.9mHSnP/drizzle-tweet.png`.
- Upstream benchmark clone for inspection: `/tmp/drizzle-benchmarks-ignoreme`.
- The upstream checked-in package still pinned `drizzle-orm`/`drizzle-kit` beta builds, even though the dashboard screenshot is rc.1. The local benchmark package pins `1.0.0-rc.1` and updates the Postgres Drizzle path from `useJitMappers` to `jit`.
- Full copied upstream typecheck still fails because the retained Prisma/SQLite examples need generated clients or older API shapes. Focused checks cover the new sqlfu target and the Postgres Drizzle/seed/generate path.
