status: ready
size: medium

# Landing Demo Maintainability

## Status

Ready for a future pass. The current landing-page demos are effective enough for this PR, but they are hand-authored in Astro with manual syntax-token spans and small custom animation conventions. The next pass should make the demos easier to update when product behavior, command output, generated files, or adapter names change.

## Scope

- Keep the landing page focused on the existing four beats: schema + migration, type generation, runtime adapters, and Batteries.
- Improve maintainability without changing the product story unless the implementation exposes a product mismatch.
- Prefer source snippets that look like normal TypeScript/SQL in the repo, then compile/render them into highlighted landing markup.

## Checklist

- [ ] Animate the Batteries section. Use the same scroll-into-view/replay principles as the first three beats, but avoid making every feature pane auto-run at once.
- [ ] Improve the fake trace rendering. Make it look more like a real trace viewer while staying intentionally simplified and vendor-neutral.
- [ ] Generate syntax-highlighted code from normal source snippets instead of hand-pre-tokenized Astro spans. Evaluate Shiki or a similar highlighter that can run at build time.
- [ ] Re-add an Outbox demo to Batteries once the product surface is stable enough to advertise without caveats.
- [ ] Add explicit maintenance hints for future agents. Capture which product facts each demo depends on, where those facts live in the code/docs, and what should be checked before changing landing copy or terminal output.

## Notes

- The current Batteries section intentionally shows simplified demos, not full production recipes.
- The landing page now advertises `sqlfu format`, runtime adapter names, CLI output, generated file names, and the hosted UI URL. Those facts are likely to drift as the product matures.
- A good implementation shape may be a small `website/src/landing-demos/` source folder with plain `.ts` / `.sql` fixtures plus a build-time renderer that emits highlighted markup and maybe metadata for animation timing.
