---
status: benchmark-run-needs-review
size: medium
---

# Drizzle benchmark comparison harness

Status summary: benchmark harness and sqlfu targets are implemented in `benchmarks/drizzle-sqlfu`, with local Postgres benchmarks run against Drizzle Node, Drizzle Bun SQL, sqlfu/pg, and sqlfu/Bun.SQL. The local 4-worker runs put sqlfu in the same throughput band as Drizzle rc.1 JIT; remaining work is human review of whether the experimental Postgres/Bun adapters belong in the branch.

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
- Include a direct sqlfu-over-`Bun.SQL` target because the tweeted Drizzle dashboard run used Bun SQL.

## Checklist

- [x] Save and inspect the tweeted screenshot from the clipboard. _Saved as `/tmp/drizzle-claim.9mHSnP/drizzle-tweet.png`; screenshot shows Drizzle v1.0.0-rc.1 JIT vs Go v1.25.5 on the public benchmark dashboard._
- [x] Trace the public benchmark source and note the exact Drizzle dashboard/repo links. _Dashboard is `https://orm.drizzle.team/benchmarks`; source is `drizzle-team/drizzle-benchmarks`._
- [x] Create a local worktree branch without pushing. _Created `../worktrees/sqlfu/drizzle-benchmark-sqlfu` on branch `drizzle-benchmark-sqlfu`; no push performed._
- [x] Add a copied/adapted benchmark harness with explicit Drizzle attribution. _Added `benchmarks/drizzle-sqlfu`, adapted from `drizzle-team/drizzle-benchmarks`, with top-of-file attribution comments on copied source files._
- [x] Add a `start:sqlfu` benchmark server target using sqlfu-style query wrappers. _Implemented `src/sqlfu-server-node.ts`, `src/sqlfu/pg-client.ts`, and `src/sqlfu/queries.ts`; sqlfu/pg target listens on port `3003`._
- [x] Add a sqlfu Bun SQL comparison target. _Implemented `src/sqlfu-server-bun.ts` and `src/sqlfu/bun-client.ts`; sqlfu/Bun.SQL target listens on port `3004`._
- [x] Align sqlfu endpoint response shapes with upstream Drizzle routes. _Kept `findFirst`-style customer/supplier lookups as single objects and returned arrays for the one-row `findMany`/select endpoints._
- [x] Document how to generate requests and run Drizzle, Go, and sqlfu targets locally. _Documented in `benchmarks/drizzle-sqlfu/README.md`, including `--ignore-workspace` commands and `.env.example`._
- [x] Run focused verification for the new harness. _`pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace typecheck` and `typecheck:postgres` pass._
- [x] Run the actual local benchmark. _After OrbStack started, ran the full K6 staged workload via the `grafana/k6` Docker image against sqlfu/pg, sqlfu/Bun.SQL, Drizzle Node, and Drizzle Bun SQL._

## Implementation Notes

- Clipboard screenshot saved locally at `/tmp/drizzle-claim.9mHSnP/drizzle-tweet.png`.
- Upstream benchmark clone for inspection: `/tmp/drizzle-benchmarks-ignoreme`.
- The upstream checked-in package still pinned `drizzle-orm`/`drizzle-kit` beta builds, even though the dashboard screenshot is rc.1. The local benchmark package pins `1.0.0-rc.1` and updates the Postgres Drizzle path from `useJitMappers` to `jit`.
- Full copied upstream typecheck still fails because the retained Prisma/SQLite examples need generated clients or older API shapes. Focused checks cover the new sqlfu target and the Postgres Drizzle/seed/generate path.
- First full sqlfu run with the default `os.cpus().length` workers failed 4.17% of requests because this machine launched 16 workers, each with `pg.Pool({max: 10})`, exceeding Postgres' default connection cap. Added `BENCH_WORKERS` and reran with `BENCH_WORKERS=4` to match the upstream screenshot machine's core count.
- After initial sqlfu runs, I found that four sqlfu routes were unwrapping one-row arrays while the upstream Drizzle routes returned arrays. Fixed those routes and reran the sqlfu/pg and sqlfu/Bun.SQL comparisons below.
- Local benchmark environment: same laptop for server, Postgres, and K6; Postgres in OrbStack; `BENCH_WORKERS=4`; Bun `1.3.11` locally, while the tweeted dashboard screenshot used Bun `1.3.13`.

| Target | Requests | Req/s | Avg HTTP latency | p95 HTTP latency | Failed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Drizzle Node JIT | `3,109,825` | `9,136.3` | `2.82ms` | `3.8ms` | `0` |
| sqlfu over `pg` | `3,110,962` | `9,139.7` | `2.77ms` | `3.08ms` | `0` |
| Drizzle Bun SQL JIT | `3,139,775` | `9,224.2` | `1.02ms` | `1.65ms` | `0` |
| sqlfu over `Bun.SQL` | `3,119,528` | `9,161.7` | `2.23ms` | `1.66ms` | `0` |

- Interpretation: on this local one-machine setup, sqlfu is effectively tied with Drizzle rc.1 JIT for the pg/Node comparison and close to Drizzle's Bun SQL target. The Bun SQL run had a large max-latency outlier, so the safest conclusion is "same broad performance band", not a defensible win.
- K6 logs are in `/tmp/sqlfu-pg-aligned-k6.log`, `/tmp/sqlfu-bun-aligned-k6.log`, `/tmp/drizzle-node-k6.log`, and `/tmp/drizzle-bun-k6.log`; large raw CSV outputs were removed after extracting summaries.
