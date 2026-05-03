# Typegen fixture: joins

Lifted in spirit from `pgkit/packages/typegen/test/left-join.test.ts`.

Covers join nullability propagation: `LEFT JOIN` makes the right-hand
side nullable; `FULL OUTER JOIN` makes both sides nullable; `INNER JOIN`
preserves the source nullability; aliased forms produce the same result.

```sql definitions
create table table1 (a int not null);
create table table2 (b int not null);
```

## inner-join

```sql
select a, b from table1 inner join table2 on table1.a = table2.b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: true}
parameters: []
```

## left-join

```sql
select a, b from table1 left join table2 on table1.a = table2.b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: false}
parameters: []
```

## left-join-aliased

```sql
select a, b from table1 t1 left join table2 t2 on t1.a = t2.b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: false}
parameters: []
```

## full-outer-join

```sql
select a, b from table1 full outer join table2 on table1.a = table2.b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: false}
  - {name: b, tsType: number, notNull: false}
parameters: []
```

## full-outer-join-aliased

```sql
select a, b from table1 t1 full outer join table2 t2 on t1.a = t2.b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: false}
  - {name: b, tsType: number, notNull: false}
parameters: []
```
