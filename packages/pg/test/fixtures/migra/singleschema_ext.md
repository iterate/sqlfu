# Migra fixture: singleschema_ext

Lifted from `pgkit/packages/migra/test/fixtures/singleschema_ext/`.

## singleschema_ext

<details data-skip="needs createExtensionsOnly:true arg, not plumbed yet">
<summary>input</summary>

```sql (a.sql)
create extension hstore;

create schema goodschema;

create table goodschema.t(id uuid, value text);

create table t(id uuid, value text);

CREATE TYPE goodschema.sdfasdfasdf AS ENUM ('not shipped', 'shipped', 'delivered');

create index on goodschema.t(id);

create view goodschema.v as select 1;
```

```sql (b.sql)
create extension citext;

create schema goodschema;

CREATE TYPE goodschema.sdfasdfasdf AS ENUM ('not shipped', 'shipped', 'delivered', 'not delivered');

create table goodschema.t(id uuid, name text, value text);

create view goodschema.v as select 2;
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
create extension if not exists "citext" with schema "public";
```

</details>
