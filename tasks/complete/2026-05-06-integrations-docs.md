---
status: done
size: small
branch: better-auth-format-append
pr: https://github.com/mmkal/sqlfu/pull/97
---

# Integrations docs section

## Status summary

Done. The docs site now has an Integrations sidebar group, a source
`integrations.md` overview page, and a dedicated Better Auth integration page.
Existing Cloudflare, Durable Object, Effect SQL, and Observability docs are
linked from the new section. The website build passes.

## Checklist

- [x] Add an Integrations overview page. _Added `packages/sqlfu/docs/integrations.md` with Better Auth, Cloudflare, Effect SQL, and Observability links._
- [x] Move Better Auth guidance out of the general adapter page into a dedicated integration page. _Added `packages/sqlfu/docs/integrations/better-auth.md`; `adapters.md` now keeps only a compact pointer._
- [x] Add the docs pages to website generation and sidebar navigation. _Updated `website/scripts/sync-docs.mjs` and `website/astro.config.mjs`._
- [x] Regenerate tracked docs index artifacts. _Ran `sync-docs` and `sync-llms`; `website/public/llms.txt` now lists the integration pages._
- [x] Verify the docs site. _Passed `pnpm --filter sqlfu-website build` after building `@sqlfu/ui` for the website UI sync step._

## Implementation Notes

- 2026-05-06: Kept Cloudflare D1 and Durable Objects at their existing guide
  URLs, but moved their sidebar entry under Integrations so the docs structure
  answers "which external ecosystem am I integrating with?" directly.
- 2026-05-06: Left runtime validation libraries and database-driver runtimes as
  adjacent links from the overview rather than treating every adapter as a
  first-class integration.
