# demo

`local.sqlfu.dev` should have a "Demo" button which takes you to a fresh workspace which uses a browser sqlite implementation for messing around just for your session. Hosted at `demo.local.sqlfu.dev`.

Linked reference: https://sqlite.org/wasm/doc/trunk/demo-123.md (official `@sqlite.org/sqlite-wasm`).

## Status

fleshed-out, ready for implementation.

## Decisions (filled in from the original sketch)

- **SQLite in the browser:** use the official `@sqlite.org/sqlite-wasm` package. In-memory `:memory:` database per tab. Page reload = fresh workspace. No OPFS (for now). Don't persist across sessions.
- **Package layout:** keep it in `packages/ui`. Do not create `packages/demo`. The same Vite bundle is served at both `local.sqlfu.dev` and `demo.local.sqlfu.dev`. Mode detection happens at runtime.
- **Router plumbing:** the oRPC client in `packages/ui/src/client.tsx` currently uses `RPCLink` (fetch-based). In demo mode, swap to `createRouterClient` (from `@orpc/server`) against a *browser* oRPC router that runs against the wasm sqlite. No fetch at all for backend calls.
- **Demo router scope:** the browser backend does NOT bundle `sqlfu`'s full node-only backend. It implements the subset of the UiRouter contract that makes sense without a filesystem:
  - `project.status` → always `{initialized: true, projectRoot: '(demo)'}`
  - `schema.get` → read sqlite_master from wasm db
  - `table.list` / `table.save` / `table.delete` → run against wasm db
  - `sql.run` → run against wasm db
  - `sql.analyze` → return `{}` (no-op, skip static analysis in demo)
  - `catalog` → return an empty catalog (`{queries: []}`)
  - All other endpoints (`schema.check`, `schema.authorities.*`, `schema.command`, `schema.definitions`, `sql.save`, `query.*`) → throw a clear "not supported in demo" error and/or the UI hides the affected surfaces.
- **UI affordances in demo mode:**
  - Add a prominent "Demo" button on `local.sqlfu.dev` (only shown when we're NOT already in demo mode). It opens `demo.local.sqlfu.dev` in the current tab.
  - Add a small "Demo mode" banner to the UI when running in demo mode, with a link back to `local.sqlfu.dev`.
  - Hide / disable UI routes that depend on unsupported endpoints (schema check, migrations/authorities, saving queries).
- **Seed data:** on each fresh load, seed the in-browser db with the same posts example from `packages/ui/test/template-project/definitions.sql` plus a couple of example rows (mirroring what `ensureDatabase` does in `packages/sqlfu/src/ui/server.ts`).
- **Mode detection:** `hostname === 'demo.local.sqlfu.dev'` OR URL search param `?demo=1` (for local testing without DNS).
- **Deployment:** add a Cloudflare `Website` entry in `alchemy.run.mts` for the demo host, pointing at the same `packages/ui` dist (same build, served at a different domain).

## Deliberately out of scope (for this first pass)

- Migrations, definitions.sql editing, and the full schema authorities UI in demo mode.
- Saving generated queries / catalog in demo mode.
- OPFS persistence / per-session URLs you can share.
- Bundling the full `sqlfu` backend (schemadiff, typegen, migration engine) into the browser. The task hints at this and it's possible but messy — keep it out of phase 1.
- Playwright coverage for demo mode — leave a manual-test note; the existing local.sqlfu.dev spec is the reference integration path.

These are reasonable "v2" follow-ups once the basic demo ships.

## Checklist

- [ ] Add `@sqlite.org/sqlite-wasm` dependency to `packages/ui`.
- [ ] Implement `packages/ui/src/demo/sqlite-wasm-client.ts`: create a wasm sqlite instance, wrap it in an object that exposes `all/run/raw/transaction` (matching what the existing UiRouter code needs).
- [ ] Implement `packages/ui/src/demo/router.ts`: a fresh oRPC router typed as `UiRouter`, implementing the subset listed above against the wasm client. Seed the db on creation.
- [ ] Implement `packages/ui/src/demo/client.ts`: export an `isDemoMode()` helper and a `createDemoOrpcClient()` that uses `createRouterClient` to produce a `RouterClient<UiRouter>` with no fetch.
- [ ] Wire `packages/ui/src/client.tsx`: branch at the place where `orpcClient` is created. In demo mode use `createDemoOrpcClient()`; otherwise keep the existing RPCLink behavior.
- [ ] Add a "Demo" button on `local.sqlfu.dev` UI (only when `!isDemoMode()`). It navigates to `https://demo.local.sqlfu.dev/` (or `?demo=1` in dev).
- [ ] Add a small "Demo mode" banner when `isDemoMode()` is true, with a link to `https://local.sqlfu.dev/`.
- [ ] Hide or gracefully error the UI surfaces that rely on unsupported endpoints in demo mode (schema check card, authorities, save-query dialog, etc.).
- [ ] Extend `alchemy.run.mts` with a `Website('demo-local-ui', ...)` entry for `demo.local.sqlfu.dev` serving the same `packages/ui/dist`.
- [ ] Update `packages/ui/AGENTS.md` with a short "Demo mode" section so future agents know the third deployment shape.
- [ ] Verify: `pnpm --filter sqlfu-ui build` succeeds. Locally start the dev harness and open `?demo=1` to sanity-check: the table browser shows seeded posts, SQL runner can run `select * from posts`, the schema check surface is hidden/disabled, and the "Demo" button is gone while the banner is shown.

## Implementation notes (log during work)

(populated during implementation)
