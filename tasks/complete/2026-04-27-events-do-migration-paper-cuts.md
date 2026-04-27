---
status: done
size: small
---

# DO + typesql + non-interactive CLI paper cuts (from events DO migration)

Three rough edges surfaced while migrating apps/events' Durable Object
storage to sqlfu (PR #62 + pkg-pr-new build d58d3d8). Each is small;
bundling for a single sweep.

## Status (2026-04-27)

All three fixes landed on this branch:
- Parser now lets SQLite's non-reserved keywords (OFFSET, KEY, ROW, …) act as
  bare identifiers in column / table / alias positions, mirroring SQLite's
  FALLBACK rule. New test file `non-reserved-keywords.test.ts` covers the
  events use case (SELECT, qualified ref, INSERT cols, UPDATE SET).
- `DurableObjectSqlStorageLike.exec` is non-generic with `bindings: any[]`
  and `toArray(): unknown[]`; row-typing happens in `all` / `iterate` via
  cast. Now structurally accepts CF's `SqlStorage` without ts-ignore. New
  type-test `durable-object.test-d.ts` exercises this against a CF-shaped
  inline mock.
- `check.all` is marked `default: true` in the trpc-cli router meta, so
  `sqlfu check` (no leaf) auto-dispatches to it instead of opening a clack
  picker that hangs in CI / piped invocations. `sqlfu check
  migrations-match-definitions` keeps working as before.

## Issues

- [x] **typesql parser rejects `offset` as a bare column name in SELECT lists.**
  _Fixed by adding `NON_RESERVED_KEYWORDS` to `vendor/sqlfu-sqlite-parser/tokenizer.ts`
  and an `isIdentLike` helper; parser routes non-reserved keywords through
  `parseIdentifierPrimary` and uses `expectIdentLike` at INSERT/UPDATE
  column-list call sites. Source casing is preserved by slicing from sql
  rather than using the upper-cased `KEYWORD.value`._
  `select offset from t` fails at typegen time with
  `unexpected keyword 'OFFSET' where an expression was expected (offset 7)`.
  Real SQLite parses `offset` as a column name fine outside of `LIMIT`. The
  vendored typesql parser (or its lexer) is treating the bare identifier as
  the OFFSET keyword. Workaround we landed in events: quote it (`"offset"`)
  in queries _and_ in the `INSERT INTO t (cols)` column list. Repro: any
  query referencing a column named `offset` unquoted.

  Why it matters: a column named `offset` is natural for event-log /
  append-only-table schemas. Forcing users to either rename or sprinkle
  double-quotes is unfriendly.

  Likely fix area: `packages/sqlfu/src/vendor/typesql/...` — the lexer
  shouldn't claim `OFFSET` outside of LIMIT clause context. Or as a
  cheaper interim, the analyzer could pre-quote SQLite reserved words
  that appear in identifier position.

- [x] **`createDurableObjectClient(ctx.storage)` doesn't typecheck against the official `DurableObjectStorage` type.**
  _Fixed by dropping the row generic from `DurableObjectSqlStorageLike.exec`
  (now `(query, ...bindings: any[]) => {toArray(): unknown[]; rowsWritten?: number}`)
  and casting inside `all`/`iterate` to the user-supplied `TRow`. Validated
  with a tsd-style `*.test-d.ts` that asserts `createDurableObjectClient`
  accepts a CF-shaped `DurableObjectStorage` mock without errors._
  Cloudflare's `SqlStorage.exec<T extends Record<string, SqlStorageValue>>`
  has a stricter generic constraint than sqlfu's
  `DurableObjectSqlStorageLike.exec<TRow extends ResultRow>`. Type error
  is the canonical "could be instantiated with a different subtype":
  ```
  Type 'Record<string, SqlStorageValue>' is not assignable to type 'TRow'.
    'Record<string, SqlStorageValue>' is assignable to the constraint of
    type 'TRow', but 'TRow' could be instantiated with a different subtype
    of constraint 'ResultRow'.
  ```
  PR #62's own DO test sidesteps this with `state: any`. The events
  workaround at `apps/events/src/durable-objects/stream.ts`:
  ```ts
  this.client = createDurableObjectClient({
    sql: ctx.storage.sql as unknown as DurableObjectSqlStorageLike,
    transactionSync: ctx.storage.transactionSync.bind(ctx.storage),
  });
  ```

  Why it matters: the snippet on the adapters page (`createDurableObjectClient(ctx.storage)`)
  is the headline ergonomics promise of PR #62 and it just doesn't
  typecheck against real CF types out of the box.

  Likely fix: relax the `exec` shape on `DurableObjectSqlStorageLike` so
  it accepts a callable returning anything cursor-like — drop the row
  generic on the interface, then have the adapter narrow inside `all`/
  `iterate`/`run`. Avoids importing `@cloudflare/workers-types`. Validate
  with a tsd test that `createDurableObjectClient(ctx.storage)` typechecks
  against a real `DurableObjectStorage`.

- [x] **`sqlfu check` is unusable non-interactively.**
  _Fixed by setting `meta.default = true` on `check.all` in
  `src/node/cli-router.ts`. trpc-cli auto-dispatches to the default
  subcommand when the parent is invoked bare, so the picker is bypassed
  entirely (TTY or not). `sqlfu check migrations-match-definitions` still
  routes to that leaf. Verified manually in `dev-project` with both a
  pipe (`echo "" | tsx … check`) and direct invocation; both exit 0._
  When stdin isn't a TTY, the subcommand picker still prompts and then
  the process hangs on an unsettled top-level await:
  ```
  Warning: Detected unsettled top-level await at .../bin/sqlfu.js:89
      await importCli(target);
  ```
  `echo migrations-match-definitions | sqlfu check` doesn't drive the
  picker either — it shows the radio selecting the option, but never
  proceeds. Same shape as the migrate `--yes` / non-TTY default we did
  in PR #52.

  Why it matters: I wanted to add `sqlfu check.migrationsMatchDefinitions`
  to the events `pretest` step but couldn't run it from CI / from a
  package script.

  Likely fix: either auto-run `check.all` when there's no TTY (mirrors
  the migrate `yes ?? !process.stdin.isTTY` pattern), or expose each leaf
  as a flat command (`sqlfu check.migrations-match-definitions`) so the
  picker is bypassable. Probably both.

## Notes

These all came out of one afternoon getting `apps/events`'s Durable
Object storage onto sqlfu. The migration itself worked fine; these are
just the rough edges I had to sand off as I went. Filing as a single
task because none of them is worth its own task file.
