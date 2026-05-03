# Migra fixture: dependencies3

Lifted from `pgkit/packages/migra/test/fixtures/dependencies3/`.

## dependencies3

<details data-skip="dependency-statement ordering drifts">
<summary>input</summary>

```sql (a.sql)
create table t(a int);

create view abc as select a from t;

create view switcharoo as select 1 as a;

create table "strange_name(((yo?)))"(id text);

create view "strange_view(what)" as select id from "strange_name(((yo?)))";
```

```sql (b.sql)
create table t(a int, b int);

create view abc as select a from t;

create materialized view switcharoo as select 1 as a;

create table "strange_name(((yo?)))"(id text);

create view "strange_view(what)" as select id::int * 2 as a from "strange_name(((yo?)))";
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop view if exists "public"."strange_view(what)";

drop view if exists "public"."switcharoo";

alter table "public"."t" add column "b" integer;

create or replace view "public"."strange_view(what)" as  SELECT (("strange_name(((yo?)))".id)::integer * 2) AS a
   FROM "strange_name(((yo?)))";


create materialized view "public"."switcharoo" as  SELECT 1 AS a;
```

</details>
