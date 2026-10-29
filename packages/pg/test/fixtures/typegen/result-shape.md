# Typegen fixture: result shape

The descriptor fields that decide a generated wrapper's shape: one row or
many (`multipleRowsResult`), which params are nullable, and which update
params are SET values (`data`). Rules follow the SQLite analyzer so a query
gets the same wrapper in both dialects. `generate-parity.test.ts` checks
that end to end; this file covers the Postgres-only details.

```sql definitions
create table posts (
  id integer primary key,
  slug text not null unique,
  title text not null,
  body text
);
create table memberships (
  org_id integer not null,
  user_id integer not null,
  role text,
  primary key (org_id, user_id)
);
create table tags (
  name text not null,
  archived boolean not null default false
);
create unique index tags_live_name on tags (name) where not archived;
create table counters (
  key text primary key,
  value integer not null default 0
);
```

## limit-one

```sql
select id, slug from posts order by id desc limit 1
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: slug, tsType: string, notNull: true}
parameters: []
```

## no-from

```sql
select 42 as answer
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: answer, tsType: number, notNull: true}
parameters: []
```

## set-returning-function-without-from

`generate_series` returns many rows even with no `from`.

```sql
select generate_series(1, 3) as n
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: n, tsType: number, notNull: false}
parameters: []
```

## set-returning-function-with-limit-one

```sql
select generate_series(1, 3) as n limit 1
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: n, tsType: number, notNull: false}
parameters: []
```

## aggregate-without-group-by

```sql
select count(*) as total from posts
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: total, tsType: bigint, notNull: true}
parameters: []
```

## aggregate-with-group-by

```sql
select title, count(*) as total from posts group by title
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: title, tsType: string, notNull: true}
  - {name: total, tsType: bigint, notNull: true}
parameters: []
```

## window-function

```sql
select id, count(*) over () as total from posts
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: total, tsType: bigint, notNull: true}
parameters: []
```

## primary-key-lookup

```sql
select id, slug from posts where id = :id
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: slug, tsType: string, notNull: true}
parameters:
  - {name: id, tsType: number, notNull: true}
```

## unique-column-lookup

SQLite's analyzer says many rows here, because `posts` has two unique
columns. Postgres checks every unique index.

```sql
select id from posts where slug = :slug
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
parameters:
  - {name: slug, tsType: string, notNull: true}
```

## aliased-lookup-with-extra-conditions

```sql
select p.id from posts p where p.title = :title and p.slug = :slug
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: id, tsType: number, notNull: true}
parameters:
  - {name: title, tsType: string, notNull: true}
  - {name: slug, tsType: string, notNull: true}
```

## part-of-composite-key

```sql
select role from memberships where org_id = :org_id
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: role, tsType: string, notNull: false}
parameters:
  - {name: org_id, tsType: number, notNull: true}
```

## whole-composite-key

```sql
select role from memberships where org_id = :org_id and user_id = :user_id
```

```yaml
ok: true
queryType: Select
multipleRowsResult: false
columns:
  - {name: role, tsType: string, notNull: false}
parameters:
  - {name: org_id, tsType: number, notNull: true}
  - {name: user_id, tsType: number, notNull: true}
```

## partial-unique-index

`tags_live_name` only covers rows that aren't archived.

```sql
select name from tags where name = :name
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: name, tsType: string, notNull: true}
parameters:
  - {name: name, tsType: string, notNull: true}
```

## or-of-lookups

```sql
select id from posts where id = :a or id = :b
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: id, tsType: number, notNull: true}
parameters:
  - {name: a, tsType: number, notNull: true}
  - {name: b, tsType: number, notNull: true}
```

## lookup-with-join

```sql
select p.id from posts p join memberships m on m.user_id = p.id where p.id = :id
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: id, tsType: number, notNull: true}
parameters:
  - {name: id, tsType: number, notNull: true}
```

## is-null-makes-param-nullable

```sql
select id from posts where (:body::text is null or body = :body)
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: id, tsType: number, notNull: true}
parameters:
  - {name: body, tsType: string, notNull: false}
```

## insert-into-nullable-column

```sql
insert into posts (slug, title, body) values (:slug, :title, :body)
```

```yaml
ok: true
queryType: Insert
multipleRowsResult: false
columns: []
parameters:
  - {name: slug, tsType: string, notNull: true}
  - {name: title, tsType: string, notNull: true}
  - {name: body, tsType: string, notNull: false}
```

## insert-without-column-list

```sql
insert into counters values (:key, :value)
```

```yaml
ok: true
queryType: Insert
multipleRowsResult: false
columns: []
parameters:
  - {name: key, tsType: string, notNull: true}
  - {name: value, tsType: number, notNull: true}
```

## on-conflict-set-nullable-column

```sql
insert into posts (slug, title) values (:slug, :title)
on conflict (slug) do update set body = :body
```

```yaml
ok: true
queryType: Insert
multipleRowsResult: false
columns: []
parameters:
  - {name: slug, tsType: string, notNull: true}
  - {name: title, tsType: string, notNull: true}
  - {name: body, tsType: string, notNull: false}
```

## update-set-values-are-data

```sql
update posts set title = :title, body = :body where id = :id
```

```yaml
ok: true
queryType: Update
multipleRowsResult: false
columns: []
parameters:
  - {name: id, tsType: number, notNull: true}
data:
  - {name: title, tsType: string, notNull: true}
  - {name: body, tsType: string, notNull: false}
```

## update-set-param-after-where-param

Wrapper args are `[...data, ...params]`, so `$2` in the SET clause can't be
split out without reordering the SQL's params. Everything stays in `params`.

```sql
update posts set title = $2 where id = $1
```

```yaml
ok: true
queryType: Update
multipleRowsResult: false
columns: []
parameters:
  - {name: $1, tsType: number, notNull: true}
  - {name: $2, tsType: string, notNull: true}
```

## unparseable-query-falls-back-to-loose-shape

`pgsql-ast-parser` can't parse `is not distinct from`. Postgres can, so
analysis still succeeds, with many rows and nullable params.

```sql
select id from posts where body is not distinct from :body
```

```yaml
ok: true
queryType: Select
multipleRowsResult: true
columns:
  - {name: id, tsType: number, notNull: false}
parameters:
  - {name: body, tsType: string, notNull: false}
```
