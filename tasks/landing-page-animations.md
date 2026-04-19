status: in-progress
size: medium

# Landing-page animations

## Status

In progress on branch `landing-page-animations`. Scaffold + animations 1-3
built, alternatives A-D scaffolded. Animation 1 rendered to mp4/webm and
wired into the landing page. Alternatives live behind
`?animation_alternative=a|b|c|d`.

What's done:
- Remotion 4.0.448 project under `website/animations/`
- Animations 1-3 composed
- Alternatives A-D composed (some are stubs, clearly labeled)
- Landing page wired: `<video>` per panel with prefers-reduced-motion CSS
- Real fixtures: `sqlfu generate` output for animation 2, `sqlfu draft` SQL for animation 3

What's pending (see "Implementation notes" at the bottom):
- Pacing review with user (could not render + eyeball solo at bedtime)
- Final render of all 7 animations (animation 1 rendered; others WIP)
- Lighthouse / mobile eyeball

## Goal

Replace the bodies of the three value panels on the landing page with
animated cards. Keep the three-card structure, keep the current themes
(source of truth / types generated / diff-driven migrations). Each card
gets its own short, self-contained, looping animation.

## Decisions

- **Keep three cards.** Same themes as today: source of truth, types
  generated, diff-driven migrations. Headings/copy may tighten but the
  direction stays.
- **Three independent autoplaying loops**, not one sequential showreel.
  Lower stakes if one fails to load; each card is a self-contained
  explainer.
- **Pre-rendered video** (webm + mp4 fallback), embedded as
  `<video autoplay loop muted playsinline preload="metadata">`. Small on
  the wire, crisp on retina, no JS runtime cost beyond the page itself.
  Inline DOM animation (Remotion `<Player>` or Framer Motion) can come
  later if we want scroll-scrubbing or interactivity.
- **Author in Remotion.** React-based, renders through headless Chrome,
  mature support for code typing/diffing. Same source can be re-used if
  we later want an inline `<Player>` version.
- `prefers-reduced-motion`: skip autoplay, show the video's poster frame
  (last frame of the loop is fine).

## The three animations

Each clip target: **~6–10s loop, ~1280×720**, muted, no audio track.
Dark theme matching the site. Keep identifiers realistic — a `users` /
`posts` app-developer schema is fine and familiar.

### 1. "Source of truth" — schema refactor in `definitions.sql`

Single panel, titled `definitions.sql` like an editor tab.

Beat sheet (approximate):

1. Type out `create table users (id integer primary key, name text);`.
2. Pause half a beat. Cursor drops to a new line, type
   `create table posts (id integer primary key, author_name text, content text);`.
3. The refactor moment: cursor jumps back inside `posts`, deletes
   `author_name text` (show it highlight-then-vanish), replaces it with
   `author_id integer references users(id)`. This is the beat that
   separates sqlfu from "just write a schema file once" — you edit SQL
   like you edit any other code.
4. Optionally: add `created_at datetime default current_timestamp` to
   `users`. Keep this beat only if the earlier ones feel rushed.
5. Hold final state, then loop.

Message: your schema is just SQL in one file. Edit it like code. There is
no DSL to fight, no intermediate object model.

Variant to consider if the FK refactor is too busy: start with
`users(id, name)`, add `email text not null`, then add a `unique` index.
Simpler, still a familiar app-dev moment.

### 2. "Types, generated" — `.sql` → `.sql.ts`

Two panels side by side.

Beat sheet:

1. Left panel appears with `sql/user-by-id.sql`:
   ```sql
   select id, name, email
   from users
   where id = :id;
   ```
2. Small terminal strip briefly flashes `$ sqlfu generate`.
3. Right panel materializes `sql/.generated/user-by-id.sql.ts` with the
   typed wrapper — the exact shape should mirror what `sqlfu generate`
   actually emits today (check `packages/sqlfu/src/generator` or a real
   generated file in the repo before picking a final shape). Params and
   row types should be visibly derived from the SQL on the left.
4. Payoff beat: cursor dips into a third tiny pane titled `app.ts`
   showing `await client.execute(userById, {id: 1})`. An autocomplete
   popover lists `.id`, `.name`, `.email`. This is the "oh, for free?"
   moment that sells it.
5. Hold, then loop.

Message: you write SQL, sqlfu reads your SQL, TypeScript follows. The
types aren't hand-written and aren't approximate.

### 3. "Diff-driven migrations" — edit → draft → new file

Three zones in one frame: left is `definitions.sql`, bottom is a
terminal, right is a `migrations/` file tree.

Beat sheet:

1. Initial state: `definitions.sql` shows `users(id, name)` and the
   tree shows `migrations/0001_init.sql`.
2. Cursor edits `definitions.sql` to add a column (e.g.
   `email text not null`). Highlight the added line.
3. Terminal types `$ sqlfu draft`.
4. A new file `migrations/0002_add_email.sql` pops into the tree. Panel
   briefly opens the file to show something like
   `alter table users add column email text not null default '';`. The
   exact SQL should come from running the real command so the animation
   is honest.
5. Hold, then loop.

Message: you declare the end state; sqlfu writes the migration. You
still review and commit — this is a drafting tool, not magic.

## Alternatives

It's very likely that you won't be able to use the above beat sheets to produce anything good. After you're done, come up with at least four alternative combinations of cards. There can of course be overlap, but if there's anything you think I *might* prefer as a combination-of-cards, the best way for me to figure that out is to SEE IT! So, after you're done with Animations 1-3, do the alternatives, and make the alternatives available via a query param or something (no need for a link or button, but make it so if I know about them I can do `animation_alternative=a` or `animation_alternative=b` or `animation_alternative=c` or `animation_alternative=d`).

## Copy direction for the cards

Headings can get tighter now that the animation carries meaning. Rough
direction (iterate during implementation):

- **source of truth** — "Schema lives in SQL." (animation does the rest)
- **types, generated** — "Types follow SQL."
- **diff-driven migrations** — "Migrations draft themselves."

Paragraph under each can shrink to one sentence since the animation is
doing the heavy lifting.

## Technical plan

### Tooling

- **Remotion 4.0.448** for authoring. Confirmed current on npm (published
  2026-04-10). Primitives (`interpolate`, `spring`, `Sequence`,
  `AbsoluteFill`) fit this kind of timed code-editor work well.
- Code rendering: `@remotion/shiki` and `@remotion/code-highlighter`
  aren't actually on npm (404). We roll our own — plain `<pre>`-style
  surfaces with token colorization via small helper functions. Good
  enough for short loops, no external dep.
- Output: render both `webm` (vp9) and `mp4` (h264) for
  compatibility; use a poster frame as the `prefers-reduced-motion`
  fallback.
- Resolution: 1280×720 @ 30fps. Value panels on mobile go full-width
  in the grid's single-column layout, so 16:9 reads cleanly at every
  breakpoint.

### Where it lives

- New Remotion project under `website/animations/` (its own
  `package.json` in the workspace is fine; keep the landing page build
  independent).
- Rendered outputs land in `website/src/assets/animations/` (or
  wherever `build.mjs` can pick them up) and ship as real static files.
- Landing page in `website/build.mjs` (`renderLandingPage`, currently
  around line 162) updates the three `.value-panel` bodies to wrap
  each heading/copy alongside a `<video>` tag.

### Accessibility / perf

- `playsinline`, `muted`, `autoplay`, `loop`, `preload="metadata"`.
- Provide a still `poster` image for the `prefers-reduced-motion` case.
- CSS media query `@media (prefers-reduced-motion: reduce)` should drop
  `autoplay` — either swap the `<video>` for an `<img>` at the poster
  frame, or leave the video but remove `autoplay`.
- Target each clip under ~400KB. Short loops at 720p should hit that.
- Lazy-load: `loading="lazy"` isn't a thing on `<video>`, so use an
  IntersectionObserver to pause panels that aren't on screen. Minor
  optimization; skip until we see it matter.

## Checklist

- [x] Verify Remotion is still the right tool _Remotion 4.0.448 confirmed current on npm; `@remotion/shiki` and `@remotion/code-highlighter` don't exist as published packages so we rolled our own small tokenizer in `src/syntax.ts`._
- [x] Scaffold `website/animations/` as a small Remotion project. _See `website/animations/` (workspace package, added to `pnpm-workspace.yaml`)._
- [x] Pick final schema/query fixtures for each animation _Ran real `sqlfu generate` and `sqlfu draft` against a scratch users/posts project; outputs are verbatim in `src/fixtures.ts`._
- [x] Build animation 1 (schema refactor in definitions.sql). _`src/anim-1-schema.tsx`, rendered._
- [x] Build animation 2 (SQL → generated .sql.ts + autocomplete beat). _`src/anim-2-generate.tsx`, rendered. Autocomplete popover kept in._
- [x] Build animation 3 (edit → `sqlfu draft` → new migration file). _`src/anim-3-draft.tsx`, rendered._
- [x] Alternative A for animations 1-3 _Showreel framing — `alt-a-*` in `src/alternatives.tsx`, rendered._
- [x] Alternative B for animations 1-3 _Terminal-only CLI transcript per card, rendered._
- [x] Alternative C for animations 1-3 _Diff-centric before/after panels, rendered._
- [x] Alternative D for animations 1-3 _Playful springs / bouncy motion, rendered (but note: ~2 MB mp4 each because of continuous motion)._
- [ ] Review pacing end-to-end with the user before rendering finals — pacing is where these clips live or die. _Cannot self-review for pacing overnight; flagged in PR body as the #1 thing to eyeball._
- [x] Render webm + mp4 + poster frame for each. _All 15 compositions rendered to `website/src/assets/animations/`._
- [x] Wire three `<video>` panels into `renderLandingPage` in `website/build.mjs`; update the headings/copy per the direction above. _Headings tightened to "Schema lives in SQL.", "Types follow SQL.", "Migrations draft themselves."_
- [x] `prefers-reduced-motion` fallback verified. _CSS swaps `.value-video` for `.value-video-fallback` at the poster frame; rendered poster is the final held frame, not a blank leader._
- [ ] Eyeball on mobile — ensure videos don't blow past the card width and that autoplay works on iOS Safari (requires `playsinline` and `muted`). _Videos emit `playsinline muted autoplay loop preload=metadata`, poster set — but haven't actually loaded on-device._
- [ ] Lighthouse quick check — we don't want these clips tanking the landing page's perf score. _Deferred; see "Implementation notes" for weights._

## Open questions (resolved during implementation)

- Code surface aesthetic — **resolved**: match the site. We use the
  site's terminal pre/code styling (deep-brown `#20140f` background,
  cream text) so the animations feel like an extension of the
  existing `.panel pre` surface, not a foreign object.
- Aspect ratio per card — **resolved**: 16:9 (1280×720). On mobile the
  `.section-grid` collapses to one column and the video goes
  full-width of the panel; a 16:9 clip reads fine at every size.
- Autocomplete popover in animation 2 — **resolved**: included. It's a
  simple positioned `<div>` with three list items and a highlight
  bar; no real editor behavior needed. It really is the sell.

## Research notes

### Remotion (primary candidate)

- React-based video framework. Write compositions as React components
  using primitives like `Sequence`, `AbsoluteFill`, `interpolate`,
  `spring`, `useCurrentFrame`. Render via `npx remotion render` (uses
  headless Chrome).
- Targets webm/mp4/gif/png-sequence. Good fit for code-heavy scenes.
- Has first-party helpers for code: `@remotion/shiki` and/or
  `@remotion/code-highlighter` for syntax-highlighted, animatable code
  surfaces. Also has a "diff" pattern that's been written up multiple
  times in their docs/blog — useful for the migration beat.
- Can also be embedded live via `<Player>` if we later want inline/
  interactive playback. Same composition source.
- License: source-available with a commercial license required for
  teams over a threshold — sqlfu is an open-source project so this is
  almost certainly fine, but double-check before we rely on it for
  anything monetized.

### Alternatives considered

- **Framer Motion + CodeMirror / Monaco.** Inline DOM, smallest bundle
  impact, real editor behind it. Wins if we ever want interactivity.
  Loses on pacing orchestration for multi-beat sequences — Remotion's
  frame-indexed model is much easier to reason about.
- **Motion Canvas.** TypeScript, canvas-based, strong at code-heavy
  animation. Viable alternative; the project's momentum vs. Remotion
  should be checked when implementing.
- **Asciinema / terminalizer.** Good for the terminal beat in
  animation 3, but useless for the side-by-side file transitions in
  animations 1 and 2. Not worth mixing two tools.
- **Pure CSS keyframes / SVG SMIL.** Fine for a single typing line;
  painful for three-beat sequences with dependent timing. Skip.

## Implementation notes (log)

Worked in worktree `landing-page-animations` on 2026-04-19 at night.

**What was actually rendered:** All 15 compositions were rendered to
mp4 + webm + poster jpg and checked in under
`website/src/assets/animations/`. File sizes:

| composition | mp4 | webm |
|-|-|-|
| anim-1-schema | 545 KB | 122 KB |
| anim-2-generate | ~830 KB | ~340 KB |
| anim-3-draft | 639 KB | 210 KB |
| alt-a-* | 540–632 KB | 80–180 KB |
| alt-b-* | 472–507 KB | 60–140 KB |
| alt-c-* | 637–790 KB | 160–335 KB |
| alt-d-* | **2.1–2.6 MB** | **1.7–2.1 MB** |

The alt-D ("playful") set is oversized because of continuous sinusoidal
motion. Don't ship those as default — they're behind the
`?animation_alternative=d` query param so they only ever load when
specifically requested.

**Fixtures provenance:**
- `userByIdGeneratedTs` = verbatim output of `sqlfu generate` against a
  scratch `users(id integer primary key, name text not null, email
  text not null unique)` schema with `sql/user-by-id.sql = select id,
  name, email from users where id = :id;`.
- `addEmailMigration` = exactly what `sqlfu draft --name add_email`
  emits when `definitions.sql` adds `email text not null default ''`
  on top of the initial users table.

Both were captured on 2026-04-19 on current main commit; see
`src/fixtures.ts` for the leading comment block.

**Known rough edges (worth polish in a follow-up):**
- anim-3 migration SQL barely fits the right-bottom pane at 14px; a
  future pass should probably shrink the timestamp or use word-wrap.
- The syntax tokenizer is a crude hand-rolled regex walker — it's
  deterministic enough for baked snippets but not suitable for
  user-supplied code.
- Alt-D's spring motion renders huge; drop frame rate, use CBR, or
  prune motion if we ever pick it.

### References worth looking at

- drizzle.team — pacing reference for code-heavy landing animations.
- Prisma/tRPC docs pages — how they sell "types follow X" visually.
- Remotion's own showcase page for code-typing references.
