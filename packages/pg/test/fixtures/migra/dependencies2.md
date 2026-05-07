# Migra fixture: dependencies2

Lifted from `pgkit/packages/migra/test/fixtures/dependencies2/`.

## dependencies2

<details>
<summary>input</summary>

```sql (a.sql)
create schema x;

create table x.data(id uuid, name text);

create view x.q as select * from x.data;
```

```sql (b.sql)
create schema x;

create table x.t_data(id uuid, name text);

create view x.data as select * from x.t_data;

create view x.q as select * from x.data;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop view if exists "x"."q";
drop table "x"."data";
create table "x"."t_data" (
    "id" uuid,
    "name" text
      );
create or replace view "x"."data" as  SELECT id,
    name
   FROM x.t_data;
create or replace view "x"."q" as  SELECT id,
    name
   FROM x.data;
```

</details>
