# Typegen fixture: joins

Lifted in spirit from `pgkit/packages/typegen/test/left-join.test.ts`.

Covers join nullability propagation: `LEFT JOIN` makes the right-hand side
nullable; `FULL OUTER JOIN` makes both sides nullable; aliased forms produce
the same result.

## joins

<details>
<summary>input</summary>

```sql (definitions.sql)
create table table1 (a int not null);
create table table2 (b int not null);
```

```sql (sql/left-join.sql)
select a, b from table1 left join table2 on table1.a = table2.b
```

```sql (sql/left-join-aliased.sql)
select a, b from table1 t1 left join table2 t2 on t1.a = t2.b
```

```sql (sql/full-outer-join.sql)
select a, b from table1 full outer join table2 on table1.a = table2.b
```

```sql (sql/full-outer-join-aliased.sql)
select a, b from table1 t1 full outer join table2 t2 on t1.a = t2.b
```

```sql (sql/inner-join.sql)
select a, b from table1 inner join table2 on table1.a = table2.b
```

</details>

<details>
<summary>output</summary>

```json (analyses/full-outer-join-aliased.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "a",
      "tsType": "number",
      "notNull": false
    },
    {
      "name": "b",
      "tsType": "number",
      "notNull": false
    }
  ],
  "parameters": []
}
```

```json (analyses/full-outer-join.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [
    {
      "name": "a",
      "tsType": "number",
      "notNull": false
    },
    {
      "name": "b",
      "tsType": "number",
      "notNull": false
    }
  ],
  "parameters": []
}
```

```json (analyses/inner-join.json)
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

```json (analyses/left-join-aliased.json)
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
      "notNull": false
    }
  ],
  "parameters": []
}
```

```json (analyses/left-join.json)
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
      "notNull": false
    }
  ],
  "parameters": []
}
```

</details>
