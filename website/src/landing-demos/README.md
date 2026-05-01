# Landing Demos

These markdown files are build-time fixtures for the landing page walkthrough. `index.astro` renders them through `renderDemo(beat, artifact)`, so Shiki, unified, and annotation parsing stay out of the browser bundle.

## File Layout

- `draft.md`: schema edit and `sqlfu draft`.
- `generate.md`: query file, `sqlfu generate`, and generated usage.
- `runtime.md`: app code plus driver adapter examples.
- `batteries.md`: the Batteries showcase panels.

Each fenced block is one artifact. The heading immediately above the block becomes its figcaption. The fence info string must include `artifact=<key>` so Astro can request the block by a stable name.

## Fence Directives

- `artifact=<key>`: stable lookup key used by `renderDemo`.
- `speed=<name>`: wraps the block in `data-type-speed="<name>"` unless line-level regions need to split the block.

Supported speeds currently match the landing animation script: `command`, `medium`, `fast`, `generated-file`, and `schema-add`.

Terminal transcripts use the custom `term` fence language. They are rendered by sqlfu's fixture renderer, not by Shiki.

## Line Directives

Line-level directives live in `{...}` at the end of a line. They are stripped before highlighting.

- `speed=<name>`: add `data-type-speed` to that line.
- `run-command`: mark a command line as the trigger for terminal output reveal.
- `terminal-output=<group>`: group consecutive terminal lines into one `data-terminal-output` block.
- `output-pause=<ms>`: pause after revealing a terminal output group.
- `diff-add`: render the line as a green diff addition.
- `reveal-line`: reveal the line before typing it.
- `reveal-pause=<ms>`: reveal the line and pause before typing it.
- `hide-typing-whitespace`: hide whitespace while typing this line.
- `pop-after-typing`: reveal the line in one shot after all typed regions finish.
- `pop-pause=<ms>`: pause after a `pop-after-typing` line is revealed.
- `dismiss-before-next`: hide this line before the next terminal output group is revealed.
- `corner-before-next`: hide this rounded-border line before the next terminal output group.
- `corner-after-next`: show this rounded-border line when the next terminal output group is revealed.
- `generated-type-hint`: add the legacy helper class for a generated type hint.

Inline annotations are more expressive than keeping the snippets formatter-clean. That is acceptable here because these are display fixtures, not source files that should be run through `sqlfu format`.

## Maintenance Notes

Before changing a demo, check the product fact it advertises:

- CLI output: `packages/sqlfu/src/node/cli-router.ts` and the relevant CLI tests.
- Generated wrapper paths and type shapes: `packages/sqlfu/src/typegen/` and generated fixture tests.
- Runtime adapter names: `packages/sqlfu/src/client/` and `/docs/adapters`.
- Admin UI URL and screenshot: landing copy plus `website/public/assets/landing/sqlfu-ui-crop.png`.
- Formatter, lint, tracing, skills, and Outbox claims: the matching docs pages under `packages/sqlfu/docs/`.

The SQL grammar in Shiki does not treat `:limit` as a parameter. The renderer masks `:name` parameters before Shiki tokenization and restores them as `tok-param`.
