# Drizzle benchmark with a sqlfu target

This directory is adapted from [`drizzle-team/drizzle-benchmarks`](https://github.com/drizzle-team/drizzle-benchmarks). The copied benchmark schema, seed data, request generator, K6 runner, Drizzle server, Prisma server, and Go/sqlc server are retained so local results stay comparable with Drizzle's public dashboard. The local modifications are:

- `src/sqlfu-server-node.ts`: Hono server on port `3003` using sqlfu-style typed query wrappers.
- `src/sqlfu/*`: a benchmark-local `pg.Pool` client implementing sqlfu's `AsyncClient` shape plus query wrappers using the same SQL shapes as the Drizzle/Go benchmark.
- package scripts for `start:sqlfu`, `bench:sqlfu`, `start:drizzle:bun`, and `start:go`.
- generated request JSON is ignored; run `pnpm start:generate` after seeding.

## What this compares

Drizzle's screenshot was the public dashboard's `Drizzle v1.0.0-rc.1 JIT vs Go v1.25.5` run for the micro e-commerce PostgreSQL workload. It showed `Drizzle v1.0.0-rc.1 JIT` using `Bun v1.3.13 / Bun SQL` against Go, on a Lenovo M720q with an Intel Core i3-9100T and 32GB RAM.

The upstream benchmark measures HTTP request roundtrip under K6 load, not just row mapper microbenchmarks. The sqlfu target keeps the same route surface and SQL, using named `pg` prepared statements and returning the driver rows directly.

## Setup

Install this standalone benchmark package from the repo root:

```bash
pnpm --dir benchmarks/drizzle-sqlfu install --ignore-workspace
```

Start Postgres and seed the micro database:

```bash
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:docker
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:seed
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:generate
```

Create `.env` from `.env.example` before running the servers:

```bash
cp benchmarks/drizzle-sqlfu/.env.example benchmarks/drizzle-sqlfu/.env
```

## Servers

Run one server target at a time:

```bash
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:drizzle:bun
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:drizzle:node
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:go
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace start:sqlfu
```

Ports:

- Drizzle/Prisma examples: `3000`/`3001`, matching upstream.
- Go/sqlc: `3002`.
- sqlfu: `3003`.

## Benchmarks

Install `k6` first; the package dependency is only a type stub.

```bash
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace bench:drizzle
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace bench:go
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace bench:sqlfu
```

Then merge benchmark outputs:

```bash
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace tsx bench/prepare.ts --folder results
```

For a serious comparison, follow upstream's two-machine setup rather than running K6, Postgres, and the server on one laptop.

## Verification

The copied Prisma and SQLite examples are retained from upstream but are not part of the sqlfu comparison path. Focused checks:

```bash
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace typecheck
pnpm --dir benchmarks/drizzle-sqlfu --ignore-workspace typecheck:postgres
```
