---
status: benchmark-run-needs-review
size: medium
---

# Drizzle benchmark comparison harness

Status summary: benchmark harness and sqlfu target are implemented in `benchmarks/drizzle-sqlfu`, with local Postgres benchmarks run against sqlfu/pg and Drizzle Node. sqlfu was effectively tied on throughput and slightly lower on HTTP latency in the 4-worker local run; the remaining work is human review of whether this experimental pg adapter belongs in the branch.

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
- [x] Run the actual local benchmark. _After OrbStack started, ran the full K6 staged workload via the `grafana/k6` Docker image against sqlfu/pg and Drizzle Node._

## Implementation Notes

- Clipboard screenshot saved locally at `/tmp/drizzle-claim.9mHSnP/drizzle-tweet.png`.
- Upstream benchmark clone for inspection: `/tmp/drizzle-benchmarks-ignoreme`.
- The upstream checked-in package still pinned `drizzle-orm`/`drizzle-kit` beta builds, even though the dashboard screenshot is rc.1. The local benchmark package pins `1.0.0-rc.1` and updates the Postgres Drizzle path from `useJitMappers` to `jit`.
- Full copied upstream typecheck still fails because the retained Prisma/SQLite examples need generated clients or older API shapes. Focused checks cover the new sqlfu target and the Postgres Drizzle/seed/generate path.
- First full sqlfu run with the default `os.cpus().length` workers failed 4.17% of requests because this machine launched 16 workers, each with `pg.Pool({max: 10})`, exceeding Postgres' default connection cap. Added `BENCH_WORKERS` and reran with `BENCH_WORKERS=4` to match the upstream screenshot machine's core count.
- `BENCH_WORKERS=4` sqlfu/pg result: `3,113,010` requests, `9,145.7 req/s`, `2.61ms` average HTTP latency, `3.07ms` p95, `0` failed requests.
- `BENCH_WORKERS=4` Drizzle Node result: `3,109,825` requests, `9,136.3 req/s`, `2.82ms` average HTTP latency, `3.8ms` p95, `0` failed requests.
- K6 logs are in `/tmp/sqlfu-k6.log` and `/tmp/drizzle-node-k6.log`; large raw CSV outputs were removed after extracting summaries.
