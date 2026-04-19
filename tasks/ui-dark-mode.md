status: in-progress
size: medium

# UI dark mode

## Executive summary

Staring at the in-browser sqlfu UI at night hurts the user's eyes. Today `packages/ui/src/styles.css`
defines a single warm beige/orange light palette via `:root` CSS variables (`--bg`, `--panel`,
`--text`, `--accent`, etc.), and the only thing currently "dark" is the embedded CodeMirror editor
(which hardcodes `theme="dark"` from `@uiw/react-codemirror` — a pre-existing light/dark mismatch).

This task adds a real dark mode: a warm-dark variant of the existing aesthetic, user-toggleable via
a small control in the sidebar, preference persisted with `use-local-storage-state`, respecting
`prefers-color-scheme` on first load, and propagated into CodeMirror via `theme` prop and into
react-hot-toast via the `Toaster` theme.

Scope: palette variables + dark-aware overrides in `styles.css`; theme toggle component; plumb
theme into `SqlCodeMirror` / `TextCodeMirror` / `TextDiffCodeMirror`; reactgrid + rjsf form inputs
audited so nothing is white-on-white or black-on-black; toasts themed.

Out of scope: website/landing-page dark mode (separate surface), redesign of the light palette.

## Design decisions

### Palette

Light palette unchanged (same values currently in `:root`).

Dark palette — warm dark, not VS Code dark:
- `--bg`: `#1a1410` (deep warm near-black, 6% lightness, warm brown hue)
- `--bg-strong`: `#211912` (slightly stronger surface)
- `--panel`: `rgba(42, 31, 22, 0.92)` (warm translucent panel)
- `--panel-strong`: `#2a1f16`
- `--line`: `rgba(240, 224, 196, 0.12)` (faint warm-beige lines)
- `--text`: `#f0e6d6` (warm off-white — contrast ratio > 11:1 vs `--bg`)
- `--muted`: `#b8a484` (muted warm tan — still ~5.5:1 on `--bg`)
- `--accent`: `#e89b66` (lighter orange so it glows on dark)
- `--accent-strong`: `#f4b382` (hover / emphasis)
- `--shadow`: `0 18px 40px rgba(0, 0, 0, 0.45)` (deeper shadows for dark surface)

Background gradient in dark mode swaps to a warm-dark gradient using the above values.

Other hard-coded colors found in `styles.css` that need dark variants:
- `.code-block.error` (currently light-pink background, dark-red text) — dark equivalent: dark-red
  bg with warm-pink text.
- `.schema-card.ok` (light green) — dark equivalent: dark green-tinted surface, warm-green border.
- `.schema-card.info` (light blue) — dark equivalent: dark blue-tinted surface.
- `.schema-card.recommendations` (light yellow) — dark equivalent: dark amber surface.
- `.reactgrid` header/cell tints — need dark surface + border recolors.

### Toggle UX

Small `button.icon-button` in the sidebar header area (sidebar is where `sqlfu/ui` title lives).
A sun/moon glyph (`☼` / `☾`) with `aria-label="Toggle theme"`. Clicking cycles light ↔ dark.

Persistence: `use-local-storage-state` with key `sqlfu-ui/theme`, value `'light' | 'dark' | 'system'`.

First load behavior:
- Default value is `'system'`.
- If `'system'`, read `window.matchMedia('(prefers-color-scheme: dark)').matches` and apply.
- If the user toggles explicitly, we set `'light'` or `'dark'` and ignore system.

Applied by setting `data-theme="dark"` (or `"light"`) on the `<html>` root. CSS keys off
`:root[data-theme='dark']` and falls back to a `@media (prefers-color-scheme: dark)` block for the
`'system'` case.

Because the user said *no useState/useEffect*, the theme hook reads from localStorage; the CSS
handles the system case via a media query (no JS subscription to `matchMedia` needed). We only
toggle `data-theme` on `<html>` in direct response to button clicks — no effect/subscription
needed. When the stored value is `'system'`, we remove the attribute and let the media query win.

### CodeMirror

The three CodeMirror wrappers in `sql-codemirror.tsx` all hardcode `theme="dark"`. Switch to read
current theme from the shared helper and pass `'light'` or `'dark'` accordingly. Built-in light /
dark themes from `@uiw/react-codemirror` are fine; they're not custom-painted for the sqlfu palette
but they're readable and consistent with what we have in dark mode. (A custom warm-dark CodeMirror
theme is a nice-to-have; not in scope for this task.)

### Third-party components

- `@silevis/reactgrid`: we already vendor the minimal rules in `styles.css` (the `.rg-*` selectors).
  Dark-mode variants added alongside.
- `@rjsf/core`: renders semantic form controls, which we already style via `form input`, `form select`,
  `form textarea`. Those selectors pick up `--line` / `--panel-strong` / `--text` so they work
  automatically once the vars are dark-aware.
- `react-hot-toast`: pass a `toastOptions.style` / `toastOptions.iconTheme` built from CSS vars so
  toasts live in the dark palette. Simplest: toasts already use `.app-toast` class + `--panel-strong` /
  `--text`, so this comes along for free.
- Radix Dialog (`.shad-dialog-*`): same — uses CSS vars, comes along automatically.

## Checklist

- [ ] Palette: add dark palette variables in `styles.css`, keyed off `:root[data-theme='dark']` and
      `@media (prefers-color-scheme: dark) :root:not([data-theme='light'])`.
- [ ] Dark-mode overrides for error/ok/info/recommendations semantic cards.
- [ ] Dark-mode overrides for `.reactgrid` header + cell tints + dirty cell highlight.
- [ ] Dark-mode override for `.code-block.error`.
- [ ] Dark-mode override for background `linear-gradient` on body.
- [ ] Theme toggle button in sidebar (`☼`/`☾` + aria-label).
- [ ] Theme state: `use-local-storage-state` with key `sqlfu-ui/theme`, cycles `system → dark → light → system`.
      Apply by setting `data-theme` on `document.documentElement` (no useEffect — call directly
      from the click handler + a one-time init module-level call on load).
- [ ] `sql-codemirror.tsx`: pipe theme into all three CodeMirror wrappers.
- [ ] `toaster.tsx`: verify dark toasts look right (should come for free via CSS vars).
- [ ] `pnpm --filter sqlfu-ui typecheck` passes.
- [ ] `pnpm --filter sqlfu-ui test:node` passes.
- [ ] `pnpm --filter sqlfu-ui build` passes.
- [ ] Open PR, verify CI green.

## Implementation log
