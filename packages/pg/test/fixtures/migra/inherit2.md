# Migra fixture: inherit2

Lifted from `pgkit/packages/migra/test/fixtures/inherit2/`.

## inherit2

<details>
<summary>input</summary>

```sql (a.sql)
create table timestamp_base (created_at timestamp default now(), e integer);

create table a (a1 integer, a2 integer) inherits (timestamp_base);
```

```sql (b.sql)
create table timestamp_base (created_at timestamp default now());

create table a (a1 integer, a2 integer) inherits (timestamp_base);

alter table a drop column a2;

alter table a add column e integer;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
alter table "public"."timestamp_base" drop column "e";

alter table "public"."a" drop column "a2";

alter table "public"."a" add column "e" integer;
```

</details>
