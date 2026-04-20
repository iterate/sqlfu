# sqlfu website animations

Remotion 4.x compositions for the landing page value-panel cards.

Compositions:

- `anim-1-schema` — schema refactor in `definitions.sql`
- `anim-2-generate` — `.sql` query to generated `.sql.ts` with typed autocomplete
- `anim-3-draft` — edit schema, `sqlfu draft`, new migration file lands

Alternatives (for A/B testing via `?animation_alternative=<letter>`):

- `alt-a-*` — single-card showreel (all three beats in one panel)
- `alt-b-*` — terminal-first: everything happens through the CLI transcript
- `alt-c-*` — diff-centric: the animation is literally the diff between two files
- `alt-d-*` — playful: heavy spring animations, bouncy, emoji-adjacent energy

## Commands

```sh
# Live-edit compositions
pnpm studio

# Render every composition to website/public/assets/animations/
pnpm render
```

Rendered outputs land in `website/public/assets/animations/<name>.webm`,
`<name>.mp4`, `<name>.poster.jpg`. Astro serves `public/` at the site root,
so the landing page loads them from `/assets/animations/` at build time.

## Fixtures

The SQL fixtures in `src/fixtures.ts` were produced by running
`sqlfu generate` and `sqlfu draft` against a tiny users/posts project.
If the generator output format changes, regenerate the fixtures:

```sh
# One-shot fixture regen (does NOT run in CI — only touch when the
# sqlfu generator output changes)
tsx scripts/regenerate-fixtures.ts
```

See the script for the exact schema and query it runs.
