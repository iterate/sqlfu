# Migra fixture: extversions

Lifted from `pgkit/packages/migra/test/fixtures/extversions/`.

## extversions

<details data-skip="needs ignoreExtensionVersions:false toggle, not plumbed yet">
<summary>input</summary>

```sql (a.sql)
create extension pg_trgm version '1.3';

create extension hstore;
```

```sql (b.sql)
create extension citext version '1.5';

create extension pg_trgm version '1.4';
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
create extension if not exists "citext" with schema "public" version '1.5';

alter extension "pg_trgm" update to '1.4';

drop extension if exists "hstore";
```

</details>
