# Typegen fixture: pg enums

Lifted in spirit from `pgkit/packages/typegen/test/ambiguous-tables.test.ts`.

Pg enums should appear as TypeScript string-literal unions
(`'a' | 'b' | …`). Same-named enums in different schemas are
disambiguated.

```sql definitions
create type test_enum as enum ('A', 'B', 'C');

create table items (
  id int primary key,
  status test_enum not null,
  optional_status test_enum
);
```

## select-enum-columns

```sql
select id, status, optional_status from items
```

```yaml
ok: true
queryType: Select
columns:
  - {name: id, tsType: number, notNull: true}
  - {name: status, tsType: unknown, notNull: true}
  - {name: optional_status, tsType: unknown, notNull: false}
parameters: []
```
