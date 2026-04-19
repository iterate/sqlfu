# Errors

In sqlfu, you handle database errors by *kind*, not by string-matching the message.

Every error from a sqlfu adapter is a `SqlfuError` with a `.kind` discriminator that has been normalized across adapters. The driver's original error lives on `.cause`, untouched, for the cases where you need to inspect anything adapter-specific. The `.query` and `.system` fields carry enough context that you can write an error handler without plumbing a parallel `QueryExecutionContext`.

## The mental model

Most of the time, the code that cares about a database error doesn't care *which* SQLite driver threw it. "Unique constraint failed" is a product outcome — it should become a 409 or a "that email is taken" toast — and the surrounding code shouldn't need to know that better-sqlite3 says `SQLITE_CONSTRAINT_UNIQUE` while `node:sqlite` says `errcode: 2067` and `@libsql/client` wraps both in a `LibsqlError`.

`SqlfuError.kind` closes that gap. You branch on the discriminator, and sqlfu has already done the per-adapter mapping.

## The kinds

```ts
type SqlfuErrorKind =
  | 'syntax'
  | 'missing_relation'
  | 'missing_column'
  | 'constraint:unique'
  | 'constraint:primary_key'
  | 'constraint:foreign_key'
  | 'constraint:not_null'
  | 'constraint:check'
  | 'transient'     // SQLITE_BUSY, SQLITE_LOCKED
  | 'auth'          // SQLITE_AUTH; future pg adapters will map SQLSTATE 42501 here
  | 'unknown';
```

`missing_relation` and `missing_column` are split out from `syntax` even though SQLite itself rolls them into a generic `SQLITE_ERROR`. They are by far the most common errors when iterating on a schema, and "is this a typo in the table name?" deserves a better answer than "something somewhere was syntactically off".

## Shape

```ts
class SqlfuError extends Error {
  kind: SqlfuErrorKind;
  query: SqlQuery;    // the query that failed — includes its `name` if it has one
  system: string;     // e.g. 'sqlite'
  cause: unknown;     // the original driver error, preserved
}
```

The `.stack` is preserved from the driver's error. sqlfu doesn't rewrite it — driver stacks already include the user's call site, which is the most useful frame for debugging.

## Handling errors

```ts
import {SqlfuError} from 'sqlfu';

try {
  client.run(insertUser({email}));
} catch (error) {
  if (error instanceof SqlfuError && error.kind === 'constraint:unique') {
    return response.status(409).json({error: 'email already taken'});
  }
  throw error;
}
```

In an error reporter, the `.kind` becomes a natural bucketing dimension:

```ts
instrument.onError(({error}) => {
  if (error instanceof SqlfuError) {
    Sentry.captureException(error, {
      tags: {
        'db.error.kind': error.kind,
        'db.query.summary': error.query.name ?? 'sql',
      },
    });
  }
});
```

`kind:unknown` errors are worth watching in production — they are the cases the mapper didn't recognize. If a specific driver version emits a new error shape that should be mapped, open an issue or PR.

## Extending the mapping

For most users, the built-in mapping is enough. If you need to override it — for instance, your D1 deployment surfaces errors in a shape the default mapper doesn't recognize — every adapter factory accepts an optional `mapError` option:

```ts
const client = createD1Client(env.DB, {
  mapError(error, {query, system}) {
    if (typeof error === 'object' && error && 'isTransient' in error) {
      return new SqlfuError({kind: 'transient', query, system, cause: error});
    }
    return null; // fall back to default mapping
  },
});
```

Return `null` from `mapError` to fall through to the default. Users who need this are rare — the default helper handles every driver sqlfu ships an adapter for.

## Preserved `.cause` for adapter-specific inspection

```ts
catch (error) {
  if (error instanceof SqlfuError && error.kind === 'unknown') {
    // Inspect the raw driver error if you need to
    console.error('unrecognized DB error', error.cause);
  }
}
```

## Why not just rethrow the driver error?

Two reasons:

1. **Branching on `.kind` is stable across adapters.** `error.code === 'SQLITE_CONSTRAINT_UNIQUE'` works for better-sqlite3 but silently breaks when you move to `@libsql/client` (which reports the extended code under `.cause.code`) or `node:sqlite` (which uses a numeric `errcode`). `error.kind === 'constraint:unique'` works everywhere.
2. **The `.query` and `.system` fields let a single `instrument.onError` block do its job** without plumbing `QueryExecutionContext` through the error object or through global state. Error reporters are the main consumer of typed errors, and they need the context.
