---
status: needs-grilling
size: small
---

# Report published-package size on PRs

After the slim-package work (PR #29) got the tarball from 1.5 MB / 18.8 MB down to 217 kB / 965 kB, we should surface any regression in a PR comment before it lands on main. `npm pack --dry-run` output already has everything we need (packed size, unpacked size, file count).

Rough shape:

- a GitHub Actions job that runs `pnpm --filter sqlfu build && npm pack --dry-run` on the PR branch and on main
- posts a sticky comment with a before/after table (packed / unpacked / files)
- ideally also a warning threshold (e.g. ≥10 % bump without a task file acknowledging it)

Open design calls to make when picking this up:

- single-shot GH Action or something package-manager-hosted (e.g. pkg-size.dev, bundle-stats)?
- do we care about the bundled `dist/vendor/typesql/sqlfu.js` size specifically, or just the final tarball?
- comment update strategy — overwrite sticky, or append a new one each push?

Nice-to-have, not critical: a markdown badge in the sqlfu README showing current tarball size.
