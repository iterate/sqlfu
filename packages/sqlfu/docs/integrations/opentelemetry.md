# OpenTelemetry

Generated query wrappers carry their query name at runtime. `instrument.otel()`
puts that name on an OpenTelemetry span, along with the parameterized SQL text
and adapter system.

Use this page for the short setup. For the full hook model and recipes for
Sentry, PostHog, and Datadog, see [Observability](../observability.md).

## Setup

```ts
import {trace} from '@opentelemetry/api';
import {instrument} from 'sqlfu';

const tracer = trace.getTracer('my-service');
const client = instrument(baseClient, instrument.otel({tracer}));
```

Then call generated wrappers normally:

```ts
import {listPosts} from './sql/.generated/queries.sql.ts';

const posts = await listPosts(client, {limit: 20});
```

The query span includes:

- `db.query.summary`: the generated query name, for example `listPosts`;
- `db.query.text`: the SQL text with placeholders, not interpolated values;
- `db.system.name`: the adapter system, for example `sqlite`.

If the query throws, `instrument.otel()` records the exception and marks the
span as an error.

## Exporter choice

`instrument.otel()` only needs a structurally-compatible tracer. It does not
depend on a specific exporter. Use the normal OpenTelemetry setup for your
runtime:

```ts
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
import {NodeTracerProvider, SimpleSpanProcessor} from '@opentelemetry/sdk-trace-node';

const provider = new NodeTracerProvider({
  spanProcessors: [
    new SimpleSpanProcessor(new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    })),
  ],
});

provider.register();
```

Any OTLP backend works here: an OpenTelemetry Collector, Honeycomb, Grafana
Tempo, New Relic, or Datadog's OTLP intake. The sqlfu wiring stays the same;
only exporter URL and headers change.

## Ad-hoc SQL

Generated wrappers are named automatically. Ad-hoc SQL has no generated name,
but you can pass one yourself:

```ts
await client.all({
  sql: 'select count(*) as count from posts',
  args: [],
  name: 'countPosts',
});
```

That `name` becomes `db.query.summary` on the span.
