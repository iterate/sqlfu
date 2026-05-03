# Migra fixture: enumdefaults

Lifted from `pgkit/packages/migra/test/fixtures/enumdefaults/`.

## enumdefaults

<details>
<summary>input</summary>

```sql (a.sql)
create type order_status as enum('pending', 'processing', 'complete');

create schema other;

create type other.otherenum1 as enum('a', 'b', 'c');

create type other.otherenum2 as enum('a', 'b', 'c');

create table orders(
  id serial primary key,
  status order_status default 'pending'::order_status,
  othercolumn other.otherenum1
);

```

```sql (b.sql)
create type order_status as enum('pending', 'processing', 'complete', 'rejected');

create schema other;

create type other.otherenum1 as enum('a', 'b', 'c');

create type other.otherenum2 as enum('a', 'b', 'c');

create table orders(
  id serial primary key,
  status order_status default 'pending'::order_status,
  othercolumn other.otherenum2
);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
alter table "public"."orders" alter column "status" drop default;

alter type "public"."order_status" rename to "order_status__old_version_to_be_dropped";

create type "public"."order_status" as enum ('pending', 'processing', 'complete', 'rejected');

alter table "public"."orders" alter column status type "public"."order_status" using status::text::"public"."order_status";

alter table "public"."orders" alter column "status" set default 'pending'::order_status;

drop type "public"."order_status__old_version_to_be_dropped";

alter table "public"."orders" alter column "othercolumn" set data type other.otherenum2 using "othercolumn"::text::other.otherenum2;
```

</details>
