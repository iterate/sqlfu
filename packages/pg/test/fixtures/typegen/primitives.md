# Typegen fixture: primitives

Lifted in spirit from `pgkit/packages/typegen/test/primitives.test.ts`.

Covers: literal type inference (`select 1 as a`), aggregate-result nullability
(`sum()` returns `bigint | null`), built-in function inference, and
arithmetic/concat operator nullability.

> **Known gap:** Our analyzer relies on the in-pg
> `analyze_select_statement_columns` function (vendored from pgkit/typegen),
> which uses `pg_get_viewdef` to read the column-source map. For queries
> without a `FROM <table>`, that map is empty — so literal-only queries
> (`select 1 as a`) currently produce `columns: []`. Pgkit's typegen handles
> this via psql's `\gdesc`; we don't have an equivalent yet. The snapshot
> below records the current behaviour so we'll see when this changes.

## primitives

<details>
<summary>input</summary>

```sql (definitions.sql)
create table test_table (
  a int not null,
  b int
);
```

```sql (sql/literal-int.sql)
select 1 as a
```

```sql (sql/literal-text.sql)
select 'a' as a
```

```sql (sql/null-cast.sql)
select null::integer as b
```

```sql (sql/sum-of-not-null.sql)
select sum(a) from test_table
```

```sql (sql/sum-of-nullable.sql)
select sum(b) from test_table
```

```sql (sql/concat-literals.sql)
select 'foo' || 'bar' as result
```

```sql (sql/concat-with-null.sql)
select 'foo' || null as result
```

```sql (sql/comparison-of-column.sql)
select a > 1 as result from test_table
```

```sql (sql/comparison-of-literals.sql)
select 2 > 1 as a
```

</details>

<details>
<summary>output</summary>

```json (analyses/comparison-of-column.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/comparison-of-literals.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/concat-literals.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/concat-with-null.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/literal-int.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/literal-text.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/null-cast.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

```json (analyses/sum-of-not-null.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "sum",
      "tsType": "bigint",
      "notNull": false
    }
  ],
  "parameters": []
}
```

```json (analyses/sum-of-nullable.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "sum",
      "tsType": "bigint",
      "notNull": false
    }
  ],
  "parameters": []
}
```

</details>
