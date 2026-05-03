# Migra fixture: seq

Lifted from `pgkit/packages/migra/test/fixtures/seq/`.

## seq

<details>
<summary>input</summary>

```sql (a.sql)
create table test (
  id serial primary key
);

create table unwanted();

create schema other;

create sequence "public"."test2_id_seq";

create table "public"."test2" (
    "id" integer not null default nextval('test2_id_seq'::regclass)
);


CREATE UNIQUE INDEX test2_pkey ON public.test2 USING btree (id);


alter table "public"."test2" add constraint "test2_pkey" PRIMARY KEY using index "test2_pkey";
```

```sql (b.sql)
create schema other;

create sequence "public"."test_id_seq";

create table "public"."test" (
    "id" integer not null default nextval('test_id_seq'::regclass)
);


CREATE UNIQUE INDEX test_pkey ON public.test USING btree (id);


alter table "public"."test" add constraint "test_pkey" PRIMARY KEY using index "test_pkey";


create table test2 (
  id serial primary key
);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop table "public"."unwanted";

alter sequence "public"."test2_id_seq" owned by "public"."test2"."id";

alter sequence "public"."test_id_seq" owned by none;

```

</details>
