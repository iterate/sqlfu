# Typegen fixture: parameter-substitution edge cases

Probes how `analyzeQueries` handles `$N` placeholders in places the
analyzer's `$N → NULL::<type>` regex would mis-substitute.

The expected YAML below is **hand-authored** to reflect what a
correctly-functioning typegen should produce. Cases that fail expose
real gaps in the regex-based substitution; cases that pass document
behavior the merged temp-view + vendored-AST pipeline already gets
right (the vendored AST pass uses `pgsql-ast-parser` to distinguish
quoted identifiers / string literals from `$N` parameters and stays
correct in those cases — the regex path is the weaker link).

When fixing the failing cases, options to consider:

- **AST-driven substitution.** Walk the query with `pgsql-ast-parser`
  (already a dep) and substitute only bare `$N` tokens, leaving string
  literals / quoted identifiers / dollar-quoted bodies alone. Doesn't
  help when pgsql-ast-parser itself can't parse the query (it doesn't
  support `$$ … $$` dollar-quoting).
- **Always fall back to the AST pipeline result when the temp-view
  step fails or the AST pipeline throws.** The two are independently
  fragile; the merge should be order-insensitive.
- **Extended-protocol Describe.** Skip substitution entirely; ask pg
  to describe the prepared statement. Requires lower-level driver
  access than `node-postgres` exposes today.

```sql definitions
create table t (x int not null);
create table weirdo ("$1" int not null);
```

## multiple-occurrences

A single placeholder used twice in different positions. Sanity check
that `g`-flag replacement handles all occurrences.

```sql
select x from t where x = $1 or x = $1 + 1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## placeholder-with-cast

`$1::int` — a cast expression on the placeholder itself. The
substitution chain `null::int4::int` is valid SQL.

```sql
select x from t where x = $1::int
```

```yaml
ok: true
queryType: Select
columns:
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## string-literal-with-dollar

`$1` inside a single-quoted string. Pg's parser doesn't interpret
`$1` inside string literals — it's just text — so substituting it
changes the string's content. For type-inference purposes the column
type is still `text`, so the failure mode here is "right type, wrong
runtime value" rather than a hard failure. Including this to make
the silent-mangling visible.

```sql
select 'hello $1 world' as msg, x from t where x = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: msg, tsType: string, notNull: true}
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## line-comment-with-dollar

`$1` inside a `--` line comment. Pg strips comments during parse, so
the substitution result is irrelevant — types come out clean.

```sql
select x -- contains $1 inline
from t where x = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## block-comment-with-dollar

`$1` inside a `/* */` block comment. Same as above.

```sql
select x /* uses $1 here */ from t where x = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## dollar-quoted-with-dollar

`$1` inside a `$$…$$` dollar-quoted string. Pg treats the body as a
literal — the substitution changes the runtime string content but
type inference still sees `text`.

```sql
select $$hello $1 world$$ as msg, x from t where x = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: msg, tsType: string, notNull: true}
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## quoted-identifier-with-dollar

A column named `"$1"` (yes, quoted identifiers can be that weird).
The substitution turns the column reference into `"null::int4"`,
which doesn't exist — temp view creation fails, vendored fallback
also doesn't recover.

```sql
select "$1" from weirdo where "$1" = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: $1, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## array-literal-with-dollar

`$1` inside a single-quoted text representation of an int array. The
substitution puts `null::int4` inside the literal, which is no longer
a valid int representation — the cast fails at view-creation time.

```sql
select '{1,2,$1}'::int[] as arr, x from t where x = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: arr, tsType: "number[]", notNull: true}
  - {name: x, tsType: number, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```

## bare-dollar-without-number

A standalone `$` in a string body (no following digits) — verifies
the regex's `\d+\b` boundary isn't over-eager.

```sql
select x, 'cost: $50' as note from t where x = $1
```

```yaml
ok: true
queryType: Select
columns:
  - {name: x, tsType: number, notNull: true}
  - {name: note, tsType: string, notNull: true}
parameters:
  - {name: $1, tsType: number, notNull: false}
```
