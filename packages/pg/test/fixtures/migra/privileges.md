# Migra fixture: privileges

Lifted from `pgkit/packages/migra/test/fixtures/privileges/`.

## privileges

<details data-skip="grant/revoke target is the superuser 'postgres' — postgres does not record ACL entries for superusers, so the diff is inherently empty when both sides connect as the same superuser. Would need a dedicated non-superuser test role to exercise.">
<summary>input</summary>

```sql (a.sql)
create extension pg_trgm;

create schema any_schema;

CREATE TYPE any_enum AS ENUM ('value1', 'value2');

CREATE TABLE any_table (
    id serial primary key,
    name text not null
);

create unique index on any_table(name);

create view any_view as select * from any_table;

create view any_other_view as select * from any_table;

create or replace function any_function(i integer, t text[])
returns TABLE(a text, c integer) as
$$
 declare
        BEGIN
                select 'no', 1;
        END;

$$
LANGUAGE PLPGSQL STABLE returns null on null input security definer;


grant select, insert on table any_table to postgres;
```

```sql (b.sql)
create extension pg_trgm;

create schema any_schema;

CREATE TYPE any_enum AS ENUM ('value1', 'value2');

CREATE TABLE any_table (
    id serial primary key,
    name text not null
);

create unique index on any_table(name);

create view any_view as select * from any_table;

create or replace function any_function(i integer, t text[])
returns TABLE(a text, c integer) as
$$
 declare
        BEGIN
                select 'no', 1;
        END;

$$
LANGUAGE PLPGSQL STABLE returns null on null input security definer;


grant update, insert on table any_table to postgres;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
revoke select on table "public"."any_table" from "postgres";

drop view if exists "public"."any_other_view";

grant update on table "public"."any_table" to "postgres";
```

</details>
