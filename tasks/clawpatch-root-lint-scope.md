---
status: ready
size: small
clawpatch_finding: fnd_sig-feat-release-4862937c51-b1e9_003fc4b337
base_pr: 133
---

# Make the root lint script pass

Status summary: Not implemented yet. This stacked task starts from the root test
gate fix in PR 133 and targets the Clawpatch finding that `pnpm lint` exits
nonzero on a clean checkout.

## Assumptions

- `pnpm lint` should be a usable root quality gate.
- The fix should prefer making lint scope match the maintained source surface
  over chasing intentionally vendored, generated, scratch, or fixture output.
- Real source violations found inside the maintained surface should be fixed
  directly when the fix is small.
- This branch uses the shared clawpatch state directory from the main checkout:
  `/Users/mmkal/src/sqlfu/.clawpatch`.

## Checklist

- [ ] Reproduce the current root lint failure on this stacked branch.
- [ ] Decide which failures are maintained source issues versus scope/ignore issues.
- [ ] Update lint config or source files so `pnpm lint` passes.
- [ ] Validate `pnpm lint` and any focused checks exposed by the fix.
- [ ] Revalidate the clawpatch finding with the shared state directory.

## Implementation Notes

- Source finding: `Root lint script fails on the current workspace`.
