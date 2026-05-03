# Migra fixture: dependencies

Lifted from `pgkit/packages/migra/test/fixtures/dependencies/`.

## dependencies

<details data-skip="dependency-statement ordering drifts">
<summary>input</summary>

```sql (a.sql)
create table basetable(id serial primary key, name text);

create view aaa_view1 as select name from basetable;

create view bbb_view2 as select name from aaa_view1;

create view ccc_view3 as select name from bbb_view2;

create view ddd_changed as select name from basetable;

create view ddd_unchanged as select name from ddd_changed;

create or replace function "public"."depends_on_bbb_view2"(t text)
returns TABLE(x text) as
$$ select * from bbb_view2 $$
language SQL VOLATILE CALLED ON NULL INPUT SECURITY INVOKER;
```

```sql (b.sql)
create table basetable(id serial primary key, name text);

create view ddd_changed as select name, 'x' as x from basetable;

create view ddd_unchanged as select name from ddd_changed;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop view if exists "public"."ccc_view3";

drop function if exists "public"."depends_on_bbb_view2"(t text);

drop view if exists "public"."bbb_view2";

drop view if exists "public"."aaa_view1";

create or replace view "public"."ddd_changed" as  SELECT basetable.name,
    'x'::text AS x
   FROM basetable;
```

</details>
