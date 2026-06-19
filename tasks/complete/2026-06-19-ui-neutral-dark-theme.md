---
status: done
size: medium
---

# Neutral dark theme for sqlfu UI

## Status Summary

Complete. Dark mode now uses a neutral near-black / dark-grey palette with a restrained teal accent, the table variables match the new shell, and CodeMirror owns token-backed gutter and autocomplete styling. No known missing pieces remain.

## Goal

The sqlfu UI should feel like a quiet database studio: neutral dark grey / near-black surfaces, thin subdued borders, and a restrained accent. Outerbase and Drizzle Studio are the reference direction: dense, calm operational tooling rather than a saturated brown product shell.

## Assumptions

- Dark mode is the priority because that is the abrasive case called out in the request.
- The light theme can remain mostly intact unless the shared CSS variables require small companion changes.
- The accent should stop reading as orange/brown; a cool blue-green accent is acceptable if used sparingly.
- CodeMirror should use the app theme tokens rather than relying only on CodeMirror's built-in dark theme.
- The clipboard screenshot captured at `/tmp/sqlfu-codemirror-clipboard.png` is the failure reference: white gutter, and autocomplete text/background contrast mismatch.

## Checklist

- [x] Replace the dark theme's warm brown base colors with neutral near-black / dark grey tokens. _Implemented in `packages/ui/src/styles.css` dark and system-dark variable blocks._
- [x] Tone down large background treatments so the app reads as a calm tool surface. _Removed the warm radial background treatment and replaced it with a restrained near-black vertical gradient._
- [x] Restyle related data-grid variables so table headers and append rows fit the new dark theme. _Updated `--rg-*` dark variables to neutral grey values._
- [x] Add explicit CodeMirror dark-mode styling for editor surfaces, gutter, active line, cursor, selection, lint gutter, and completion tooltip. _Added shared CodeMirror CSS variables plus `appCodeMirrorTheme` in `packages/ui/src/sql-codemirror.tsx`._
- [x] Add a regression test that exercises the SQL editor in dark mode and verifies the gutter and autocomplete popup are dark with readable text. _Added the Playwright regression `sql runner keeps CodeMirror gutter and autocomplete readable in dark theme`._
- [x] Verify the updated UI visually in desktop and narrow/mobile viewports. _Captured `/tmp/sqlfu-neutral-dark-sql.png`, `/tmp/sqlfu-neutral-dark-table.png`, and `/tmp/sqlfu-neutral-dark-mobile.png`._
- [x] Open a draft PR early, then keep pushing implementation commits to the worktree branch. _Draft PR #143 was opened after the spec commit._

## Implementation Notes

- Worktree: `../worktrees/sqlfu/ui-neutral-dark-studio`
- Branch: `ui/neutral-dark-studio`
- PR: https://github.com/iterate/sqlfu/pull/143
- Verification:
  - `pnpm --filter @sqlfu/ui test --grep "syntax highlighting|CodeMirror gutter|line numbers aligned"`
  - `pnpm --filter @sqlfu/ui typecheck`
  - `pnpm --filter @sqlfu/ui build`
