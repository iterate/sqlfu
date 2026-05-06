---
status: done
size: small
branch: better-auth-format-append
pr: https://github.com/mmkal/sqlfu/pull/97
---

# Integrations docs section

## Status summary

Done. The docs site now has an Integrations sidebar group, a source
`integrations.md` overview page, and dedicated Better Auth, Cloudflare /
Alchemy, and OpenTelemetry integration pages. Cloudflare D1 and Durable Objects
runtime walkthroughs stay in Guides; Observability stays in Features. The
website build passes.

## Checklist

- [x] Add an Integrations overview page. _Added `packages/sqlfu/docs/integrations.md` with Better Auth, Cloudflare / Alchemy, OpenTelemetry, and Effect SQL links._
- [x] Move Better Auth guidance out of the general adapter page into a dedicated integration page. _Added `packages/sqlfu/docs/integrations/better-auth.md`; `adapters.md` now keeps only a compact pointer._
- [x] Add a Cloudflare integration focused on `sqlfu/cloudflare`. _Added `packages/sqlfu/docs/integrations/cloudflare-alchemy.md` for Miniflare D1 path lookup, Alchemy D1 state, D1 HTTP, and D1 name lookup helpers._
- [x] Add a short OpenTelemetry integration page. _Added `packages/sqlfu/docs/integrations/opentelemetry.md` as a focused `instrument.otel()` setup page that points to Observability for the full hook model._
- [x] Add the docs pages to website generation and sidebar navigation. _Updated `website/scripts/sync-docs.mjs` and `website/astro.config.mjs`._
- [x] Regenerate tracked docs index artifacts. _Ran `sync-docs` and `sync-llms`; `website/public/llms.txt` now lists the integration pages._
- [x] Verify the docs site. _Passed `pnpm --filter sqlfu-website build` after building `@sqlfu/ui` for the website UI sync step._

## Implementation Notes

- 2026-05-06: Initial pass kept Cloudflare D1 and Durable Objects at their
  existing guide URLs, but moved their sidebar entry under Integrations.
- 2026-05-06: Left runtime validation libraries and database-driver runtimes as
  adjacent links from the overview rather than treating every adapter as a
  first-class integration.
- 2026-05-06: Revised the section after review: Cloudflare D1 and Durable
  Objects are guides again, Observability is a feature again, and Integrations
  now has dedicated Cloudflare / Alchemy and OpenTelemetry pages.
