# Typegen fixture: type mappings

Lifted in spirit from `pgkit/packages/typegen/test/type-mappings.test.ts`
and `type-parsers.test.ts`.

Covers the pg → TS type mapping table: `timestamptz` / `timestamp` →
`Date`, `uuid` → `string`, `bigint` → `number` / `string`, `bool` →
`boolean`, `json` / `jsonb` → `unknown`, plus more obscure
`bit` / `money` / `cidr` mappings.

```sql definitions
-- no schema needed; this fixture queries only literal casts
```

## defaults

```sql
select
  null::timestamptz as a,
  null::uuid as b,
  null::bigint as d,
  null::smallint as e,
  null::time as f,
  null::bit as g,
  null::money as h,
  null::cidr as i,
  null::float8 as j,
  null::interval as k,
  null::real as l,
  null::character as m,
  null::character varying as n
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```

## literals-with-cast

```sql
select '2000-01-01'::timestamptz as a, 1::int8 as b, true::bool as c, '{}'::json as d
```

```yaml
ok: true
queryType: Select
columns: []
parameters: []
```
