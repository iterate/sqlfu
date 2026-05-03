# Migra fixture: dependencies4

Lifted from `pgkit/packages/migra/test/fixtures/dependencies4/`.

## dependencies4

<details data-skip="dependency-statement ordering drifts">
<summary>input</summary>

```sql (a.sql)
create table t2(a int);
```

```sql (b.sql)
create table t (
    id integer not null primary key,
    a text,
    b integer
);

create view v as
select id, a, max(b)
from t
group by id;  -- "a" is implied because "id" is primary key


create materialized view mv as select id from v;

create unique index on mv (id);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop table "public"."t2";

create table "public"."t" (
    "id" integer not null,
    "a" text,
    "b" integer
);


CREATE UNIQUE INDEX t_pkey ON public.t USING btree (id);

alter table "public"."t" add constraint "t_pkey" PRIMARY KEY using index "t_pkey";

create or replace view "public"."v" as  SELECT t.id,
    t.a,
    max(t.b) AS max
   FROM t
  GROUP BY t.id;


create materialized view "public"."mv" as  SELECT v.id
   FROM v;


CREATE UNIQUE INDEX mv_id_idx ON public.mv USING btree (id);
```

</details>
