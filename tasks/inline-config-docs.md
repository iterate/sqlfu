---
status: ready
size: medium
---

# Bias docs and init toward inline config

Status: Spec commit only. The intended change is to make inline config the primary path in onboarding docs and generated starter files, with file-based config presented as the option for larger projects or shared configuration.

## Goal

Make sqlfu's instructions, guides, getting started material, tutorials, and starter generation consistently teach inline config first. File-based config should still be documented, but as the thing users graduate to when they want to split configuration out of query files or share it across multiple files.

## Assumptions

- Inline config is the preferred first-run experience for new users.
- File-based config remains supported and useful, but it should not be the first thing a new user sees unless the surrounding topic is specifically about shared configuration.
- `sqlfu init` can change its generated files and messages because sqlfu is pre-alpha and there is no compatibility burden to preserve old starter output.
- Docs should preserve accurate examples of file-based config where they explain config files, migration presets, or multi-file project organization.

## Checklist

- [ ] Audit docs, examples, tutorials, and guide-like copy for file-based-first instructions.
- [ ] Rewrite onboarding and getting-started paths so the first runnable examples use inline config.
- [ ] Move file-based config explanations into an explicit "split it out later" or advanced/shared-config framing.
- [ ] Update `sqlfu init` output and tests so new projects start from inline config by default.
- [ ] Run focused tests and docs/build checks that cover the changed surfaces.
- [ ] Open a draft PR and keep it updated with the net behavior change for reviewers.

## Implementation Notes

- Worktree: `../worktrees/sqlfu/inline-config-docs`
- Branch: `inline-config-docs`
