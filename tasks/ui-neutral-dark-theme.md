---
status: specified
size: medium
---

# Neutral dark theme for sqlfu UI

## Status Summary

Specified only. The UI still needs implementation and verification. The intended change is to move the dark theme away from the current warm brown/orange palette, then fix CodeMirror dark-mode gaps for the gutter and autocomplete popup.

## Goal

The sqlfu UI should feel like a quiet database studio: neutral dark grey / near-black surfaces, thin subdued borders, and a restrained accent. Outerbase and Drizzle Studio are the reference direction: dense, calm operational tooling rather than a saturated brown product shell.

## Assumptions

- Dark mode is the priority because that is the abrasive case called out in the request.
- The light theme can remain mostly intact unless the shared CSS variables require small companion changes.
- The accent should stop reading as orange/brown; a cool blue-green accent is acceptable if used sparingly.
- CodeMirror should use the app theme tokens rather than relying only on CodeMirror's built-in dark theme.
- The clipboard screenshot captured at `/tmp/sqlfu-codemirror-clipboard.png` is the failure reference: white gutter, and autocomplete text/background contrast mismatch.

## Checklist

- [ ] Replace the dark theme's warm brown base colors with neutral near-black / dark grey tokens.
- [ ] Tone down large background treatments so the app reads as a calm tool surface.
- [ ] Restyle related data-grid variables so table headers and append rows fit the new dark theme.
- [ ] Add explicit CodeMirror dark-mode styling for editor surfaces, gutter, active line, cursor, selection, lint gutter, and completion tooltip.
- [ ] Add a regression test that exercises the SQL editor in dark mode and verifies the gutter and autocomplete popup are dark with readable text.
- [ ] Verify the updated UI visually in desktop and narrow/mobile viewports.
- [ ] Open a draft PR early, then keep pushing implementation commits to the worktree branch.

## Implementation Notes

- Worktree: `../worktrees/sqlfu/ui-neutral-dark-studio`
- Branch: `ui/neutral-dark-studio`
