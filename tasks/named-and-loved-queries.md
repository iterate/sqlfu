status: ready
size: medium

# Named And Loved Queries

## Status Summary

- Roughly half-defined: the motivating idea is clear, and `sqlfu` already has most of the raw ingredients.
- Main completed pieces:
  - checked-in `sql/*.sql` files already give queries stable human names
  - typegen already builds a runtime catalog with `id`, `sqlFile`, `functionName`, `queryType`, schemas, and SQL text
  - the UI already treats query filename / `queryId` as first-class identity
- Main missing pieces:
  - generated wrappers throw that identity away at execution time
  - core `SqlQuery` / client APIs have no place for query identity metadata
  - there is no opinionated observability story for mapping query names into OTel / Sentry / PostHog / event pipelines

## Goal

Make query identity a first-class runtime concept in `sqlfu`, not just a filesystem convention.

The central idea is:

- users already keep their data access layer in `sql/*.sql`
- each file already has a natural stable name such as `list-profiles.sql`
- `sqlfu` should preserve that identity through typegen and runtime execution
- observability tooling should be able to group and filter by that identity without parsing SQL text

Desired user outcomes:

- "the `list-profiles` query got steadily slower over the last 3 weeks"
- "the `insert-foobar` query is failing 5% of the time"
- "show me traces where `sync-account-balance` is the slowest DB span"
- "group DB spans by query name even if the SQL text is large or structurally complex"

## Why This Fits `sqlfu`

This is unusually well aligned with the project shape.

- `sqlfu` already nudges users toward checked-in query files rather than anonymous inline SQL everywhere.
- The query filename is a better application-level identity than trying to reverse-engineer one from SQL text.
- Typegen already has access to:
  - the query file path
  - the stable query id
  - the generated function name
  - the normalized parameterized SQL text
- The runtime query catalog already serializes most of the metadata an instrumentation layer would want.

So this is not "invent a naming scheme for SQL". It is mostly "stop dropping the name on the floor".

## Current Codebase Reality

Relevant facts from the current implementation:

- `packages/sqlfu/src/typegen/index.ts`
  - typegen already derives:
    - `id` from the sql filename
    - `functionName` from the filename
    - `sqlFile` from the relative path
  - generated wrappers currently emit `const query: SqlQuery = { sql, args }`
  - no query identity metadata survives into the `client.all()` / `client.run()` call
- `packages/sqlfu/src/typegen/query-catalog.ts`
  - `.sqlfu/query-catalog.json` already contains `id`, `sqlFile`, `functionName`, `queryType`, result mode, arg schemas, and SQL text
- `packages/ui/src/server.ts`
  - query save / rename / delete already treat the filename-derived `queryId` as the durable identifier
- `packages/sqlfu/src/core/types.ts`
  - `SqlQuery` is currently just `{ sql, args }`
- adapters currently only look at `query.sql` and `query.args`

This means the design pressure should probably be:

- preserve existing simple execution semantics
- enrich the query object shape or execution surface so metadata can flow through
- keep raw/ad hoc SQL possible without pretending every handwritten fragment has a stable name

## External Guidance

This task was prompted by Charity Majors' "name your queries" argument: if queries matter operationally, they should have stable names humans can talk about.

OpenTelemetry lines up with this direction.

Current SQL DB semantic conventions explicitly call out:

- `db.query.summary` as a useful grouping key for a class of queries
- `db.query.text` as the parameterized query text
- `db.operation.name` as the operation type when known independently of parsing SQL text

Important implication:

- `sqlfu` query identity is not exactly the same thing as `db.query.summary`
- but it is extremely useful application metadata and can help produce a stronger summary / span name than ad hoc SQL parsing alone

Practical mapping likely looks like:

- standard OTel attrs:
  - `db.query.text`: generated parameterized SQL
  - `db.operation.name`: `select` / `insert` / `update` / `delete` / etc, ideally from typegen metadata
  - `db.query.summary`: low-cardinality grouping string
- `sqlfu` attrs:
  - `sqlfu.query.id`
  - `sqlfu.query.file`
  - `sqlfu.query.function`

The custom `sqlfu.*` attributes are important because the app-level query name is more precise and more stable than whatever generic summary generation OTel can infer from raw SQL.

## Design Direction

Recommended direction:

- make generated queries carry explicit identity metadata from typegen
- allow clients / adapters / instrumentation helpers to read that metadata
- provide an official instrumentation hook rather than baking OTel directly into every adapter

That probably means one of these shapes:

- extend `SqlQuery` to include identity metadata fields
- or introduce a richer query type accepted by clients, with `SqlQuery` as the minimal fragment shape

The second option may be cleaner if we want to avoid pretending all SQL fragments are named queries.

Suggested metadata payload for generated queries:

- `id`: filename without extension, such as `list-profiles`
- `sqlFile`: relative path such as `sql/list-profiles.sql`
- `functionName`: generated function name such as `listProfiles`
- `queryType`: typegen-known operation kind such as `Select`
- `resultMode`: `many` / `nullableOne` / `one` / `metadata`

Nice-to-have derived fields:

- `otelSummary`: probably something like `list-profiles`
- `otelOperationName`: lowercase query type such as `select`

Important constraint:

- do not make unnamed ad hoc SQL awkward or impossible
- but also do not let the "raw SQL exists" case block first-class support for named generated queries

## Checklist

- [ ] Decide the runtime API shape for query identity.
  Likely options:
  1. extend `SqlQuery`
  2. add `NamedSqlQuery`
  3. add a parallel execution surface for generated queries
- [ ] Preserve query identity in generated wrappers.
  Typegen should emit metadata alongside `sql` and `args`, not reconstruct it later from stack traces or file paths.
- [ ] Thread query identity through every adapter without changing execution behavior.
  Adapters should remain mostly thin; they just need the richer query object to survive until hooks/instrumentation can read it.
- [ ] Introduce an official instrumentation hook around query execution.
  This should expose:
  - query metadata
  - start / end timing
  - success / failure
  - driver result metadata such as rows affected when available
- [ ] Define the OpenTelemetry mapping.
  Baseline recommendation:
  - `db.query.text` from generated parameterized SQL
  - `db.operation.name` from typegen `queryType`
  - `db.query.summary` from `sqlfu` query identity, not SQL parsing
  - `sqlfu.query.id`, `sqlfu.query.file`, `sqlfu.query.function` as custom attrs
- [ ] Decide span naming policy.
  Recommendation:
  - use a low-cardinality name derived from query identity, not full SQL text
  - something simple like `SELECT list-profiles` or just `list-profiles`
- [ ] Provide one blessed integration example.
  The first-class target should probably be OpenTelemetry because it composes with Honeycomb / Grafana / Tempo / vendor bridges.
- [ ] Decide how this surfaces for non-OTel users.
  At minimum, the execution hook should make it easy to feed:
  - Sentry breadcrumbs/spans
  - PostHog events
  - internal structured logs / evlog
- [ ] Keep the query catalog aligned with the runtime metadata shape.
  The same identity fields should mean the same thing everywhere.
- [ ] Add tests before implementation.
  This should start with red tests proving generated queries preserve identity metadata through execution.

## Recommended Rollout

### Phase 1: Metadata Plumbing

- generated wrappers emit identity metadata
- core types accept the richer shape
- no observability integration yet

Success looks like:

- a generated query object carries stable identity all the way to adapter execution

### Phase 2: Execution Hooks

- add an official hook or middleware-style callback for query execution
- hook receives:
  - query metadata
  - SQL text
  - args count or safe arg metadata
  - timing
  - success / thrown error
  - result metadata

Success looks like:

- external instrumentation can be built without patching adapters individually

### Phase 3: OTel Reference Integration

- add a small official helper package or helper function for OTel spans
- map `sqlfu` metadata onto OTel semantic conventions and `sqlfu.*` attrs

Success looks like:

- users can get named DB spans without inventing their own conventions

## Testing Approach

Follow the project rule here: reproduce with a red test before fixing code.

Useful specs:

- generated wrappers include query identity metadata for `sql/*.sql` files
- named query metadata survives `client.all()` and `client.run()`
- ad hoc SQL still works without fake required names
- execution hooks see:
  - `id`
  - `sqlFile`
  - `functionName`
  - `queryType`
  - success / error
- OTel helper emits the expected attributes and low-cardinality span name

The first tests should be integration-style and readable, not mock-heavy.

## Open Questions

- Should `db.query.summary` be just the file-derived id, or include operation type like `SELECT list-profiles`?
- Should span names use the same value as `db.query.summary`, or a slightly richer one?
- Should the custom attrs live under `sqlfu.*` or a more generic `db.query.name` style namespace?
  Current guess: use `sqlfu.*` unless and until there is a standards-based equivalent.
- Should inline `client.sql\`\`` queries have an opt-in naming helper?
  Example direction:
  - `namedQuery('backfill-users', sql\`...\`)`
- Should query identity become part of error messages / debug output too?
  Probably yes, if that falls out naturally from the same metadata plumbing.

## Non-Goals

- not a full observability subsystem inside `sqlfu`
- not vendor-specific hard-coding for Honeycomb / Sentry / PostHog in the core package
- not SQL parsing just to manufacture names we already have from filenames
- not preserving legacy unnamed-query ergonomics at the cost of a muddy design

## Acceptance Bar

This task is done when:

- generated queries have stable runtime identity
- instrumentation can observe that identity without monkey-patching adapters
- there is a documented OTel mapping that uses standard DB attrs plus `sqlfu.*` attrs
- users can reliably answer operational questions in terms of query names, not only raw SQL text

## References

- Charity Majors, query naming / named-query observability post that motivated this task
- OpenTelemetry SQL DB semantic conventions:
  - https://opentelemetry.io/docs/specs/semconv/db/sql/

## Implementation Notes

- Current repo evidence that this should be straightforward:
  - typegen already knows `id`, `sqlFile`, and `functionName`
  - the runtime catalog already serializes those fields
  - the UI already relies on `queryId` as the durable handle
- Current gap:
  - generated wrappers still reduce everything to `{ sql, args }` right before execution
- Strong default assumption for implementation:
  - the main work should happen at typegen and core client boundary, not by trying to recover names afterward from trace processors
