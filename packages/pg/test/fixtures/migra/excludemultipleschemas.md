# Migra fixture: excludemultipleschemas

Lifted from `pgkit/packages/migra/test/fixtures/excludemultipleschemas/`.

## excludemultipleschemas

<details data-skip="needs excludeSchema arg, not plumbed yet">
<summary>input</summary>

```sql (a.sql)
create schema excludedschema1;

create table excludedschema1.t(id uuid, value text);

create schema excludedschema2;

create table excludedschema2.t(id uuid, value text);

create schema schema1;

create table schema1.t(id uuid, value text);

create schema schema2;

create table schema2.t(id uuid, value text);
```

```sql (b.sql)
create schema schema1;

create table schema1.t(id uuid, value text);

create schema schema2;

create table schema2.t(id uuid, value text);

create table schema2.z(id uuid, value text);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
create table "schema2"."z" (
    "id" uuid,
    "value" text
);
```

</details>
