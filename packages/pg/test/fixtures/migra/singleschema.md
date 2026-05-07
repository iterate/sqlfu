# Migra fixture: singleschema

Lifted from `pgkit/packages/migra/test/fixtures/singleschema/`.

## singleschema

<details data-skip="needs schema:'goodschema' arg, not plumbed yet">
<summary>input</summary>

```sql (a.sql)
create extension hstore;

create schema goodschema;

create table goodschema.t(id uuid, value text);

create table t(id uuid, value text);

CREATE TYPE goodschema.sdfasdfasdf AS ENUM ('not shipped', 'shipped', 'delivered');

create index on goodschema.t(id);

create view goodschema.v as select 1 AS a;

grant select on table t to postgres;
```

```sql (b.sql)
create extension citext;

create schema goodschema;
    
CREATE TYPE goodschema.sdfasdfasdf AS ENUM ('not shipped', 'shipped', 'delivered', 'not delivered');

create table goodschema.t(id uuid, name text, value text);

create view goodschema.v as select 2 as a;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
drop index if exists "goodschema"."t_id_idx";

alter type "goodschema"."sdfasdfasdf" rename to "sdfasdfasdf__old_version_to_be_dropped";

create type "goodschema"."sdfasdfasdf" as enum ('not shipped', 'shipped', 'delivered', 'not delivered');

drop type "goodschema"."sdfasdfasdf__old_version_to_be_dropped";

alter table "goodschema"."t" add column "name" text;

create or replace view "goodschema"."v" as  SELECT 2 AS a;
```

</details>
