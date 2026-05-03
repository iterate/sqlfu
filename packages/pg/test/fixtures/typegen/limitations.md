# Typegen fixture: limitations

Lifted in spirit from `pgkit/packages/typegen/test/limitations.test.ts`.

Documents what the analyzer rejects (or analyzes as no-op):

- DDL statements aren't queries — analyzer should return ok:false.
- Multiple statements (semicolon-separated) reject.
- DML without RETURNING produces an empty column list.

## ddl-rejected

<details>
<summary>input</summary>

```sql (definitions.sql)
create table test_table (
  id int primary key,
  n int
);
```

```sql (sql/ddl.sql)
create table x (y int)
```

</details>

<details>
<summary>output</summary>

```json (analyses/ddl.json)
{
  "ok": false,
  "error": "syntax error at or near \"create\"\n  caused by: syntax error at or near \"create\""
}
```

</details>

## dml-without-returning

<details>
<summary>input</summary>

```sql (definitions.sql)
create table test_table (
  id int primary key,
  n int
);
```

```sql (sql/insert-no-returning.sql)
insert into test_table (id, n) values ($1, $2)
```

```sql (sql/update-no-returning.sql)
update test_table set n = $1 where id = $2
```

```sql (sql/delete-no-returning.sql)
delete from test_table where id = $1
```

</details>

<details>
<summary>output</summary>

```json (analyses/delete-no-returning.json)
{
  "ok": true,
  "queryType": "Delete",
  "columns": [],
  "parameters": [
    {
      "name": "$1",
      "tsType": "number",
      "notNull": false
    }
  ]
}
```

```json (analyses/insert-no-returning.json)
{
  "ok": true,
  "queryType": "Insert",
  "columns": [],
  "parameters": [
    {
      "name": "$1",
      "tsType": "number",
      "notNull": false
    },
    {
      "name": "$2",
      "tsType": "number",
      "notNull": false
    }
  ]
}
```

```json (analyses/update-no-returning.json)
{
  "ok": true,
  "queryType": "Update",
  "columns": [],
  "parameters": [
    {
      "name": "$1",
      "tsType": "number",
      "notNull": false
    },
    {
      "name": "$2",
      "tsType": "number",
      "notNull": false
    }
  ]
}
```

</details>

## duplicate-column-names

<details>
<summary>input</summary>

```sql (definitions.sql)
-- no schema needed
```

```sql (sql/dupes.sql)
select 1 as a, 'two' as a
```

</details>

<details>
<summary>output</summary>

```json (analyses/dupes.json)
{
  "ok": true,
  "queryType": "Select",
  "columns": [],
  "parameters": []
}
```

</details>
