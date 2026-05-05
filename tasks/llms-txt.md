status: ready
size: small

Status: spec only. Worktree and branch are ready, and the first implementation step is to add an agent-oriented `https://sqlfu.dev/llms.txt` that mirrors the current docs information architecture without becoming a human-facing docs duplicate.

# Add sqlfu.dev/llms.txt

## Scope

Add an `llms.txt` file to the website root so agents can quickly discover the sqlfu docs, pick the right page for a task, and understand the intended order of reading.

Use the llms.txt spec shape:

- H1 with the project name.
- Blockquote with a concise project summary.
- Short non-heading notes that explain how an agent should interpret the file.
- H2 sections containing markdown link lists with one-line notes.
- An `Optional` H2 for lower-priority context that can be skipped when context is tight.

Use Alchemy v2 as structural inspiration, not as copy:

- Start with a "what this is" summary and the shortest onboarding path.
- Group links by task type: start here, concepts, features/guides, reference, examples, and optional context.
- Give every link a one-hop summary so an agent does not need to crawl the whole site before choosing a page.
- Avoid the stale-index trap: make the sqlfu file follow the source docs/sidebar list, not a manually forgotten subset.

## Assumptions

- The website is an Astro/Starlight site and `website/public/llms.txt` is the likely simplest way to publish `/llms.txt`.
- The `website/scripts/sync-docs.mjs` docs list is the best source of truth for doc titles, source files, slugs, and descriptions.
- The file should be written for coding agents using sqlfu in projects, not for SEO or crawler policy.
- Small nearby docs updates are in scope if they prevent the main site from contradicting the new agent index.

## Checklist

- [ ] Add `website/public/llms.txt` with spec-compliant Markdown. _pending_
- [ ] Cover the current sqlfu docs and generated examples at approximately the same information level as the docs sidebar. _pending_
- [ ] Include a short agent bootstrap prompt or pointer, inspired by Alchemy's README prompt, if there is a natural docs surface for it. _pending_
- [ ] Update nearby docs if the llms.txt work reveals stale wording, missing links, or wrong guidance. _pending_
- [ ] Verify `pnpm --filter sqlfu-website build` produces `dist/llms.txt`. _pending_
- [ ] Push the branch, open/update the PR, and move this task to `tasks/complete/` once the implementation is done. _pending_

## Implementation notes

- External references read for the spec:
  - `https://llmstxt.org/`
  - `https://v2.alchemy.run/llms.txt`
  - `https://v2.alchemy.run/`
  - `https://github.com/alchemy-run/alchemy-effect#bootstrap-with-an-ai-coding-agent`
- Alchemy's current `llms.txt` is useful as an agent-facing index, but the live docs sidebar has pages missing from that file. Keep sqlfu's file aligned with the current source docs list.
