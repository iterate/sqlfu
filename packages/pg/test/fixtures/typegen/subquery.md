# Typegen fixture: scalar subqueries

Lifted in spirit from `pgkit/packages/typegen/test/subquery.test.ts`.

Tests that scalar subqueries (`(select … limit 1)`, `(select count(*) …)`)
pull a single column type out into the parent SELECT.

```sql definitions
create table test_table1 (
  a int not null,
  b double precision
);
```

## scalar-subquery

```sql
select test_table1.b, (select a from test_table1 where a > 1 limit 1) as aa from test_table1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: b, tsType: number, notNull: false}
  - {name: aa, tsType: number, notNull: true}
parameters: []
```

## count-subquery

```sql
select test_table1.b, (select count(*) from test_table1) as num from test_table1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: b, tsType: number, notNull: false}
  - {name: num, tsType: bigint, notNull: true}
parameters: []
```
