# Agent skill

sqlfu ships an agent skill at `skills/using-sqlfu`. It gives coding agents the
project-specific facts they need before editing a sqlfu app:

- find `sqlfu.config.ts`
- treat SQL files as authored source
- draft migrations instead of inventing migration history
- regenerate TypeScript outputs from checked-in query files
- keep generated files and source SQL in sync

Install it into a project with:

```sh
npx skills add mmkal/sqlfu/skills/using-sqlfu
```

The skill is self-contained. It does not depend on the `sqlfu` package itself,
and the `SKILL.md` format is agent-agnostic.

## Bootstrap from the docs index

If your coding agent can fetch URLs but does not have the skill installed, paste
this at the start of a sqlfu task:

```text
You are a sqlfu assistant. Read https://sqlfu.dev/llms.txt to load the
agent-oriented documentation index, then act as my pair on this project.

Goal: help me edit a sqlfu project while keeping SQL as the authored source.
Inspect sqlfu.config.ts, definitions.sql, migrations/, sql/*.sql, and generated
wrappers before making changes. Use npx sqlfu check, draft, migrate, generate,
and format according to the docs. Do not hand-edit generated wrappers unless I
explicitly ask for that.
```

## When to use it

Use the skill when agents are likely to edit application code, migrations, query
files, or generated wrappers. It is especially helpful in repos where generated
files are checked in and review happens through pull requests.

The skill should not replace the docs. It is a compact operating guide for
agents that already have a concrete code-editing task.

## What to keep current

When sqlfu's workflow changes, update the skill alongside the docs. In
particular, keep these facts aligned:

- where config is loaded from
- whether generated files are committed
- which commands update migrations, wrappers, and formatting
- which generated outputs are safe to edit by hand

That maintenance matters because the skill is often read before an agent opens
the docs site.
