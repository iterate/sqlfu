# Migra fixture: constraints

Lifted from `pgkit/packages/migra/test/fixtures/constraints/`.

## constraints

<details data-skip="pg_get_constraintdef formatting drift vs pg16">
<summary>input</summary>

```sql (a.sql)
create table t1(a int);

create table b(bb int primary key);

create table t2(a int primary key, bb int references b(bb), price numeric, constraint x check (price > 0));

create table c(cc int unique);

create unique index on t1(a);

CREATE TABLE circles_dropexclude (
    c circle,
    EXCLUDE USING gist (c WITH &&)
);
```

```sql (b.sql)
create table b(bb int primary key);

create table t2(a int, bb int references b(bb) DEFERRABLE INITIALLY deferred);

create table t1(a int primary key, price numeric, constraint x check (price > 0));

create table c(cc int unique);

CREATE UNIQUE INDEX c_pkey ON public.c USING btree (cc);

alter table "public"."c" add constraint "c_pkey" PRIMARY KEY using index "c_pkey" deferrable INITIALLY deferred;

create unique index on t2(a);

CREATE TABLE circles (
    c circle,
    EXCLUDE USING gist (c WITH &&)
);

CREATE TABLE circles_dropexclude (
    c circle
);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
alter table "public"."circles_dropexclude" drop constraint "circles_dropexclude_c_excl";

alter table "public"."t2" drop constraint "x";

alter table "public"."t2" drop constraint "t2_bb_fkey";

alter table "public"."t2" drop constraint "t2_pkey";

select 1; -- drop index if exists "public"."circles_dropexclude_c_excl";

drop index if exists "public"."t1_a_idx";

drop index if exists "public"."t2_pkey";

create table "public"."circles" (
    "c" circle
);


alter table "public"."c" alter column "cc" set not null;

alter table "public"."t1" add column "price" numeric;

alter table "public"."t1" alter column "a" set not null;

alter table "public"."t2" drop column "price";

alter table "public"."t2" alter column "a" drop not null;

CREATE UNIQUE INDEX c_pkey ON public.c USING btree (cc);

select 1; -- CREATE INDEX circles_c_excl ON public.circles USING gist (c);

CREATE UNIQUE INDEX t1_pkey ON public.t1 USING btree (a);

CREATE UNIQUE INDEX t2_a_idx ON public.t2 USING btree (a);

alter table "public"."c" add constraint "c_pkey" PRIMARY KEY using index "c_pkey" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."t1" add constraint "t1_pkey" PRIMARY KEY using index "t1_pkey";

alter table "public"."circles" add constraint "circles_c_excl" EXCLUDE USING gist (c WITH &&);

alter table "public"."t1" add constraint "x" CHECK ((price > (0)::numeric)) not valid;

alter table "public"."t1" validate constraint "x";

alter table "public"."t2" add constraint "t2_bb_fkey" FOREIGN KEY (bb) REFERENCES b(bb) DEFERRABLE INITIALLY DEFERRED not valid;

alter table "public"."t2" validate constraint "t2_bb_fkey";
```

</details>
