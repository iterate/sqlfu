# Migra fixture: collations

Lifted from `pgkit/packages/migra/test/fixtures/collations/`.

## collations

<details>
<summary>input</summary>

```sql (a.sql)
CREATE COLLATION posix FROM "POSIX";

create table t(
  a text,
  b text collate posix
);

CREATE COLLATION numeric (provider = icu, locale = 'en-u-kn-true');
```

```sql (b.sql)



CREATE COLLATION numeric (provider = icu, locale = 'en-u-kn-true');

create table t(
  a text,
  b text collate numeric,
  c text collate numeric
);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
alter table "public"."t" add column "c" text collate "numeric";

alter table "public"."t" alter column "b" set data type text collate "numeric" using "b"::text;

drop collation if exists "public"."posix";
```

</details>
