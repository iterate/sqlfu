# Typegen fixture: DML with RETURNING

Lifted in spirit from `pgkit/packages/typegen/test/deletes.test.ts`.

Tests that INSERT/UPDATE/DELETE+RETURNING flow through the AST→SELECT
rewrite and produce column types matching the underlying table (with
PRIMARY KEY/NOT NULL informing nullability).

```sql definitions
create table posts (
  id integer primary key,
  title text not null,
  draft boolean
);
create table test_table1 (
  a int primary key,
  b int
);
create table accounts (
  id int primary key,
  balance int not null
);
```

## insert-returning

```sql
insert into posts (title) values ($1) returning id, title, draft
```

```yaml
ok: true
queryType: Insert
returning: true
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: title, tsType: string, notNull: true}
  - {name: draft, tsType: boolean, notNull: false}
parameters:
  - {name: $1, tsType: string, notNull: true}
```

## delete-returning

```sql
delete from test_table1 where a = $1 returning a, b
```

```yaml
ok: true
queryType: Delete
returning: true
multipleRowsResult: false
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: false}
parameters:
  - {name: $1, tsType: number, notNull: true}
```

## update-returning

```sql
update accounts set balance = balance + $1 where id = $2 returning id, balance
```

```yaml
ok: true
queryType: Update
returning: true
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: balance, tsType: number, notNull: true}
parameters:
  - {name: $2, tsType: number, notNull: true}
data:
  - {name: $1, tsType: number, notNull: true}
```

## with-insert-returning

A `with` clause in front of the insert doesn't change which params can be null.

```sql
with next_post as (select coalesce(max(id), 0) + 1 as id from posts)
insert into posts (id, title, draft) values ((select id from next_post), $1, $2) returning id
```

```yaml
ok: true
queryType: Insert
returning: true
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: string, notNull: true}
  - {name: $2, tsType: boolean, notNull: false}
```

## with-update-returning

A `with` clause in front of the update still sends SET values as `data`.

```sql
with drafts as (select id from posts where draft)
update posts set title = $1 where id in (select id from drafts) returning id, title
```

```yaml
ok: true
queryType: Update
returning: true
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: title, tsType: string, notNull: true}
parameters: []
data:
  - {name: $1, tsType: string, notNull: true}
```
