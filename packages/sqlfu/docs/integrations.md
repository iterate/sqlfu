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
- [Cloudflare D1](./guides/cloudflare-d1.md): use D1 from Workers and, when
  needed, let sqlfu commands operate on the deployed D1 database through
  `sqlfu/cloudflare`.
- [Cloudflare Durable Objects](./guides/durable-objects.md): run sqlfu against
  per-object SQLite storage and apply bundled migrations on startup.
- [Effect SQL runtime](./effect-sql.md): generate query wrappers that return
  Effect values and read `SqlClient.SqlClient` from the Effect environment.
- [Observability](./observability.md): send generated query names to
  OpenTelemetry, Sentry, PostHog, and Datadog through one instrumentation hook.

## Adjacent integration surfaces

Some integrations are documented where their main decision lives:

- Runtime validation libraries live in [Runtime validation](./runtime-validation.md):
  arktype, valibot, zod, and zod-mini change the generated wrapper boundary.
- Turso, libSQL, Expo SQLite, Bun SQLite, and sqlite-wasm live in
  [Guides](./guides.md) because the main work is choosing the runtime adapter.
- Import-path decisions live in [Import surface](./imports.md), including
  `sqlfu/cloudflare`, `sqlfu/api`, `sqlfu/analyze`, and feature subpaths.
