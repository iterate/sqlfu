# Typegen fixture: limitations

Lifted in spirit from `pgkit/packages/typegen/test/limitations.test.ts`.

Documents what the analyzer rejects (or analyzes as no-op):

- DDL statements aren't queries — `ok: false`.
- DML without RETURNING produces an empty column list.
- Duplicate column names produce an empty column list (lossy).

```sql definitions
create table test_table (
  id int primary key,
  n int
);
```

## ddl-rejected

```sql
create table x (y int)
```

```yaml
ok: false
error: |-
  syntax error at or near "create"
    caused by: syntax error at or near "create"
```

## insert-without-returning

```sql
insert into test_table (id, n) values ($1, $2)
```

```yaml
ok: true
queryType: Insert
columns: []
parameters:
  - {name: $1, tsType: number, notNull: false}
  - {name: $2, tsType: number, notNull: false}
```

## update-without-returning

```sql
update test_table set n = $1 where id = $2
```

```yaml
ok: true
queryType: Update
columns: []
parameters:
  - {name: $1, tsType: number, notNull: false}
  - {name: $2, tsType: number, notNull: false}
```

## delete-without-returning

```sql
delete from test_table where id = $1
```

```yaml
ok: true
queryType: Delete
columns: []
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## duplicate-column-names

```sql
select 1 as a, 'two' as a
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```
