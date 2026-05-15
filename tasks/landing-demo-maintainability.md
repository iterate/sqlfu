status: in-progress
size: large

# Landing Demo Maintainability

## Status

Implementation is mostly done. Demo snippets now live in markdown fixtures, a build-time renderer parses annotations and uses Shiki for SQL/TypeScript, terminal transcripts are rendered by a small custom path, and `index.astro` consumes compiled demo artifacts instead of hand-tokenized spans. Batteries now participates in the existing scroll/replay animation flow for the active feature panel. Remaining work: fake trace rendering still needs a real design pass, and Outbox remains intentionally deferred until the product surface is stable enough to advertise.

## 2026-05-15 Fake Trace Pass

Status summary: this branch is scoped to finishing the fake trace rendering item. The first step is this specification commit; implementation is still missing. Outbox remains explicitly deferred.

Assumptions:

- The fake trace should stay a vendor-neutral illustrative UI, not an OpenTelemetry, Honeycomb, Jaeger, Datadog, or Sentry clone.
- The landing page story should remain the same: sqlfu query identity makes runtime behavior inspectable without burying SQL in application code.
- The fixture system should remain intact; update the fake-trace markup/styling in place unless the existing structure blocks a credible design pass.
- Verification should include a production build and desktop/mobile-ish visual checks for overlap or unreadable trace content.

Fake-trace checklist:

- [ ] Find the current fake-trace markup and CSS surface.
- [ ] Redesign the fake trace as a compact trace-viewer panel with realistic hierarchy, timing, tags, and query/file identity cues.
- [ ] Keep the rendering intentionally simplified and vendor-neutral.
- [ ] Verify the landing page build still succeeds.
- [ ] Capture or save visual verification for desktop and mobile-ish widths, and note the screenshot path in the PR.

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

- [x] Create `website/src/landing-demos/README.md` documenting every fence-level and line-level annotation directive. _added alongside the fixture files; includes product-fact maintenance breadcrumbs and the `:limit` Shiki caveat_
- [x] Create markdown demo fixtures for `draft`, `generate`, `runtime`, and `batteries`, with headings as artifact captions and fenced blocks as artifacts. _added `draft.md`, `generate.md`, `runtime.md`, and `batteries.md` under `website/src/landing-demos/`_
- [x] Add a build-time renderer that parses the demo markdown with `remark`/`unified`, passes supported language fences through Shiki, strips inline annotations, and converts annotation metadata into the existing landing DOM classes and `data-*` attributes. _implemented in `website/src/landing-demos/render.ts`; uses Vite raw markdown imports so it works after Astro bundles the page_
- [x] Map Shiki token output to the existing `tok-*` class names so `website/src/styles/landing.css` does not need a broad syntax-theme rewrite. _renderer maps Shiki scopes to `tok-keyword`, `tok-name`, `tok-string`, `tok-number`, `tok-comment`, `tok-param`, and `tok-prop`; no syntax-theme CSS rewrite needed_
- [x] Treat terminal transcripts as custom fence languages such as `term` or `term-output`, not as real Shiki grammars. _`term` fences render through a custom terminal transcript renderer with prompt, command, and output grouping support_
- [x] Handle SQL quirks explicitly, especially `:limit` not being a parameter token in Shiki's SQL grammar. _renderer masks `:name` parameters before Shiki tokenization and restores them as `tok-param` spans_
- [x] Replace hand-pre-tokenized Astro snippets in `website/src/pages/index.astro` with calls to the build-time renderer. _landing page frontmatter calls `renderDemo(...)` and inserts compiled artifacts via `set:html`_
- [x] Animate the Batteries section. Use the same scroll-into-view/replay principles as the first three beats, but avoid making every feature pane auto-run at once. _Batteries now has `data-walkthrough-step`; the IIFE filters typing targets to the active feature panel and reveals only outputs before the next command_
- [ ] Improve the fake trace rendering. Make it look more like a real trace viewer while staying intentionally simplified and vendor-neutral.
- [ ] Re-add an Outbox demo to Batteries once the product surface is stable enough to advertise without caveats.
- [x] Add explicit maintenance hints for future agents. Capture which product facts each demo depends on, where those facts live in the code/docs, and what should be checked before changing landing copy or terminal output. _documented in `website/src/landing-demos/README.md`_

## Notes

- The current Batteries section intentionally shows simplified demos, not full production recipes.
- The landing page now advertises `sqlfu format`, runtime adapter names, CLI output, generated file names, and the hosted UI URL. Those facts are likely to drift as the product matures.
- A good implementation shape may be a small `website/src/landing-demos/` source folder with plain `.ts` / `.sql` fixtures plus a build-time renderer that emits highlighted markup and maybe metadata for animation timing.
