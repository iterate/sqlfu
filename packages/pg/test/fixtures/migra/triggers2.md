# Migra fixture: triggers2

Lifted from `pgkit/packages/migra/test/fixtures/triggers2/`.

## triggers2

<details>
<summary>input</summary>

```sql (a.sql)
create table table1 (
  id serial primary key
);
create table table2 (
  id serial primary key,
  t text
);

create function trigger_func() returns trigger language plpgsql volatile as $$
begin
  RAISE NOTICE 'Hello';
end;
$$;

create trigger trigger_name after insert on table1 for each row
  execute procedure trigger_func();

create trigger trigger_name after insert on table2 for each row
  execute procedure trigger_func();
```

```sql (b.sql)
create table table1 (
  id serial primary key
);
create table table2 (
  id serial primary key
);

create function trigger_func() returns trigger language plpgsql volatile as $$
begin
  RAISE NOTICE 'Hello';
end;
$$;

-- note switched trigger order
create trigger trigger_name after insert on table2 for each row
  execute procedure trigger_func();

create trigger trigger_name after insert on table1 for each row
  execute procedure trigger_func();
```

</details>

<details>
<summary>output</summary>

```sql (expected.sql)
alter table "public"."table2" drop column "t";
```

</details>
