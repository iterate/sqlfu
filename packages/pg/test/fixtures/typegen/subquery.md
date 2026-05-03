# Typegen fixture: scalar subqueries

Lifted in spirit from `pgkit/packages/typegen/test/subquery.test.ts`.

Tests that scalar subqueries pull a column type out (LIMIT 1 returning a
single value, COUNT(*) producing a not-null bigint).

## subqueries

<details>
<summary>input</summary>

```sql (definitions.sql)
create table test_table1 (
  a int not null,
  b double precision
);
```

```sql (sql/scalar-subquery.sql)
select test_table1.b, (select a from test_table1 where a > 1 limit 1) as aa from test_table1
```

```sql (sql/count-subquery.sql)
select test_table1.b, (select count(*) from test_table1) as num from test_table1
```

</details>

<details>
<summary>output</summary>

```json (analyses/count-subquery.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "b",
      "tsType": "number",
      "notNull": false
    },
    {
      "name": "num",
      "tsType": "bigint",
      "notNull": true
    }
  ],
  "parameters": []
}
```

```json (analyses/scalar-subquery.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "b",
      "tsType": "number",
      "notNull": false
    },
    {
      "name": "aa",
      "tsType": "number",
      "notNull": true
    }
  ],
  "parameters": []
}
```

</details>
