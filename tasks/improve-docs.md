status: evergreen

Go through all of the docs and improve them. Look for inconsistencies, information being in the wrong place, and poor writing. Do a search through the whole codebase for em-dashes. Those are a good indicator that the docs are "rough" - that is, they've been written by an agent without thorough review yet. So, provide the first pass of that review. Use the `writing-well` skill.

I want you to think holistically about the docs, as mentioned in your agent instructions for this repo. From time to time that will mean re-thinking docs entirely. Sometimes it will mean creating a separate task in the branch you create for *changing the product* instead. Docs are most useful when not thought of as something entirely downstream from the product code - if there's no clear way to write about a concept, the concept might be poorly thought through. You are free to flag that as an alternative to documenting weirdness.

## 2026-04-30 pass

Status: done for the main pass, with active PR review tweaks still being folded in. Landing-page pacing now walks through schema + migration drafting, type generation, runtime adapter portability, and a compact feature showcase one idea at a time. Follow-up review added syntax-highlighted, replayable typed/run/reveal animation, moved demo boxes under the explanatory copy, made the schema/draft demo reflect real CLI output, and tuned the first two demos to start only when the whole surface is in view. Latest landing tweaks make the schema edit add a nullable `published integer` column, keep the informative draft SQL visible while replacing only the confirmation options with `Wrote ...`, move replay to right-side icon buttons, type in `src/app.ts`, reveal the type hint after the file types, keep the generate terminal output focused on the single query wrapper, split runtime adapters from the feature showcase, and make the Batteries panels cover common CLI commands first, then admin UI, linting, formatting, tracing, and agent skill installation at a fixed height. The tracing snippet now stays focused on sqlfu instrumentation rather than Hono setup. `/docs` now uses Runtime client, SQL migrations, Type generation from SQL, and Admin UI as concepts, with secondary surfaces in Features, Recipes, and Reference. Final messaging pass aligned `generate.authority` wording with the landing page and docs, tightened Admin UI naming, and logged intentional repetition. Website build is green.

Scope:

- Use <https://v2.alchemy.run> only as pacing/navigation inspiration, not as text or design to copy.
- Make the landing page introduce one sqlfu feature at a time with concrete code/artifact pairings instead of compressing every capability into one three-card value grid.
- Reorganize `/docs` sidebar into clearer nested groups for onboarding, concepts, guides, examples, and reference.
- Keep this pass mainly to docs/website information architecture and prose. Broad product behavior changes and broad doc rewrites stay out of scope; the later landing follow-up includes the small CLI reporting changes needed so the demo matches product behavior.

Assumptions:

- The existing Getting Started walkthrough remains the first-run path; this pass should make the surrounding landing/docs navigation point at it more cleanly.
- The Alchemy pattern worth borrowing is structural: a tight start path, feature sections with adjacent artifacts, and docs groups that separate tutorial/concepts/guides/reference.
- `tasks/improve-docs.md` is evergreen, so this pass stays in this file instead of moving the task to `tasks/complete/`.

Checklist:

- [x] Land this 2026-04-30 pass as the first commit and open the PR against `nightly/2026-04-30`. _first commit `02fbb89`; PR #79 targets `nightly/2026-04-30`_
- [x] `website/src/pages/index.astro`: replace the current broad value grid with a sequential feature walkthrough that pairs SQL/code with the generated or operational artifact. _four feature beats now pair prose with schema/migration/query/runtime snippets_
- [x] `website/src/styles/landing.css`: support the new landing layout responsively without adding decorative-only visuals. _added the `feature-stack`, `feature-row`, and `artifact` layout; mobile collapses to one column_
- [x] `website/src/pages/index.astro` + `website/src/styles/landing.css`: apply PR feedback to the landing walkthrough with syntax highlighting, typed commands/files, run-state terminal output, generated-artifact reveals, and a single schema artifact. _follow-up commit after docs PR review; implemented with progressive DOM enhancement instead of Remotion; website build stayed green_
- [x] `website/src/pages/index.astro` + `website/src/styles/landing.css`: apply second landing feedback by slowing animations, replaying steps on scroll/click, moving demo boxes under copy, combining schema and draft, and replacing the typegen terminal with TypeScript after output. _follow-up after review; matches the v2.alchemy.run pacing pattern without copying text/design_
- [x] `website/src/pages/index.astro` + `website/src/styles/landing.css`: tune landing timing after hands-on review. _demo waits until the full demo surface is visible; schema base stays static while only the added column types in; draft prompt clears before `Wrote ...`; typegen uses an auto-switching terminal/src tab view_
- [x] `website/src/pages/index.astro` + `website/src/styles/landing.css`: apply final first-two-section polish before runtime review. _schema edit now reveals an empty highlighted line before typing a realistic `published` column; draft shows the create/confirm prompt in one shot, keeps the generated SQL visible, and swaps only the confirmation options for `Wrote ...`; replay moved from whole-row click/status text to right-side icon buttons so generated output tabs can be clicked_
- [x] `website/src/pages/index.astro`: simplify the schema demo to a nullable `published integer` add and animate the generated TypeScript file. _keeps the migration example in the simple SQLite-safe nullable-column case; `src/app.ts` now types in quickly after focused `sqlfu generate` output that lists only `./.generated/get-posts.sql.ts`, then the inferred type hint pops in_
- [x] `website/src/pages/index.astro` + `website/src/styles/landing.css`: rework the runtime landing section after review. _runtime now shows app code taking the `Client` interface on the left and full-name adapter tabs for node:sqlite, bun:sqlite, better-sqlite3, libsql, sqlite-wasm, Expo SQLite, and Durable Objects on the right; each example creates a sqlfu client as `db` at the boundary, and the tab bar scrolls with a right-edge fade_
- [x] `website/src/pages/index.astro` + `website/src/styles/landing.css`: refine the Batteries showcase. _panels now keep a fixed 358px stage; CLI is first; admin UI prints `sqlfu ready at https://sqlfu.dev/ui` and uses the latest clipboard-cropped UI screenshot from `website/public/assets/landing/sqlfu-ui-crop.png`; tracing shows the existing app route using an instrumented sqlfu client plus a trace rendering; Outbox is replaced by CLI examples; Agent skill drops `@latest`; Formatter demos `npx sqlfu format`_
- [x] `tasks/landing-demo-maintainability.md`: capture follow-up work to make the landing demos easier to maintain. _covers Batteries animation, fake trace quality, build-time syntax highlighting from normal snippets, re-adding Outbox, and maintenance hints for future agents_
- [x] `packages/sqlfu/src/node/cli-router.ts` + `packages/sqlfu/src/node/format-files.ts`: add `sqlfu format <paths...>` for in-place SQL formatting. _accepts file paths or simple glob patterns and reports formatted/already-formatted files; covered by a CLI test_
- [x] `packages/sqlfu/src/api.ts`, `packages/sqlfu/src/typegen/index.ts`, and `packages/sqlfu/src/node/cli-router.ts`: make the landing demo honest by reporting written migration/generated file paths from `sqlfu draft` and `sqlfu generate`. _covered by CLI output and migration prefix tests_
- [x] `website/astro.config.mjs`: nest the docs sidebar into onboarding, concepts, guides, examples, and reference. _sidebar now groups Start here, Concepts, Guides, and Reference_
- [x] `website/scripts/sync-docs.mjs`: keep synced docs metadata aligned with the sidebar, including any reference pages surfaced by the new nav. _added `docs/errors` to the synced docs set and removed em-dash prose from generated examples metadata_
- [x] `website/astro.config.mjs`, `website/scripts/sync-docs.mjs`, and source docs: apply PR feedback to make Concepts first-order product concepts and move implementation details into Features, Recipes, and Reference. _Concepts now list Runtime client, SQL migrations, Type generation from SQL, and Admin UI; added Client, CLI, Formatter, and Agent skill docs; Schema diff moved to Reference as internals; README/sidebar labels now match_
- [x] Final `/docs` messaging pass: read every docs page, including generated example pages, and align wording with the landing page. _fixed stale `generate` reads-live-schema wording, tightened Admin UI labels, moved stale recipe link labels to SQL migrations / Schema diff internals, and made migration-model recommendation prose read as public docs instead of internal spec language_
- [x] Apply the `writing-well` checklist: cut inflated framing, prefer concrete examples, avoid templated phrasing and em-dashes, keep headings natural. _touched-file scan is clean for em-dashes and common filler patterns; runtime-validation prose lost a templated contrast_
- [x] Verify with `pnpm --filter sqlfu-website build`. _green after `pnpm install` and `pnpm --filter @sqlfu/ui build`; latest docs IA follow-up built 30 pages_
- [x] Update this section with brief italic breadcrumbs as items land. _this update_

Implementation notes:

- Initial inspection read `website/src/pages/index.astro`, `website/src/styles/landing.css`, `website/astro.config.mjs`, `website/scripts/sync-docs.mjs`, `packages/sqlfu/README.md`, and representative docs pages.
- The current sidebar is almost flat: Getting Started, overview, adapters, UI, migration/typegen/runtime/dynamic/outbox/examples/observability/lint/schema-diff. That makes onboarding, concepts, guides, and reference look equivalent.
- The current landing page already had a simple first CTA, but the main value section jumped from source files to generated wrappers to migrations in three equal cards. This pass slowed that down into separate feature beats.
- Build note: this worktree had no `node_modules`, so the first website build failed on missing `dedent`. After `pnpm install`, Astro built successfully but `sync-ui` required `packages/ui/dist`; `pnpm --filter @sqlfu/ui build` resolved that prerequisite.
- Optional browser check note: Playwriter could not connect because the Chrome extension was not enabled. Static build output was inspected with `rg` for the landing text and grouped sidebar.
- Final messaging pass repetition log: kept the SQL-files-as-source message in the landing page, Overview, Getting Started, Type generation, Lint plugin, and Runtime validation because each is a different entry point; kept "sync stays sync" in Runtime client and Adapters because one is conceptual reassurance and the other is driver-reference detail; kept Admin UI mentions in Overview, CLI, and the UI page because they serve quick-start, command, and embedding contexts respectively; left generated example pages as fixture documentation even though they repeat `sqlfu generate`, because their job is exact generated-output evidence rather than narrative docs.

## 2026-04-20 pass

Status: done for this pass. All planned edits landed across 5 commits. Website build green after the last edit. Source docs (README + 3 docs pages + landing) are now em-dash-free; only remaining em-dashes in the tree are inside `src/vendor/*/CLAUDE.md` (agent-facing vendor notes, out of scope).

Scope was the 8-12 worst em-dash/rough-prose offenders in the source docs surfaces (package READMEs, `packages/sqlfu/docs/*.md`, landing page). Not touching generated sidebar (`website/src/content/docs/*`) or root `README.md`.

Inventory summary:
- ~30 em-dashes across `packages/sqlfu/README.md`, `packages/sqlfu/docs/{observability,runtime-validation,migration-model}.md`, one `&mdash;` in `website/src/pages/index.astro`.
- `docs/observability.md` intro has a grammatical slip ("as a consequence making" → missing "of") and an odd "<200 lines of code" boast that reads like agent filler.
- `docs/runtime-validation.md` opens with a triple em-dash sentence that's hard to scan; lists are dense with em-dashes where colons/periods would read cleaner.
- `docs/migration-model.md` em-dashes are mostly used for parenthetical clauses that could just be sentences; a couple ("for example because … or because it touched something", "— `Pending Migrations` is the whole point") are worth rephrasing.
- `README.md` has em-dashes in the observability + agent-skill paragraphs; both replace cleanly with periods or commas without losing meaning.
- `index.astro`'s `&mdash;` is the only HTML-entity em-dash and lives in the value-panel prose.

Plan bullets:
- [x] `tasks/improve-docs.md`: land this plan as the first commit so the PR shows up with context. _first commit, ad85efb_
- [x] `packages/sqlfu/README.md`: replace em-dashes in the observability + agent-skill paragraphs; tighten the "agent-agnostic" line. _163d719: three rewrites, root README auto-regenerated by pre-commit hook_
- [x] `packages/sqlfu/docs/observability.md`: fix the intro typo ("as a consequence making" → "as a consequence of making"), drop the "<200 lines of code" filler, rewrite the three bullet list at `db.query.*` as colon-separated (no em-dash), rephrase the PostHog and Datadog leads without the em-dash asides. _c476f66: intro fully rewritten, all 7 in-body em-dashes gone, normalized the "(generated - do not edit)" comment to match runtime-validation.md_
- [x] `packages/sqlfu/docs/runtime-validation.md`: rewrite the opening sentence without a double em-dash, change the validator-choice bulleted list so each bullet uses a period after the name rather than " — ", dedupe the "That's the value-add" sentence so only one em-dash remains. _ed67c67: 19 rewrites. Validator bullets now use "<name>: ..." form. Opening em-dashes replaced with parentheses for the library names_
- [x] `packages/sqlfu/docs/migration-model.md`: convert the em-dashes in the failure-path paragraphs to either commas or full stops; keep the meaning intact. _ac46bfe: 4 rewrites, all in the Failed Migrations section_
- [x] `website/src/pages/index.astro`: replace `&mdash;` with a period or comma so the value-panel reads as two short sentences instead of one long one. _194c23d: replaced with ": " which fit the phrase better than a period_
- [x] Verify the docs build still renders: `pnpm --filter sqlfu-website build` after the batch. _green: 8 pages built, all 6 docs pages present_
- [x] Update this sub-section with breadcrumb italics as items land. _this commit_

Not in scope this pass:
- `docs/schema-diff-model.md`: zero em-dashes; prose is already tight. Leave for a future pass if a scan turns up something.
- `packages/ui/README.md`: short, no em-dashes, reads clean.
- `docs/migration-model.md` full rewrite of the big "Authority Mismatches" table paragraphs (prose around the table, not the table itself). Deferred: a bigger re-structure question than this pass is budgeted for.
- `src/vendor/*/CLAUDE.md` files still contain em-dashes. These are agent-facing vendor notes, not user-facing docs, so leaving as-is for now.
- Any new docs pages. This pass is strictly local rewrites.

For the next pass:
- The Authority Mismatches table in `docs/migration-model.md` has "Pending Migrations" and "History Drift" as two rows with the same `Comparison` text ("Migrations <> Migration History") but different meanings. That's confusing. Worth a restructuring or a footnote clarifying the distinction inline in the table.
- `docs/migration-model.md` references `Sync Drift` (three times in the Recommendations / failure sections) but the `Authority Mismatches` table only defines `Schema Drift`. `Sync Drift` is a real thing in `src/api.ts` (it's one of the `MismatchCard.title` values and appears in test snapshots) but the migration-model doc never defines what it is or how it differs from `Schema Drift`. Worth adding a row to the Authority Mismatches table or otherwise naming it.
- The `Capabilities` section headers in `README.md` (Client / Migrator / Diff Engine / Type Generator / Formatter / Observability / UI / Agent skill) mix capitalization (Title Case vs lowercase-first like "Agent skill"). Pick one.
- Cross-reference in `README.md#observability` points at `docs/observability.md` but the `Capabilities` TOC up top doesn't list Observability. Add it to the TOC, or accept the asymmetry deliberately.

## 2026-04-20 pass #2

Status: done for this pass. Four commits, all in PR #35. Docs build green (8 pages built, 6 docs pages present). Branch: `improve-docs-2026-04-20`.

Findings after the first pass:

- **`runtime-validation.mdx` em-dashes regressed.** The earlier pass cleaned em-dashes out of `runtime-validation.md`, then the better-validate task rewrote the file as `.mdx` (alphabetised validators, tabbed samples) and reintroduced 14 of them. Same cleanup as pass #1, redone against the new structure.
- **`Capabilities` TOC in README still doesn't list Observability** — flagged in pass #1's "for next pass" list. One-line fix.
- **`Capabilities` section headings in README are case-inconsistent.** "Agent skill" (lowercase s) alongside "Client", "Migrator", "Diff Engine", "Type Generator", "Formatter", "Observability", "UI". Pick Title Case (the majority) for "Agent Skill" as well.
- **`migration-model.md` names the Desired Schema <> Live Schema mismatch "Schema Not Current".** The product code calls the same mismatch "Sync Drift" (`src/api.ts:770`, `src/ui/router.ts:603`, CLI output) and the doc itself uses "Sync Drift" three times in the Recommendations / Preflight sections without ever defining it. So the vocabulary the doc introduces is not the vocabulary a user sees in the UI or the `sqlfu check` output. Going with a doc-side rename (shipped product name wins) — swap the "Schema Not Current" row label and the matching subsection heading to "Sync Drift". This actually shrinks the glossary the doc introduces, rather than adding a new term.

### Plan for this pass

- [x] Land this plan as the first commit so the PR shows the updated thinking before any edits. _5232f22_
- [x] `packages/sqlfu/docs/runtime-validation.mdx`: replace the 14 em-dashes with periods / commas / colons depending on what the sentence is doing. Keep the tabbed structure and validator vocabulary. _d1740e6: all 14 replaced; validator bullets use `<name>:` form, opening list becomes parens, summary sentences become colons or full stops_
- [x] `packages/sqlfu/README.md`: add `Observability` to the Capabilities TOC; rename `Agent skill` → `Agent Skill` in both the TOC and the section heading. _2a40f3b: root README regenerated by pre-commit hook_
- [x] `packages/sqlfu/docs/migration-model.md`: rename the "Schema Not Current" row in the Authority Mismatches table to "Sync Drift", update the dedicated subsection heading, and tweak the lede so the comparison text still reads naturally. _dfbff7f: renamed one row, one subsection, three recommendation bullets, one numbered-list entry; the two "If Sync Drift is also reported …" callbacks dissolved because those lines now belong to bullets already headed "Sync Drift"_
- [x] Verify docs build: `pnpm --filter sqlfu-website build`. _green: 8 pages, 6 docs pages (sqlfu, ui, migration-model, schema-diff-model, observability, runtime-validation)_
- [x] Update this sub-section with breadcrumb italics as items land. _this commit_

Not in scope this pass:

- Authority Mismatches table restructure for the shared-comparison `Pending Migrations` vs `History Drift` rows. Still deferred.
- `src/vendor/*/CLAUDE.md` em-dashes. Agent-facing vendor notes.
- Any new docs pages.

For the next pass:

- **Authority Mismatches table still has two rows with the same `Comparison` text** (`Pending Migrations` and `History Drift` both compare `Migrations <> Migration History`). The column header doesn't make clear that what distinguishes them is "unapplied new migrations" vs "applied migrations no longer exist / differ". Could be solved by restructuring the table, or by adding a single clarifying footnote, or by splitting the column into `Comparison` + `Direction` (what's new / what's missing).
- **`docs/observability.md` and `README.md` Observability section both claim "without extra configuration per destination".** The README says this more carefully ("through a single `instrument()` call"). Worth tightening the observability page's lede to match rather than making a broader claim.
- **`docs/schema-diff-model.md` has a stray "So the short answer is" sentence** at line 153 that reads as a carry-over from an earlier draft where "is the engine at `src/schemadiff/sqlite/`?" was the framing question. In the current structure it lands awkwardly mid-"Where The Code Lives". Small rewrite job, not urgent.
- **`packages/sqlfu/README.md` Limitations list** says "SQLite view typing is still imperfect in TypeSQL" and "some expressions still need the sqlfu post-pass to get better generated result types". Those are two ways of saying the same thing (the post-pass exists because TypeSQL misses some SQLite cases, view typing is one of them). Fold them into one bullet.
- **Product/docs question**: the migration-model doc says `sqlfu check` "may also recommend a target migration when it can prove that the Live Schema exactly matches some replayed migration prefix", with a multi-step replay procedure. That's presented aspirationally ("may", "should"). Worth confirming this is implemented today and either dropping the aspirational voice or flagging as a TODO.

## 2026-04-22 onboarding pass

Status: in progress. Task file at `tasks/improve-docs-onboarding-pass.md`. Branch: `improve-docs-onboarding-pass`.

Scope is the new-user onboarding flow: new Getting Started page (narrative walkthrough), new Lint Plugin page, README surgery, sidebar reorder, landing page CTA/demo/footer, `/docs` redirect. Full decision tree resolved via grill-me interview.

Executive decisions made (with rationale):

- `sqlfu init` folds into Getting Started only; not a standalone docs destination.
- Outbox deferred entirely: module not implemented; blog drafts that link to `/docs/outbox` flagged for author but not modified (gitignored).
- `generate` ordering bug (README shows `generate` before `migrate` but `generate` needs live DB) is a product gap, not a docs fix. Separate task `tasks/generate-preflight.md` with problem statement only.
- Formatter stays in README (surface too small for its own page).
- Schema Diff Model moved to last in sidebar (deep-theory, not how-to-use).
- Runtime validation moved up in sidebar (early-decision feature, high-value for tRPC/forms apps).
- Demo is fully self-contained (sqlite-wasm, no backend needed); landing page footer and button copy updated to communicate this.

## 2026-04-28 pass

Status: done for this pass. Five commits in PR #70. Website build green (23 pages built; `sync-ui` requires a pre-built `@sqlfu/ui` package, both ran clean). Branch: `improve-docs-2026-04-28`. Worktree: `/Users/mmkal/src/worktrees/sqlfu/improve-docs-2026-04-28`.

Scope is the carry-over list from passes #1 and #2 plus an em-dash sweep on docs files that haven't been swept yet. Source-of-truth carry-overs:

1. `migration-model.md` Authority Mismatches table: `Pending Migrations` and `History Drift` rows share the same `Comparison` text. Distinguish them inline.
2. `observability.md` lede claims "without extra configuration per destination" — broader than what actually ships. Tighten to match the README's "through a single `instrument()` call" framing.
3. `schema-diff-model.md` line 153 has a stray "So the short answer is" sentence that lands awkwardly mid-section under "Where The Code Lives".
4. `packages/sqlfu/README.md` Limitations: two bullets ("SQLite view typing is still imperfect in TypeSQL" and "some expressions need the sqlfu post-pass to get better generated result types") are restating the same fact. Fold into one.
5. **Confirmed implemented**: `sqlfu check` recommending a target migration when the live schema matches a replayed migration prefix is real (`findRecommendedTarget` in `src/api.ts`, called for both baseline and goto recommendations). Drop the aspirational "may", "should" voice in `migration-model.md` lines 292-307.

Em-dash inventory (source docs only; vendored CLAUDE.md and generated content excluded):

- `packages/sqlfu/README.md`: 4 em-dashes in the Core Concepts and Capabilities sections (`definitions.sql` bullet, `sqlfu_migrations` bullet, Observability paragraph, `SqlfuError.kind` paragraph). Pass #1 cleaned the older em-dashes; these are newer additions.
- `packages/sqlfu/docs/adapters.md`: 9 em-dashes — sync-stays-sync intro, compatibility-matrix preamble, choosing-an-adapter heading, three section headers (`@libsql/client —`, `@tursodatabase/serverless —`, `@tursodatabase/sync —`), one in the comment line.
- `packages/sqlfu/docs/errors.md`: 7 em-dashes spread across the lede, the `missing_table` deviation note, the `.cause` paragraph, the `.stack` description, the `.query` shape comment, and the dimensionality paragraph.
- `packages/sqlfu/docs/dynamic-queries.md`: 2 em-dashes (the "more than a handful of optional filters" bullet, the "deliberate non-goal" paragraph).
- `packages/sqlfu/docs/getting-started.md`: 3 em-dashes (the global-binary delegation paragraph, the "Adapters" link in "Where to go next", the OTel sentence).
- `packages/sqlfu/docs/id-helpers.md`: 9 em-dashes in the catalog intro, `definitions.sql` paragraph, the cuid2 caveat, the monotonicity caveat, the recipe-page sentence, all four section headers, and the bigger-SQL-bundles section.
- `packages/sqlfu/docs/migration-model.md`: 5 em-dashes left after pass #1 (the `four-digit` paragraph, the `migrations.preset` lede, the d1-era migrations note, the schema-detection paragraph, the checksum-downgrade tradeoff, the `prefix` override example).
- `packages/sqlfu/docs/observability.md`: 2 em-dashes (the lede, the `SqlfuError.kind` discriminator paragraph).
- `packages/sqlfu/docs/outbox.md`: 6 em-dashes throughout (header bullet, the consumer-options comment, the time-period sentence, two `client` / `causedBy` sentences, the OTel out-of-scope note).
- `website/src/pages/index.astro`: 1 em-dash (the pre-alpha notice).

`packages/sqlfu/docs/lint-plugin.md`, `typegen.md`, `runtime-validation.mdx`, `schema-diff-model.md`, `packages/ui/README.md` are em-dash-free already.

### Plan

- [x] Land this plan as the first commit so the PR shows context. _f452c1d_
- [x] `packages/sqlfu/docs/migration-model.md`: split the shared `Migrations <> Migration History` comparison column so Pending and History Drift rows are visibly different; sweep the 5 remaining em-dashes; drop aspirational voice on `sqlfu check`'s prefix-matching recommendation now that it's implemented. _ff195e1: added a "Direction" column ("new migrations not yet applied" vs "applied migrations no longer match the repo"); 5 em-dashes replaced; aspirational "may also recommend a target migration when it can prove..." rewritten to indicative voice with a pointer to `findRecommendedTarget` in `src/api.ts`; replay-procedure list collapsed because the implementation walks prefixes 1..n itself_
- [x] `packages/sqlfu/docs/observability.md`: tighten the lede to mirror the README's narrower claim; sweep 2 em-dashes. _aa649bf: lede rephrased to drop "without extra configuration per destination" and "anywhere else you want to see it"; both em-dashes replaced (lede uses comma + parens; SqlfuError discriminator list uses parens)_
- [x] `packages/sqlfu/docs/schema-diff-model.md`: remove the stray "So the short answer is" sentence at the end of "Where The Code Lives". _aa649bf: replaced with a single direct sentence about the engine's location_
- [x] `packages/sqlfu/README.md`: fold the two TypeSQL/post-pass bullets in Limitations into one; sweep 4 em-dashes (Core Concepts, Capabilities); pre-commit hook regenerates root README. _e35ee5d: bullets merged into "result-type inference is imperfect on some SQLite expressions and views; the sqlfu post-pass that fills gaps in the vendored TypeSQL output is still evolving"; em-dashes replaced; root README regenerated by pre-commit hook_
- [x] `packages/sqlfu/docs/adapters.md`: sweep 9 em-dashes; section headers become plain titles, sync-stays-sync paragraphs use periods/commas. _80be404_
- [x] `packages/sqlfu/docs/errors.md`: sweep 7 em-dashes (lede, deviations note, `.cause` / `.stack` / `.query` shape, low-cardinality dimension). _80be404_
- [x] `packages/sqlfu/docs/dynamic-queries.md`: sweep 2 em-dashes. _80be404_
- [x] `packages/sqlfu/docs/getting-started.md`: sweep the em-dash. _80be404 (1 em-dash; the original inventory of 3 conflated `--` text dashes used as separators with `—`; only 1 was a real em-dash)_
- [x] `packages/sqlfu/docs/id-helpers.md`: sweep em-dashes; section headers use ":" instead of " — ". _80be404_
- [x] `packages/sqlfu/docs/outbox.md`: sweep em-dashes. _80be404_
- [x] `website/src/pages/index.astro`: replace the pre-alpha-notice em-dash with a period. _80be404: now reads "pre-alpha. The TypeScript API may still shift. The SQL won't."_
- [x] Verify docs build: `pnpm --filter sqlfu-website build`. _green: 23 pages built (8 docs pages, landing, examples, ui sync)_
- [x] Update this sub-section with breadcrumb italics as items land. _this commit_
- [x] Tag `Outbox` as experimental in `packages/sqlfu/README.md` (TOC + section heading) and add an inline warning matching the docs page. _follow-up after PR feedback: TOC entry now reads "Outbox (experimental) → #outbox-experimental"; section heading mirrors; one-line ⚠️ callout aligns with `docs/outbox.md`. Pre-commit regenerates root README._

Not in scope this pass:

- `packages/sqlfu/docs/lint-plugin.md`, `typegen.md`, `runtime-validation.mdx`, `schema-diff-model.md`, `packages/ui/README.md`: already em-dash-free.
- `src/vendor/*/CLAUDE.md` em-dashes: agent-facing vendor notes, deliberately out of scope.
- The two-bullets-in-Limitations restructure may surface an underlying question about whether "view typing" should be its own dedicated docs section; flagging but not pursuing this pass.
- Restructuring `migration-model.md`'s big "Authority Mismatches" prose around the table (vs the table cells themselves) — pass #1 also deferred this.

For the next pass:

- The Authority Mismatches table column header is now `Comparison + Direction` (forward / backward). Confirm with users / reviewers that this reads naturally; if not, the alternative is splitting into two columns or a single-row inline footnote.
- `getting-started.md` still implies `sqlfu init` exists today — confirm it really does. The existing `tasks/generate-preflight.md` already flags the related `generate`-needs-live-DB ordering issue.
- `docs/adapters.md` "Choosing an adapter" overlaps with the `sqlfu` overview's "Adapters" link — worth seeing whether the bullet list there could move into a smaller "see also" or get pulled up into the README's adapter table.
