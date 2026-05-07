# Typegen fixture: primitives

Lifted in spirit from `pgkit/packages/typegen/test/primitives.test.ts`.

Covers literal type inference, aggregate-result nullability, and
arithmetic / concat operator nullability. Primitive literal columns
are reported as not-null; expressions involving null values
(`'foo' || null`, `null::int`) come out nullable; aggregates over
zero rows (`sum(b) from t`) come out nullable.

```sql definitions
create table test_table (
  a int not null,
  b int
);
```

## literal-int

```sql
select 1 as a
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: number, notNull: true}
parameters: []
```

## literal-text

```sql
select 'a' as a
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: string, notNull: true}
parameters: []
```

## null-cast

```sql
select null::integer as b
```

```yaml
ok: true
queryType: Select
columns:
  - {name: b, tsType: number, notNull: false}
parameters: []
```

## sum-of-not-null

```sql
select sum(a) as total from test_table
```

```yaml
ok: true
queryType: Select
columns:
  - {name: total, tsType: bigint, notNull: false}
parameters: []
```

## sum-of-nullable

```sql
select sum(b) as total from test_table
```

```yaml
ok: true
queryType: Select
columns:
  - {name: total, tsType: bigint, notNull: false}
parameters: []
```

## concat-literals

```sql
select 'foo' || 'bar' as result
```

```yaml
ok: true
queryType: Select
columns:
  - {name: result, tsType: string, notNull: true}
parameters: []
```

## concat-with-null

```sql
select 'foo' || null as result
```

```yaml
ok: true
queryType: Select
columns:
  - {name: result, tsType: string, notNull: false}
parameters: []
```

## comparison-of-column

```sql
select a > 1 as result from test_table
```

```yaml
ok: true
queryType: Select
columns:
  - {name: result, tsType: boolean, notNull: false}
parameters: []
```

## comparison-of-literals

```sql
select 2 > 1 as a
```

```yaml
ok: true
queryType: Select
columns:
  - {name: a, tsType: boolean, notNull: true}
parameters: []
```
