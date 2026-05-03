# Typegen fixture: views and SQL functions

Lifted in spirit from `pgkit/packages/typegen/test/view.test.ts`.

Tests that:

- A `select * from <view>` infers column nullability from the underlying
  view (which itself inherits from the joined source tables).
- Table-returning SQL functions surface their declared return columns.
- Scalar SQL functions can be called inline as expressions.

```sql definitions
create table test_table1 (a int not null);
create table test_table2 (b double precision);

create view test_view as
  select a as a_view, b as b_view
  from test_table1
  join test_table2 on test_table1.a = test_table2.b;

create or replace function get_test_table1_by_a(input_a int)
returns table (a int) as $$
  select a from test_table1 where a = input_a;
$$ language sql;

create or replace function get_one_field(input_a int)
returns int as $$
  select a as result from test_table1 where a >= input_a;
$$ language sql;
```

## select-from-view

```sql
select * from test_view
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a_view, tsType: number, notNull: true}
  - {name: b_view, tsType: number, notNull: false}
parameters: []
```

## select-from-table-function

```sql
select * from get_test_table1_by_a(1)
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
parameters: []
```

## scalar-function-call

```sql
select get_one_field(1) as z
```

```yaml
ok: true
queryType: Select
columns:
  - {name: z, tsType: number, notNull: false}
parameters: []
```
