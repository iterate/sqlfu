# Runtime validation with zod

Generated wrappers can be emitted with [zod](https://zod.dev) as the source of truth. Params are validated on the way in, rows are validated on the way out, and types are derived via `z.infer`. One definition per thing, no drift.

This is an opt-in mode. By default, `sqlfu generate` emits plain TypeScript types with zero runtime validation.

## Why runtime validation at the wrapper boundary

The generator has always made SQL → TypeScript a compile-time guarantee. Runtime validation closes the loop:

- **Bad params fail loudly at the callsite.** Mistyped booleans, missing string args, enum typos throw a readable `ZodError` before the SQL driver sees them.
- **Schema drift surfaces at the adapter boundary.** A column removed without regenerating, a newly-non-null field, a new enum variant — these become exceptions at the boundary, not silently-wrong objects reaching a React component.

The zod schemas are used by the generated wrapper itself, not just re-exported for consumers. That's the value-add over plain TS types — every query gets a validated request/response contract by default. The exported schemas are also usable for forms (`@rjsf`, react-hook-form), tRPC inputs, RPC wire validation, fixtures, etc. — but that's a secondary benefit.

## Turning it on

```ts
// sqlfu.config.ts
export default {
  db: './db/app.sqlite',
  migrations: './migrations',
  definitions: './definitions.sql',
  queries: './sql',
  generate: {
    zod: true,
  },
};
```

`generate.zod` is a scalar boolean. Future generator flags compose next to it under `generate` — the top level stays narrow.

After toggling, re-run `sqlfu generate`. `zod` itself is already a runtime dependency of `sqlfu`, no extra install.

## What the generated file looks like

For a query `sql/find-post-by-slug.sql`:

```sql
select id, slug, title, status from posts where slug = :slug limit 1;
```

With `generate.zod: true` you get:

```ts
// sql/.generated/find-post-by-slug.sql.ts  (generated - do not edit)
import {z} from 'zod';
import type {Client, SqlQuery} from 'sqlfu';

const Params = z.object({
  slug: z.string(),
});
const Result = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string().nullable(),
  status: z.enum(['draft', 'published']),
});
const sql = `
select id, slug, title, status from posts where slug = ? limit 1;
`;

export const findPostBySlug = Object.assign(
  async function findPostBySlug(
    client: Client,
    params: z.infer<typeof Params>,
  ): Promise<z.infer<typeof Result> | null> {
    const validatedParams = Params.parse(params);
    const query: SqlQuery = {sql, args: [validatedParams.slug], name: 'find-post-by-slug'};
    const rows = await client.all(query);
    return rows.length > 0 ? Result.parse(rows[0]) : null;
  },
  {Params, Result, sql},
);

export namespace findPostBySlug {
  export type Params = z.infer<typeof findPostBySlug.Params>;
  export type Result = z.infer<typeof findPostBySlug.Result>;
}
```

## One identifier per query

The function name (camelCase, matching the SQL filename) is the identifier for everything related to the query:

```ts
import {findPostBySlug} from './sql/.generated/find-post-by-slug.sql.js';

// Call it.
const post = await findPostBySlug(client, {slug: 'hello'});
//    ^? findPostBySlug.Result | null

// Inferred types.
type P = findPostBySlug.Params; // { slug: string }
type R = findPostBySlug.Result; // { id: number; slug: string; title: string | null; status: 'draft' | 'published' }

// Runtime schemas (for forms, RPC, fixtures, etc.).
const schema = findPostBySlug.Params; // z.ZodObject<...>
const result = findPostBySlug.Result; // z.ZodObject<...>

// The raw SQL text.
const queryText = findPostBySlug.sql;
```

Namespace merging is what makes `findPostBySlug.Params` resolve as a value (the zod schema) *and* a type (`z.infer<...>`). Consumers of the library don't have to think about this — they just write `findPostBySlug.Params` in either position.

For queries with `update` semantics, the shape is `findPostBySlug.Data` + `findPostBySlug.Params` + `findPostBySlug.Result`, matching the plain-TS output.

## Error behavior

Validation uses `.parse()`, which throws a `ZodError` on invalid input. Callers who want recovery can call the schemas directly:

```ts
const parsed = findPostBySlug.Params.safeParse(userInput);
if (!parsed.success) {
  // handle parsed.error
  return;
}
await findPostBySlug(client, parsed.data);
```

The wrapper throwing by default is intentional — this is generated code and the right default is to fail loudly at the boundary.

## Not emitting zod

If `generate.zod` is unset or `false`, the generator emits the plain TS output (no `zod` import, no `.parse()` calls, types declared directly). No hybrid mode — a project picks one.

## Extending the generated shape

The generated file is readable and small. If you want a *specific* validator (e.g. `.url()`, `.email()`, custom refinements) for a column, the honest answer today is to wrap the generated function in your application code:

```ts
import {findPostBySlug as rawFindPostBySlug} from './sql/.generated/find-post-by-slug.sql.js';
import {z} from 'zod';

const RichParams = rawFindPostBySlug.Params.extend({
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export async function findPostBySlug(client: Client, params: z.infer<typeof RichParams>) {
  return rawFindPostBySlug(client, RichParams.parse(params));
}
```

The generated schemas will never be richer than what a SQL type system can tell us. Column-level refinement is an application concern.
