# Typegen fixture: nullability hints from WHERE clauses

Lifted in spirit from `pgkit/packages/typegen/test/hand-holding.test.ts`.

A `WHERE col IS NOT NULL` (or strict comparison) on an otherwise-nullable
column should narrow the column type to non-null in the result. This is the
"hand-holding" feature pgkit provides via the AST analyzer.

## is-not-null-hint

<details>
<summary>input</summary>

```sql (definitions.sql)
create table test_table1 (
  a int not null,
  b int
);
```

```sql (sql/where-is-not-null.sql)
select * from test_table1 t1 where b is not null and a > 1 and a != 10
```

```sql (sql/where-comparison.sql)
select * from test_table1 t1 where b < 2 or b > 4
```

</details>

<details>
<summary>output</summary>

```json (analyses/where-comparison.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "a",
      "tsType": "number",
      "notNull": true
    },
    {
      "name": "b",
      "tsType": "number",
      "notNull": true
    }
  ],
  "parameters": []
}
```

```json (analyses/where-is-not-null.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "a",
      "tsType": "number",
      "notNull": true
    },
    {
      "name": "b",
      "tsType": "number",
      "notNull": true
    }
  ],
  "parameters": []
}
```

</details>
