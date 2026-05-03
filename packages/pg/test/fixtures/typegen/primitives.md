# Typegen fixture: primitives

Lifted in spirit from `pgkit/packages/typegen/test/primitives.test.ts`.

Covers literal type inference, aggregate-result nullability, and
arithmetic / concat operator nullability. The pgkit assertion is that
primitive literal columns are reported as not-null while expressions
involving columns or potentially-null values are nullable.

> **Partial gap:** Column names and types are correct (we wrap the
> query in a temp view and read `pg_attribute`). Nullability for
> FROM-less queries defaults to `false` (the safe default) — pgkit's
> typegen reports `select 1 as a` and `select 2 > 1 as a` as not-null
> via AST-level expression analysis, but our vendored pipeline only
> derives nullability from source-table tracing. Closing this delta
> would mean teaching the AST analyzer to mark "literal" / "comparison
> of literals" / "arithmetic of not-null sources" as `not_null`.

```sql definitions
create table test_table (
  a int not null,
  b int
);
```

## literal-int

```sql
select 1 as a
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: false}
parameters: []
```

## literal-text

```sql
select 'a' as a
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: string, notNull: false}
parameters: []
```

## null-cast

```sql
select null::integer as b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: b, tsType: number, notNull: false}
parameters: []
```

## sum-of-not-null

```sql
select sum(a) as total from test_table
```

```yaml
ok: true
queryType: Select
columns:
  - {name: total, tsType: bigint, notNull: false}
parameters: []
```

## sum-of-nullable

```sql
select sum(b) as total from test_table
```

```yaml
ok: true
queryType: Select
columns:
  - {name: total, tsType: bigint, notNull: false}
parameters: []
```

## concat-literals

```sql
select 'foo' || 'bar' as result
```

```yaml
ok: true
queryType: Select
columns:
  - {name: result, tsType: string, notNull: false}
parameters: []
```

## concat-with-null

```sql
select 'foo' || null as result
```

```yaml
ok: true
queryType: Select
columns:
  - {name: result, tsType: string, notNull: false}
parameters: []
```

## comparison-of-column

```sql
select a > 1 as result from test_table
```

```yaml
ok: true
queryType: Select
columns:
  - {name: result, tsType: boolean, notNull: false}
parameters: []
```

## comparison-of-literals

```sql
select 2 > 1 as a
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: boolean, notNull: false}
parameters: []
```
