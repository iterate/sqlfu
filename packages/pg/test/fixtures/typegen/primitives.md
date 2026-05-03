# Typegen fixture: primitives

Lifted in spirit from `pgkit/packages/typegen/test/primitives.test.ts`.

Covers literal type inference, aggregate-result nullability, and
arithmetic / concat operator nullability. The pgkit assertion is that
primitive literal columns are reported as not-null while expressions
involving columns or potentially-null values are nullable.

> **Known gap:** Our analyzer relies on the in-pg
> `analyze_select_statement_columns` function (vendored from pgkit/typegen),
> which uses `pg_get_viewdef` to read the column-source map. For queries
> without a `FROM <table>`, that map is empty — so literal-only queries
> (`select 1 as a`) currently produce `columns: []`. Pgkit's typegen
> handles this via psql's `\gdesc`; we don't have an equivalent yet.
> The snapshots below record the current behaviour so we'll see when
> this changes.

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
columns: []
parameters: []
```

## literal-text

```sql
select 'a' as a
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```

## null-cast

```sql
select null::integer as b
```

```yaml
ok: true
queryType: Select
columns: []
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
columns: []
parameters: []
```

## concat-with-null

```sql
select 'foo' || null as result
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```

## comparison-of-column

```sql
select a > 1 as result from test_table
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```

## comparison-of-literals

```sql
select 2 > 1 as a
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```
