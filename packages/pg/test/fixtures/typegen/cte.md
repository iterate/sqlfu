# Typegen fixture: CTEs

Lifted in spirit from `pgkit/packages/typegen/test/cte.test.ts`.

Covers `WITH … SELECT` (basic CTE), CTEs containing aggregates, and
aliasing inside CTEs.

```sql definitions
create table test_table1 (a int not null);
create table test_table2 (b double precision);
create table test_table3 (
  t text,
  t_nn text not null,
  n int
);
```

## no-cte-baseline

```sql
select * from test_table1 t1 join test_table2 t2 on t1.a = t2.b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: false}
parameters: []
```

## simple-cte

```sql
with abc as (select a as aaa from test_table1),
     def as (select b as bbb from test_table2)
select aaa, bbb from abc join def on abc.aaa = def.bbb
```

```yaml
ok: true
queryType: Select
columns:
  - {name: aaa, tsType: number, notNull: true}
  - {name: bbb, tsType: number, notNull: false}
parameters: []
```

## cte-with-aggregate

```sql
with abc as (select count(*) c from test_table1)
select c as table_size from abc
```

```yaml
ok: true
queryType: Select
columns:
  - {name: table_size, tsType: bigint, notNull: true}
parameters: []
```

## cte-aliasing

```sql
select t as t_aliased1, t_nn as t_nn_aliased
  from test_table3 as tt1
  where t_nn in (select t_nn as t_aliased2 from test_table3 as tt2 where n = 1)
```

```yaml
ok: true
queryType: Select
columns:
  - {name: t_aliased1, tsType: string, notNull: false}
  - {name: t_nn_aliased, tsType: string, notNull: true}
parameters: []
```
