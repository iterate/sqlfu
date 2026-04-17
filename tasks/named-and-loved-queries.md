status: ready
size: medium

# Named And Loved Queries

## Status Summary

- Mostly clear now: the first implementation should be very small.
- Main completed pieces:
  - `sql/*.sql` already gives queries stable names
  - typegen already knows the filename-derived id
  - generated queries already centralize execution through wrappers
- Main missing pieces:
  - generated wrappers drop the name before runtime
  - there is no runtime field for query name
  - there is no proof that the name shows up in real OTel spans end to end

## Goal

Make generated queries carry exactly one extra piece of observability metadata:

- `db.query.name`

Definition:

- `sql/list-profiles.sql` -> `list-profiles`

That is the entire concept for the first implementation.

Do not add:

- inferred query operation names
- camel-cased variants
- function-name metadata
- extra filename-derived aliases
- a wider query taxonomy

If this works, we can add more later. For now the point is just:

- checked-in SQL files already have good names
- those names should survive to runtime
- OTel spans should expose them

## Current Codebase Reality

- `packages/sqlfu/src/typegen/index.ts`
  - typegen already knows the filename without extension
  - generated wrappers currently emit `const query: SqlQuery = { sql, args }`
  - this is the point where the name is currently lost
- `packages/sqlfu/src/typegen/query-catalog.ts`
  - the runtime catalog already stores `id`, which is effectively the same value we want for `db.query.name`
- `packages/sqlfu/src/core/types.ts`
  - `SqlQuery` is currently just `{ sql, args }`
- adapters currently ignore everything except `sql` and `args`

So the implementation should be mostly:

- add a single optional field to the runtime query shape
- have typegen populate it for generated queries
- preserve it through execution
- expose it to instrumentation

## Attribute Choice

Initial implementation target:

- `db.query.name = "<filename without .sql>"`

Example:

- `sql/list-profiles.sql` -> `db.query.name = "list-profiles"`

Important note:

- this appears to be a custom attribute, not a current standard OTel SQL semantic-convention field
- current OTel SQL semconv documents `db.query.summary`, `db.query.text`, and `db.operation.name`, but not `db.query.name`

That is fine for now.

This task should still build around `db.query.name`, because that is the actual contract we want `sqlfu` to own.

If we later want interoperability polish, we can decide whether to also mirror the same value into `db.query.summary`.

Not for the first pass.

## Design Direction

Keep it boring.

- extend `SqlQuery` with optional `dbQueryName?: string`
  (runtime field name matches the OTel attribute name exactly, so instrumentation reads `query.dbQueryName` and emits `db.query.name`)
- generated wrappers should set it from the filename without extension
- ad hoc SQL should keep working and simply omit it
- add one official hook point around query execution so instrumentation can read it

The runtime should not try to infer names from SQL text.

Only generated queries from checked-in files get the name automatically.

### Assumptions (AFK — recorded before coding)

These are the concrete choices made while the user is away. If they're wrong, this commit should be reverted and the task re-specced.

1. **Field name is `dbQueryName`** (not `queryName` or `name`). Matches the wire attribute `db.query.name` directly so instrumentation is a one-liner. Still optional on `SqlQuery`.

2. **Hook surface shape**: a new exported `instrumentClient(client, hook)` in `packages/sqlfu/src/core/instrument.ts` that wraps a `Client` and returns a `Client` of the same shape. The hook is a single "around" function:

   ```ts
   export interface QueryExecutionContext {
     readonly query: SqlQuery;
     readonly operation: 'all' | 'run' | 'iterate';
   }
   export type QueryExecutionHook = <TResult>(
     context: QueryExecutionContext,
     execute: () => TResult,
   ) => TResult;
   ```

   An around-function is the natural shape for OTel's `tracer.startActiveSpan(name, fn)`. It's transparent to sync vs async because `TResult` can be `T | Promise<T>`.

   `run` and `all` are wrapped. `iterate` is wrapped lazily (span starts on first pull). `raw` is not instrumented (intentionally — it has no name anyway). `transaction` is not instrumented in this first pass.

3. **Where the hook module lives**: `packages/sqlfu/src/core/instrument.ts`, re-exported from `src/client.ts` so both `import { instrumentClient } from 'sqlfu'` and `import { instrumentClient } from 'sqlfu/client'` work.

4. **OTel integration module**: not adding a dedicated `sqlfu/otel` subpath in this first pass. The end-to-end test builds the hook inline using the plain OTel JS API (a few lines). If the pattern looks right, we can fold a helper into the library in a follow-up.

5. **End-to-end test location**: `packages/sqlfu/test/otel-tracing.test.ts`. Uses:
   - `hono` + `@hono/node-server` for the real server
   - `@opentelemetry/sdk-node`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/instrumentation-http`
   - A local `http.createServer` that collects `POST /v1/traces` payloads
   - `node:sqlite` for the real DB
   - Generates a query wrapper on disk via the existing fixture pattern, then imports it
   - Installed as devDependencies of `packages/sqlfu`

6. **Snapshot format**: normalized text tree. Minimal, human-skimmable:

   ```
   GET /profiles
     sqlfu.list-profiles  (db.query.name=list-profiles)
   ```

   Stripped: timestamps, trace ids, span ids, durations, sdk metadata. Order of sibling spans is sorted by start time then name for stability.

7. **Ad-hoc SQL test**: asserted in the same file — a second route uses `client.sql\`select 1 as x\`` and the snapshot shows no `db.query.name` attribute on that span.

8. **What is NOT done in this pass**: no camelCase alias, no `db.query.summary` mirror, no `db.operation.name`, no `db.system.name`, no typegen emitting `sqlFile` into the wrapper, no changes to the query catalog. Those can follow once the mechanism is proven.

## Checklist

- [ ] Add a single runtime field for the query name.
  Keep it optional so raw ad hoc SQL remains simple.
- [ ] Make typegen populate the field for generated queries.
  Source of truth: filename without `.sql`.
- [ ] Preserve that field through client and adapter execution without changing behavior.
- [ ] Add one official query-execution hook or callback surface.
  It only needs enough data to emit telemetry cleanly.
- [ ] Emit `db.query.name` from that hook in the reference OTel integration.
- [ ] Do not add extra filename-derived metadata in this first implementation.
- [ ] Prove the feature with a real OTel end-to-end test, not just a unit test.

## Testing / Proof Plan

This should be proved with a small but real end-to-end fixture, not by asserting on hand-built fake span objects.

### Sanity Check

The proposed shape mostly makes sense, with one adjustment:

- a fully functional Hono backend is a good fixture
- sending telemetry through real OTel SDK/export code is a good idea
- catching OTLP requests in a local test server is realistic
- spinning up a full trace UI for CI snapshots is probably too heavy for the first pass

Recommended replacement for "visualise traces in CI":

- render the exported spans into a small normalized trace tree string
- inline-snapshot that string

That gives the same review value with much less moving parts.

Example shape:

```text
trace:
  GET /profiles
    sql query
      db.query.name=list-profiles
```

The exact names do not matter yet. The point is to snapshot the hierarchy and key attrs in a stable human-readable way.

### Fixture Shape

Create a test fixture that runs:

- a real Hono app on Node.js
- with `@hono/node-server`
- with a real `sqlfu` generated query loaded from `sql/*.sql`
- with OpenTelemetry Node SDK enabled
- with OTel HTTP instrumentation enabled for the inbound request
- with `sqlfu` creating a child DB span or equivalent span event through its instrumentation hook
- with the trace exporter pointing at a local test OTLP receiver

Why this is reasonable:

- Hono has an official Node server path via `@hono/node-server`
- Hono also has a testing helper, but for this task a real HTTP server is better because we want actual OTel HTTP spans, not just handler invocation
- OpenTelemetry JS officially supports Node SDK setup, HTTP instrumentation, and OTLP HTTP export

### Export Path

Use the real OTel HTTP/JSON trace exporter in tests:

- `@opentelemetry/exporter-trace-otlp-http`

Point it at a tiny local HTTP server in the test process that receives:

- `POST /v1/traces`

Why this is a good fit:

- the JS exporter supports OTLP over `http/json`
- a local HTTP server can capture the actual exported payload
- snapshotting normalized OTLP JSON is much more realistic than asserting on made-up span structures

### Suggested Test Layers

1. Small plumbing test

- generate a query from `sql/list-profiles.sql`
- assert the generated wrapper includes the query name field

2. Runtime integration test

- execute the generated query against a real sqlite db
- assert the query-execution hook receives `db.query.name = "list-profiles"`

3. OTel end-to-end spec

- start a real Hono server
- install OTel Node SDK and HTTP instrumentation
- configure OTLP HTTP/JSON exporter to send to a local test receiver
- make one real HTTP request to the Hono route
- wait for spans to flush
- normalize the received trace payload
- inline-snapshot the normalized trace tree

### What To Snapshot

Snapshot only stable fields.

Keep:

- span hierarchy
- span name
- selected attributes:
  - `db.query.name`
  - route name / http method if useful
  - error markers when testing failure cases

Strip:

- timestamps
- trace ids
- span ids
- durations unless we round aggressively
- resource noise
- sdk version noise

### Useful Fixture Cases

- happy path request runs one named query
- failing query still emits `db.query.name`
- ad hoc SQL emits no `db.query.name`
- two different generated queries produce distinct names

### Tooling Notes

Useful tools confirmed by docs:

- Hono Node server:
  - https://hono.dev/docs/getting-started/nodejs
- Hono testing helper:
  - https://hono.dev/docs/helpers/testing
- OpenTelemetry JS Node SDK:
  - https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
- OpenTelemetry JS HTTP instrumentation:
  - https://open-telemetry.github.io/opentelemetry-js/modules/_opentelemetry_instrumentation-http.html
- OpenTelemetry JS OTLP HTTP/JSON exporter:
  - https://open-telemetry.github.io/opentelemetry-js/modules/_opentelemetry_exporter-trace-otlp-http.html
- OTLP protocol transport options:
  - https://opentelemetry.io/docs/specs/otel/protocol/exporter/

### Recommended Implementation Order

- start with writing a "normal" hono app in a test
- set it up as a sqlfu project, with some imaginary realistic tables
- add a couple of query files under `sql/*.sql`
- set the project up with otel using whatever the industry standard otel lib is in js/ts (research this)
- set up a local otel collector as necessary
- create an realistic product app api endpoint which exercises the db (ideally inside some larger span)
- set up sqlfu to write otel traces via some imaginary helper function that we'll eventually implement as part of the library api surface
- dump the otel trace(s) in some readable text format
- add a simple assertion that somewhere in that trace the name of the query that was exercised
- inline snapshot it too - may need to fudge timings etc.

After that we can take a look, but at that point it would be good to pause and validate the design is what we want it to be, and then suggest more tests including things like parameterised queries.

That order keeps the proof incremental and avoids debugging OTel before the core metadata flow exists.

## Acceptance Bar

This task is done when:

- generated queries automatically carry a name derived from the SQL filename
- that name reaches runtime execution unchanged
- the reference OTel path emits `db.query.name`
- there is an end-to-end test using a real Hono server and real OTel export that snapshots a normalized trace showing the named query

## References

- OpenTelemetry SQL DB semantic conventions:
  - https://opentelemetry.io/docs/specs/semconv/db/sql/
- OpenTelemetry JS Node getting started:
  - https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
- OpenTelemetry JS HTTP instrumentation:
  - https://open-telemetry.github.io/opentelemetry-js/modules/_opentelemetry_instrumentation-http.html
- OpenTelemetry JS OTLP HTTP/JSON exporter:
  - https://open-telemetry.github.io/opentelemetry-js/modules/_opentelemetry_exporter-trace-otlp-http.html
- OpenTelemetry protocol exporter transports:
  - https://opentelemetry.io/docs/specs/otel/protocol/exporter/
- Hono Node.js server:
  - https://hono.dev/docs/getting-started/nodejs
- Hono testing helper:
  - https://hono.dev/docs/helpers/testing

## Implementation Notes

- Current likely source of truth:
  - the query filename without extension
- Current likely implementation seam:
  - `renderQueryWrapper()` in `packages/sqlfu/src/typegen/index.ts`
- Current likely proof seam:
  - a new integration-style test under `packages/sqlfu/test/` that starts:
    - sqlite
    - hono
    - otel sdk
    - a local otlp receiver
