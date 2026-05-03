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
columns:
  - {name: a, tsType: Date, notNull: false}
  - {name: b, tsType: string, notNull: false}
  - {name: d, tsType: bigint, notNull: false}
  - {name: e, tsType: number, notNull: false}
  - {name: f, tsType: Date, notNull: false}
  - {name: g, tsType: unknown, notNull: false}
  - {name: h, tsType: unknown, notNull: false}
  - {name: i, tsType: string, notNull: false}
  - {name: j, tsType: number, notNull: false}
  - {name: k, tsType: unknown, notNull: false}
  - {name: l, tsType: number, notNull: false}
  - {name: m, tsType: string, notNull: false}
  - {name: n, tsType: string, notNull: false}
parameters: []
```

## literals-with-cast

```sql
select '2000-01-01'::timestamptz as a, 1::int8 as b, true::bool as c, '{}'::json as d
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: Date, notNull: false}
  - {name: b, tsType: bigint, notNull: false}
  - {name: c, tsType: boolean, notNull: false}
  - {name: d, tsType: unknown, notNull: false}
parameters: []
```
