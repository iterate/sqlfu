# Integrations

Integrations are the places where sqlfu deliberately meets another tool's
model instead of asking you to rewrite the rest of your app around sqlfu.

Use this section when the question is "how does sqlfu fit with this other
runtime, framework, service, or SDK?" For database-driver setup only, use
[Guides](./guides.md) or the compact [Adapters](./adapters.md) reference.

## First-class integration pages

- [Better Auth](./integrations/better-auth.md): let Better Auth generate its
  auth tables into `definitions.sql`, while sqlfu still owns migration drafts
  and migration execution.
- [Cloudflare / Alchemy](./integrations/cloudflare-alchemy.md): use the
  `sqlfu/cloudflare` module to find local Miniflare D1 files, read Alchemy D1
  state, or talk to deployed Cloudflare D1 over HTTP.
- [Effect SQL runtime](./effect-sql.md): generate query wrappers that return
  Effect values and read `SqlClient.SqlClient` from the Effect environment.
- [Kysely](./integrations/kysely.md): use sqlfu for schema, migrations, and
  hand-written SQL wrappers while Kysely remains your query builder.
- [OpenTelemetry](./integrations/opentelemetry.md): the short path for sending
  generated query names to OTel spans.

## Adjacent integration surfaces

Some integrations are documented where their main decision lives:

- [Cloudflare D1](./guides/cloudflare-d1.md) and
  [Cloudflare Durable Objects](./guides/durable-objects.md) stay in Guides
  because they are full runtime setup guides: project shape, config, migrations,
  and Worker code.
- [Observability](./observability.md) stays in Features because it documents the
  whole `instrument()` hook model, including OpenTelemetry, Sentry, PostHog, and
  Datadog.
- Runtime validation libraries live in [Runtime validation](./runtime-validation.md):
  arktype, valibot, zod, and zod-mini change the generated wrapper boundary.
- Turso, libSQL, Expo SQLite, Bun SQLite, and sqlite-wasm live in
  [Guides](./guides.md) because the main work is choosing the runtime adapter.
- Import-path decisions live in [Import surface](./imports.md), including
  `sqlfu/cloudflare`, `sqlfu/api`, `sqlfu/analyze`, and feature subpaths.
