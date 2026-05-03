# Typegen fixture: DML with RETURNING

Lifted in spirit from `pgkit/packages/typegen/test/deletes.test.ts`.

Tests that INSERT/UPDATE/DELETE+RETURNING flow through the AST→SELECT
rewrite and produce column types matching the underlying table (with
PRIMARY KEY/NOT NULL informing nullability).

## insert-returning

<details>
<summary>input</summary>

```sql (definitions.sql)
create table posts (
  id integer primary key,
  title text not null,
  draft boolean
);
```

```sql (sql/insert-returning.sql)
insert into posts (title) values ($1) returning id, title, draft
```

</details>

<details>
<summary>output</summary>

```json (analyses/insert-returning.json)
{
  "ok": true,
  "queryType": "Insert",
  "columns": [
    {
      "name": "id",
      "tsType": "number",
      "notNull": true
    },
    {
      "name": "title",
      "tsType": "string",
      "notNull": true
    },
    {
      "name": "draft",
      "tsType": "boolean",
      "notNull": false
    }
  ],
  "parameters": [
    {
      "name": "$1",
      "tsType": "string",
      "notNull": false
    }
  ]
}
```

</details>

## delete-returning

<details>
<summary>input</summary>

```sql (definitions.sql)
create table test_table1 (
  a int primary key,
  b int
);
```

```sql (sql/delete-returning.sql)
delete from test_table1 where a = $1 returning a, b
```

</details>

<details>
<summary>output</summary>

```json (analyses/delete-returning.json)
{
  "ok": true,
  "queryType": "Delete",
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
  "parameters": [
    {
      "name": "$1",
      "tsType": "number",
      "notNull": false
    }
  ]
}
```

</details>

## update-returning

<details>
<summary>input</summary>

```sql (definitions.sql)
create table accounts (
  id int primary key,
  balance int not null
);
```

```sql (sql/update-returning.sql)
update accounts set balance = balance + $1 where id = $2 returning id, balance
```

</details>

<details>
<summary>output</summary>

```json (analyses/update-returning.json)
{
  "ok": true,
  "queryType": "Update",
  "columns": [
    {
      "name": "id",
      "tsType": "number",
      "notNull": true
    },
    {
      "name": "balance",
      "tsType": "number",
      "notNull": true
    }
  ],
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
