status: in-progress
size: large

# Landing Demo Maintainability

## Status

Worktree branch created for the follow-up pass. The current landing-page demos work, but they are hand-authored in Astro with manual syntax-token spans and small custom animation conventions. This pass should move demo content into source-like markdown fixtures, compile syntax-highlighted markup at build time, and preserve the existing client-side animation behavior where possible.

## Scope

- Keep the landing page focused on the existing four beats: schema + migration, type generation, runtime adapters, and Batteries.
- Improve maintainability without changing the product story unless the implementation exposes a product mismatch.
- Prefer source snippets that look like normal TypeScript/SQL in the repo, then compile/render them into highlighted landing markup.
- Store demo source under `website/src/landing-demos/`, with one markdown file per beat: `draft.md`, `generate.md`, `runtime.md`, and `batteries.md`.
- Treat each fenced code block as one renderable artifact. The nearest heading above the fence is the artifact figcaption.
- Use fence info-string annotations for block-level animation metadata such as `speed=command`, `run-command`, `pause=1450`, and `dismiss-before-next`.
- Use inline `{...}` annotations at the end of lines for line-level behavior such as `reveal-pause`, `diff-add`, `hide-typing-whitespace`, and `pop-after-typing`.
- It is acceptable that inline annotations make fixtures awkward to run through a SQL formatter; these are display fixtures, not production SQL.
- Keep highlighter and parser code server-side/build-time only. `index.astro` should call a helper such as `renderDemo(beat, artifact)` from frontmatter so no Shiki or unified code ships to the client.
- Preserve the existing animation IIFE contract as much as possible by generating equivalent classes and `data-*` attributes from the markdown source.

## Checklist

- [ ] Create `website/src/landing-demos/README.md` documenting every fence-level and line-level annotation directive.
- [ ] Create markdown demo fixtures for `draft`, `generate`, `runtime`, and `batteries`, with headings as artifact captions and fenced blocks as artifacts.
- [ ] Add a build-time renderer that parses the demo markdown with `remark`/`unified`, passes supported language fences through Shiki, strips inline annotations, and converts annotation metadata into the existing landing DOM classes and `data-*` attributes.
- [ ] Map Shiki token output to the existing `tok-*` class names so `website/src/styles/landing.css` does not need a broad syntax-theme rewrite.
- [ ] Treat terminal transcripts as custom fence languages such as `term` or `term-output`, not as real Shiki grammars.
- [ ] Handle SQL quirks explicitly, especially `:limit` not being a parameter token in Shiki's SQL grammar.
- [ ] Replace hand-pre-tokenized Astro snippets in `website/src/pages/index.astro` with calls to the build-time renderer.
- [ ] Animate the Batteries section. Use the same scroll-into-view/replay principles as the first three beats, but avoid making every feature pane auto-run at once.
- [ ] Improve the fake trace rendering. Make it look more like a real trace viewer while staying intentionally simplified and vendor-neutral.
- [ ] Re-add an Outbox demo to Batteries once the product surface is stable enough to advertise without caveats.
- [ ] Add explicit maintenance hints for future agents. Capture which product facts each demo depends on, where those facts live in the code/docs, and what should be checked before changing landing copy or terminal output.

## Notes

- The current Batteries section intentionally shows simplified demos, not full production recipes.
- The landing page now advertises `sqlfu format`, runtime adapter names, CLI output, generated file names, and the hosted UI URL. Those facts are likely to drift as the product matures.
- A good implementation shape may be a small `website/src/landing-demos/` source folder with plain `.ts` / `.sql` fixtures plus a build-time renderer that emits highlighted markup and maybe metadata for animation timing.
