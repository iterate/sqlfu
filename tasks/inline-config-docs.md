---
status: implemented
size: medium
---

# Bias docs and init toward inline config

Status: Implementation complete and pushed for review. Onboarding docs, guide intros, typegen/migration concepts, and CLI/API `sqlfu init` now start from inline config. File-backed config is documented as the split-out path, the Admin UI init path deliberately keeps a file-backed scaffold because the UI server still requires file-backed projects, and inline queries now support `.map(...)` result shaping so inline mode has a first step toward mapper parity.

## Goal

Make sqlfu's instructions, guides, getting started material, tutorials, and starter generation consistently teach inline config first. File-based config should still be documented, but as the thing users graduate to when they want to split configuration out of query files or share it across multiple files.

## Assumptions

- Inline config is the preferred first-run experience for new users.
- File-based config remains supported and useful, but it should not be the first thing a new user sees unless the surrounding topic is specifically about shared configuration.
- `sqlfu init` can change its generated files and messages because sqlfu is pre-alpha and there is no compatibility burden to preserve old starter output.
- Docs should preserve accurate examples of file-based config where they explain config files, migration presets, or multi-file project organization.

## Checklist

- [x] Audit docs, examples, tutorials, and guide-like copy for file-based-first instructions. _checked README, getting started, CLI, guide index, runtime guides, typegen, migration model, agent docs, and UI copy with `rg` sweeps for `definitions.sql`, `sql/queries.sql`, generated wrappers, and init wording_
- [x] Rewrite onboarding and getting-started paths so the first runnable examples use inline config. _`packages/sqlfu/docs/getting-started.md` now walks through inline `defineConfig`, inline `draft`, inline `generate`, and runtime binding via `dbConfig(client)`_
- [x] Move file-based config explanations into an explicit "split it out later" or advanced/shared-config framing. _README and getting-started now include split-out sections; runtime guides keep file-backed snippets where D1 presets or larger project shape need them_
- [x] Update `sqlfu init` output and tests so new projects start from inline config by default. _`createDefaultInitPreview()` defaults to inline config and `test/init.test.ts` asserts the new scaffold; UI command context opts into file-backed init because inline projects are not UI-servable yet_
- [x] Add inline query result mapping with `sql.one\`...\`.map(...)` / `sql.many\`...\`.map(...)`. _the `sql` tag now returns mappable query objects, inline config applies row mappers at runtime, and inline source rewriting preserves `.map(...)` after generated type metadata is inserted_
- [x] Run focused tests and docs/build checks that cover the changed surfaces. _ran init/UI-init focused Vitest tests, sqlfu and UI typechecks, root README sync, and website docs/LLMs sync_
- [x] Open a draft PR and keep it updated with the net behavior change for reviewers. _opened draft PR #148 and updated the body after implementation_

## Implementation Notes

- Worktree: `../worktrees/sqlfu/inline-config-docs`
- Branch: `inline-config-docs`
- Verification:
  - `pnpm --filter sqlfu exec vitest run test/init.test.ts`
  - `pnpm --filter sqlfu exec vitest run test/ui-server.test.ts -t "sqlfu server can initialize a fresh directory through the ui rpc"`
  - `pnpm --filter sqlfu typecheck`
  - `pnpm --filter sqlfu exec vitest run test/config-inline.test.ts test/inline-source.test.ts`
  - `pnpm --filter @sqlfu/ui typecheck`
  - `pnpm sync:root-readme`
  - `pnpm --filter sqlfu-website exec node scripts/sync-docs.mjs && pnpm --filter sqlfu-website exec node scripts/sync-llms.mjs`
- Full `pnpm --filter sqlfu test -- init.test.ts` was not a focused run; the package script fanned out to the full node suite and hit pre-existing/broader failures in watch timeout and UI asset resolution tests. The branch-specific UI init failure from that run was fixed and verified with the targeted test above.
