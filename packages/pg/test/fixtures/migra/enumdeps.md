# Migra fixture: enumdeps

Lifted from `pgkit/packages/migra/test/fixtures/enumdeps/`.

## enumdeps

<details>
<summary>input</summary>

```sql (a.sql)
create type e as enum('a', 'b', 'c');

create table t(id integer primary key, category e);

create view v as select * from t;

create view v2 as select *, 'b'::e from t;
```

```sql (b.sql)
create type e as enum('a', 'b', 'c', 'd');

create table t(id integer primary key, category e);

create view v as select * from t;

create view v2 as select *, 'b'::e from t;

create table created_with_e(id integer, category e);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop view if exists "public"."v";
drop view if exists "public"."v2";
alter type "public"."e" rename to "e__old_version_to_be_dropped";
create type "public"."e" as enum ('a', 'b', 'c', 'd');
create table "public"."created_with_e" (
    "id" integer,
    "category" e
      );
alter table "public"."t" alter column category type "public"."e" using category::text::"public"."e";
drop type "public"."e__old_version_to_be_dropped";
create or replace view "public"."v" as  SELECT id,
    category
   FROM t;
create or replace view "public"."v2" as  SELECT id,
    category,
    'b'::e AS e
   FROM t;
```

</details>
