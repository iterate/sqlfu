---
status: ready
size: small
---

# Version skew between hosted client and local server

When the hosted browser UI on `local.sqlfu.dev` talks to a locally-running `npx sqlfu` backend, the two can drift apart. The hosted client is always the tip of `main`; the user's local server is whatever version they happened to install. Today, a mismatch surfaces as a cryptic 4xx/5xx when an RPC shape has changed. We want "please upgrade sqlfu" to be a first-class UX, not a failure mode of the generic startup error screen.

## Status summary

- Planned. Spec committed first; implementation + tests to follow in subsequent commits on the `skew` branch.
- Main decisions: server exposes its own version, client holds the compatibility rule, version-mismatch composes with the existing `StartupFailure` taxonomy.

## Design

### 1. Server reports its version; client decides compatibility

- The server is dumb. It just says "I am sqlfu vX.Y.Z". It does not encode compatibility rules, because the server is old by definition — if we added the rule there, we would never be able to update it.
- The client is smart. It is hosted by us on `local.sqlfu.dev`, so it is always up to date. It holds a `MINIMUM_SERVER_VERSION` constant and compares on boot.
- Future option (not in this task): host a JSON somewhere (e.g. `www.sqlfu.dev/compat.json`) that the client fetches so we can tighten the floor without a redeploy. The constant is sufficient for bedtime and the shape of the client-side check will not change when we revisit.

### 2. Endpoint shape

Augment the existing `project.status` RPC handler rather than add a new one. It is already the very first thing the client calls on boot (see `Studio` in `client.tsx` — `useSuspenseQuery(orpc.project.status.queryOptions())`). Adding a `serverVersion: string` field piggy-backs on that round-trip and avoids a second fetch.

```ts
// server
project: {
  status: uiBase.handler(({context}) => ({
    initialized: context.project.initialized,
    projectRoot: context.project.projectRoot,
    serverVersion: packageJson.version, // new
  })),
}
```

Rationale for augmenting vs adding `GET /api/version`:

- `project.status` is already a no-side-effects handler that works even when the project is not initialized. Same properties we want from a version probe.
- The RPC client already routes through `/api/rpc`; adding a bare REST endpoint means teaching the oRPC client about it separately.
- If an *older* server responds without `serverVersion`, oRPC will surface it as `undefined` — we treat undefined as "unknown, probably old" which is exactly the right default.

### 3. Compatibility rule lives in client code

New constant + helper in `packages/ui/src/startup-error.ts` (co-located with existing error classification):

```ts
// The floor is the oldest sqlfu server version that speaks today's oRPC contract.
// Bump whenever the client relies on a new/changed RPC field, query param, or event shape.
export const MINIMUM_SERVER_VERSION = '0.0.2-3';
```

A new classifier arm `'version-mismatch'` joins the existing `StartupFailureKind` union. The client performs the check right after `project.status` returns, and throws a typed error that the `StartupErrorBoundary` already catches.

### 4. UX

Pattern after the existing `StartupFailureScreen` sections. A new panel for `kind === 'version-mismatch'` says:

- Headline: "Please upgrade the local sqlfu server"
- "Your local backend is running sqlfu vX.Y.Z, but this UI requires vA.B.C or newer."
- Actions: `npm install -g sqlfu@latest` (copy-to-clipboard-ish), or `npx sqlfu@latest` as a non-global alternative, plus "Retry connection" button.
- Footer: link to the changelog / "what's new" (placeholder ok — keeps the design honest without inventing URLs).

No benign-warning tier for "server newer than client floor" in this pass. If server version > client's `MINIMUM_SERVER_VERSION`, we are fine — the client requires a minimum, not a maximum. A `unknown-version` (server didn't return the field at all) is treated as "definitely too old" and routed to the same upgrade screen. That collapses two cases into one clear UX.

### 5. Error classification composes

`classifyStartupError` stays a pure function. A new wrapper `checkServerVersion(status)` returns either `null` (ok) or a `{kind: 'version-mismatch', serverVersion: string | null}` shape that the caller throws. The boundary catches it and the screen knows how to render it — same as today.

### 6. Semver comparison

No `semver` npm dep. sqlfu's versions are prerelease-heavy (`0.0.2-3`). A tiny internal `compareSqlfuVersions(a, b)` that does numeric-segment + pre-release-tag comparison is enough. Everything we ship has the form `MAJOR.MINOR.PATCH` or `MAJOR.MINOR.PATCH-N`. The comparator asserts that shape and throws otherwise.

### 7. Deleted / replaced

- Nothing. This is additive + a single new `StartupFailureKind` arm.

## Checklist

- [ ] Extend `project.status` RPC to include `serverVersion: string`, sourced from `packages/sqlfu/package.json`.
- [ ] Add integration test in `packages/sqlfu/test/ui-server.test.ts` asserting `serverVersion` matches `packageJson.version` shape.
- [ ] Add `MINIMUM_SERVER_VERSION` + `compareSqlfuVersions` in `packages/ui/src/startup-error.ts` with unit tests in `startup-error.test.ts`.
- [ ] Add `'version-mismatch'` to `StartupFailureKind` and a classifier arm.
- [ ] Perform the version check right after `project.status` resolves in `Studio`. Throw a typed error that the boundary catches.
- [ ] Render an upgrade panel in `StartupFailureScreen` for the new kind.
- [ ] Spot-check the upgrade screen in Chrome via `claude-in-chrome` MCP by temporarily serving an old version string.
- [ ] `pnpm --filter sqlfu typecheck` + `pnpm --filter sqlfu-ui typecheck` + `pnpm --filter sqlfu test --run` + `pnpm --filter sqlfu-ui run test:node`.

## Open questions / decisions made-up-on-user's-behalf (bedtime task)

- **Minimum version value**: set to current `packages/sqlfu/package.json` version (`0.0.2-3`). That floor has zero practical effect today — we just want the plumbing live and asserted. Next time we change an RPC shape, bump the constant in the same PR.
- **Where the version comes from on the server**: `import packageJson from '../../package.json' with {type: 'json'}` — same pattern as `cli.ts`.
- **No `/api/version` REST endpoint**: using oRPC makes the version check go through the exact same transport as everything else, so TLS/CORS/origin quirks that would break RPCs also break the version check. One failure mode, not two.
- **Client also reports its version?** Not useful — the client is always fresh. Keeping the wire one-way keeps the mental model simple.
- **Why not redirect to a hosted "old client for old servers"?** Maybe someday. Pre-alpha: tell the user to upgrade; move on.
