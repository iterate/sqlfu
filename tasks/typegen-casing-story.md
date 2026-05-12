---
status: ready
size: medium
---

**Status:** design resolved; implementation not started. Query identity camelCasing is already complete. This task adds `generate.casing`, defaulting to camelCase, so generated query modules become an explicit SQL-to-application boundary: column-derived fields become camelCase in generated query data/results with visible mapping, while user-authored placeholder params remain exactly as written. Public docs should recommend camelCase placeholder names when users want a fully camelCase generated query API. If two raw fields would map to the same camelCase name, only that collision group should keep raw casing instead of failing generation. `preserve` remains available as the opt-out.

Below is the bot-written spec for this task. I, the human, think this:
We should probably let people use whatever valid params they want when using `:myParam`. i.e. don't touch casing on that. Just encourage people to use camel-case with those things.

Query *names* should be camel-cased, to match the function name. i.e. if you have `sql/find-posts.sql` and run `sqlfu generate` you'll get a `findPosts` function. The query should have `name: 'findPosts'` rather than `name: 'find-posts'` because then it matches the actual function's `.name` property.

---

# Typegen casing story: snake_case vs camelCase across the generated output

## Why this exists

Landed PR #23 on the back of "typegen emits everything your app needs." That exposes a design question that was easier to hand-wave when typegen only emitted query wrappers: **what casing convention do TS-side identifiers follow when they derive from DB-side names?**

Today typegen preserves whatever the DB uses. Snake-cased columns come out as snake-cased TS field keys:

```ts
export type PostsRow = {
  id: number;
  slug: string;
  created_at: string;   // DB column is `created_at`
  published_at: string | null;
};

export type InsertMigrationParams = {
  name: string;
  checksum: string;
  applied_at: string;   // named placeholder was `:applied_at`
};
```

That's "honest" but not JS-idiomatic. From a code review on #23:

> hmm wondering why this is `applied_at` not `appliedAt` - this is a javascript concept rather than a literal column.

Reviewer's instinct is the JS default: camelCase in JS, snake_case at the SQL edge. Which is what drizzle, kysely, and prisma all do (by default; configurable). But sqlfu's whole thing is "SQL First, TypeScript Second" — there's a real argument for preserving column names verbatim.

This needs a deliberate answer before it proliferates through consumers.

## Surfaces affected

The decision cuts across every generated identifier that has a DB counterpart:

| Surface                              | Today (snake-preserving)         | Alternative (camel-conventional) |
| ------------------------------------ | -------------------------------- | -------------------------------- |
| Table row type fields                | `applied_at: string`             | `appliedAt: string`              |
| View row type fields                 | `published_at: string \| null`   | `publishedAt: string \| null`    |
| Query result columns (select list)   | `post_id: number`                | `postId: number`                 |
| Query param names (from `:ident`)    | `applied_at: string`             | `appliedAt: string`              |
| Query data names (for insert/update) | `post_id: number`                | `postId: number`                 |
| Function names                       | Already camelCase (from filename) | —                               |
| Row type names                       | Already PascalCase (from table name) | —                             |
| SQL string constants                 | Not affected (it's a string)     | —                                |

If casing flips, the runtime argument-building in the wrapper changes too: today `args: [params.applied_at, ...]`; after flip, `args: [params.appliedAt, ...]`. That's a codegen change, not just a type change.

## Options

### A. Preserve DB casing (today's behavior, status quo)

TS identifiers match DB verbatim. snake_case in = snake_case out.

- **Pro**: truthful. Opening a file and comparing the generated type to the SQL is a visual identity — no mental mapping. Matches sqlfu's "SQL First" framing.
- **Pro**: no configuration needed; no ambiguity for `snake_case_with_numbers_2`, mixed-case table names, etc.
- **Pro**: interop with raw SQL results (when users go around the wrapper and hit the client directly) is free — the row shapes line up.
- **Con**: looks un-idiomatic in TS code. Linters with `camelcase` rules complain.
- **Con**: a consumer who uses the row type in a React component ends up with JSX attributes named `applied_at`, which looks odd.

### B. Always camelCase (drizzle/kysely default)

Snake-cased columns come out as camelCased TS. `applied_at` → `appliedAt`. Insert parameter `:applied_at` → `appliedAt` in the param type. The wrapper converts between them at the boundary.

- **Pro**: idiomatic TS. Matches what most JS devs expect.
- **Pro**: decouples TS API from DB naming. Users can rename a column from `legacy_foo` to `better_foo` without touching every caller (if the map happens at codegen time and the TS name was already aliased — but see below, this isn't automatic).
- **Con**: sqlfu loses the "what you see in SQL is what you see in TS" property. A reviewer looking at `insert into x (applied_at) values (:applied_at)` would need to know typegen silently rewrites it to `appliedAt`.
- **Con**: mapping introduces footguns. `applied_at` and `appliedAt` as two columns becomes an error. `id_1` / `id_2` casing is ambiguous. Collisions need detection.
- **Con**: breaks interop with raw SQL results — `client.all({sql: '...'})` returns `applied_at` keys, generated wrappers return `appliedAt` keys. Users who mix the two get confused.

### C. Config-level option (`generate.casing: 'preserve' | 'camel'`)

Punt the decision to the user. Default to one and let the other be opt-in.

- **Pro**: lets teams choose based on their codebase norms. Doesn't force a single answer.
- **Con**: two code paths in typegen to maintain (wrapper generation, row types, arg-mapping, catalog). Matrix of permutations: `casing × validator × sync × pretty-errors` gets wide.
- **Con**: public API surface area grows. Every new typegen feature has to declare how it interacts with casing.
- **Con**: a sqlfu project that imports a second sqlfu project as a dependency needs them to agree on casing or renames get fun.

### D. Per-column alias in config or SQL (like drizzle's `.mapsTo()`)

Let users name columns in TS independently of the DB:

```ts
// sqlfu.config.ts
export default {
  columnAliases: {
    'sqlfu_migrations.applied_at': 'appliedAt',
  },
};
```

or a comment directive in SQL:

```sql
select name, applied_at /* as appliedAt */ from sqlfu_migrations;
```

- **Pro**: surgical. A team can camelCase the 5% of columns that matter in UI code and leave the rest.
- **Pro**: works alongside option A (preserve) as the default.
- **Con**: each alias is another place for drift. Adding a column without updating the alias list silently falls back to snake.
- **Con**: config format grows. Globbing (`sqlfu_migrations.*` → `camel`) starts to look like option C again.

## Open questions — to grill on before implementing

1. **Which option reflects sqlfu's identity?** "SQL First, TypeScript Second" leans toward A (preserve). But drizzle etc. lean toward B (camel), and sqlfu is differentiating on *query-filename-is-identity*, not *SQL-column-is-TS-field-name*. Is the preservation actually load-bearing for the positioning, or is it an accident of "we haven't decided yet"?
2. **What's the default?** If we pick C (configurable), what's the out-of-box behavior? Landing the feature matters less than landing the default — nobody changes defaults until they have a reason.
3. **Named-placeholder casing (`:applied_at` vs `:appliedAt`)**: is this the same question, or a different one? Users write the SQL. If casing is about "mechanical rewrite at the TS boundary," then `:applied_at` → `applied_at` in params makes sense. If it's about "TS feels like TS," then `:applied_at` in SQL becoming `appliedAt` in the param type means the SQL author had to type `:applied_at` in the SQL but callers write `.appliedAt` in TS. That's the drizzle/kysely approach, but it's surprising.
4. **Reserved words / collisions**: `default`, `new`, `delete` are legal SQL column names and illegal TS identifiers. Today we'd emit them verbatim and users get syntax errors. Does the casing story include a "sanitize reserved words" step?
5. **Interop with `client.all({sql, args})`**: when users bypass the wrapper and run raw SQL, rows come back with DB casing. If wrappers return camelCase, there are now two shapes of the same row in a codebase. Is that OK, or does the wrapper layer need to expose a "raw row type" too?
6. **Migration cost**: changing from A → B (or vice versa) mid-project is a rename across every caller. When's the right time? PR #23 already made one cross-surface rename (`appliedAt` → `applied_at` in the UI types) on the assumption that A is the default; changing to B would flip that back. Probably fine while we're pre-pre-alpha, but worth saying out loud.
7. **Is there a hybrid?** Emit snake_case as the *row* type (matches column names, matches raw `client.all` results) but camelCase as the *function signature* (what consumers type every day). The mapping happens in the wrapper. This is arguably the least-bad of both worlds — but it means row-shape types and function-argument types disagree, which is its own form of inconsistency.

## Deliberately out of scope for this task

- Naming of table row types (already PascalCase via `relationTypeName`, settled)
- Naming of wrapper functions (already camelCase from the filename, settled)
- Runtime rename of DB columns on the *query* side (that's a separate "schema migration helper" ask)

## Breadcrumb

Raised in review of #23 at comment [#3111982883](https://github.com/mmkal/sqlfu/pull/23#discussion_r3111982883) — specifically the `insert-migration.sql.ts` generated output where `applied_at` as a TS field read as un-idiomatic.

PR #23 shipped with option A (preserve). If we pick anything else here, #23's `appliedAt` → `applied_at` UI rename becomes the wrong direction and we'll revert it.

## Grill-with-docs log

- 2026-05-12: Resolved that generated query modules should be the explicit SQL-to-application casing boundary. Generated query identity stays camelCase and already matches the function name. Column-derived fields in generated query modules should camelCase into the TypeScript application shape with visible mapping in generated code. User-authored placeholders remain exactly as written: `:publishedSince` produces `publishedSince`, and `:published_since` produces `published_since`.
- 2026-05-12: Resolved that generated `Data` inputs are column-derived and should camelCase, while generated `Params` inputs are placeholder-derived and should preserve user-authored casing. Docs should recommend writing placeholders in camelCase when using camelCase generated outputs.
- 2026-05-12: Resolved that generated result fields are always camelCased, including fields that came from explicit SQL aliases. SQL aliases are not a casing escape hatch; the generated query boundary applies one consistent application-shape rule.
- 2026-05-12: Resolved casing collisions by local fallback, not failure. If multiple raw result/data fields map to the same camelCase key, keep raw names for the clashing fields and continue generating the rest of the wrapper normally. This applies to both generated `Result` fields and generated `Data` / inferred object-input fields.
- 2026-05-12: Resolved that `sql/.generated/tables.ts` stays raw DB-shaped for this casing task because it is not a generated query boundary. Added `tasks/reconsider-generated-table-row-types.md` to separately decide whether schema-wide row type generation should remain a feature.
- 2026-05-12: Superseded earlier "raw result is internal only" decision. In camelCase mode, expose the raw result type and the field-by-field result mapper as generated public surface so users can reuse sqlfu's explicit boundary mapping with other clients.
- 2026-05-12: Resolved that generated query catalog metadata should describe the application-facing wrapper surface. `columns[].name` and column-derived `arguments[].name` should be camelCased after collision fallback, while mapped entries may retain a raw SQL/source name for tooling and diagnostics. Placeholder-derived `params` arguments preserve the authored placeholder name.
- 2026-05-12: Resolved that generated validator schemas validate the application-facing wrapper shape. Params schemas preserve placeholder-derived names; data and result schemas use camelCased column-derived names after collision fallback. Raw DB rows should be mapped before public result validation.
- 2026-05-12: Resolved that JSON/logical type result decoding happens during the same raw-row to application-result mapping step. The generated query boundary should do casing conversion and storage decoding together before validation/return.
- 2026-05-12: Resolved that this should be configurable rather than an unconditional hard-coded behavior. The option should be named `generate.casing`, not `generate.queryCasing`; accepted values, default, and exact controlled surfaces still need to be grilled.
- 2026-05-12: Resolved that `generate.casing` controls generated property names, not generated symbols. Function names, `SqlQuery.name`, namespace/type names, filenames, and generated table row type names keep their existing naming rules.
- 2026-05-12: Resolved that `generate.casing` accepts exactly `'camel' | 'preserve'` and defaults to `'camel'`. Projects that want literal SQL-shaped generated properties can opt into preserve mode.
- 2026-05-12: Resolved that preserve mode should not emit no-op raw/public mapping helpers just to simplify sqlfu internals. Generated code in user repos should stay lean; only emit mapping code when the selected casing/logical type behavior actually changes runtime values.
- 2026-05-12: Resolved that camelCase mode should use explicit field-by-field mapping in generated code, not a generic runtime helper. The mapper should be attached to the generated function object with `Object.assign`, similar to `sql` and `query`.
- 2026-05-12: Resolved public names: generated query namespaces expose `RawResult`; generated function objects attach `mapResult`.
- 2026-05-12: Resolved scope: `RawResult` and `mapResult` are emitted only for row-returning queries. Metadata-only write queries keep the current no-`Result` shape and do not get mapper surface.
- 2026-05-12: Created accepted ADR `docs/adr/0001-generated-query-casing-boundary.md` recording the `generate.casing` boundary decision.
- 2026-05-12: Resolved documentation placement. Put the full `generate.casing` mental model in `packages/sqlfu/docs/typegen.md`; add only a concise config-reference mention to `packages/sqlfu/README.md` / generated root README.
- 2026-05-12: Resolved `RawResult` / `mapResult` emission rule. Emit them for any row-returning query where raw database rows differ from public results, including camelCase mapping or JSON/logical type decoding. Do not emit no-op mapper surface when `generate.casing: 'preserve'` and no other result transform exists.
