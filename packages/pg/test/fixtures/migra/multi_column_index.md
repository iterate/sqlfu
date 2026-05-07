# Migra fixture: multi_column_index

Lifted from `pgkit/packages/migra/test/fixtures/multi_column_index/`.

## multi_column_index

<details>
<summary>input</summary>

```sql (a.sql)
create table a(id int primary key not null);

create table b(id int primary key not null);

create table ab (
    id int primary key not null,
    a_id int NOT NULL,
    b_id int NOT NULL
);

-- Implicitly creates a unique index
alter table ab add constraint ab_a_id_b_id unique (a_id, b_id);
```

```sql (b.sql)
create table a(id int primary key not null);

create table b(id int primary key not null);

create table ab (
    id int primary key not null,
    a_id int NOT NULL,
    b_id int NOT NULL
);

create unique index ab_a_id_b_id on ab (a_id, b_id);
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
alter table "public"."ab" drop constraint "ab_a_id_b_id";
```

</details>
