# Typegen fixture: nullability hints from WHERE clauses

Lifted in spirit from `pgkit/packages/typegen/test/hand-holding.test.ts`.

A `WHERE col IS NOT NULL` (or strict comparison) on an otherwise-nullable
column should narrow the column type to non-null in the result. This is
the "hand-holding" feature pgkit provides via the AST analyzer.

```sql definitions
create table test_table1 (
  a int not null,
  b int
);
```

## where-is-not-null

```sql
select * from test_table1 t1 where b is not null and a > 1 and a != 10
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: true}
parameters: []
```

## where-comparison

```sql
select * from test_table1 t1 where b < 2 or b > 4
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: true}
parameters: []
```
