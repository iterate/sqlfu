# Typegen fixture: parameter-substitution edge cases

Probes how `analyzeQueries` handles `$N` placeholders in places the
regex-based `$N → NULL::<type>` substitution used to mis-substitute
(`'$1'` inside a string literal, `$$..$$` dollar-quoted body, etc).

The expected YAML below is hand-authored to reflect what a correctly-
functioning typegen should produce. Most cases now pass thanks to
`redact-string-literals.ts` (which strips string bodies before the
regex sub or the vendored AST pipeline see them) plus the
`getAliasInfo` patch in the vendored typegen (which previously
silently dropped non-`ref`/`call` columns from per-field analysis).

The one remaining red — `dollar-quoted-with-dollar` — exposes the
`$$..$$` limitation: the redactor swaps the dollar-quoted body for
`null::text` so the AST parser doesn't choke (`pgsql-ast-parser`
has no grammar for dollar-quoting). After substitution the AST node
is a *cast of null*, not a *literal*, so the vendored
`isNonNullableField` doesn't recognise it as not-null. Single-quoted
strings work fine because we don't redact them — pgsql-ast-parser
handles those natively.

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

`$1` inside a single-quoted string. The redactor strips the literal
before the regex `$N` sub sees it (so the WHERE-clause `$1` is the
only one substituted), and pgsql-ast-parser handles the original
single-quoted string fine — so `isNonNullableField` sees a real
string-literal node and infers not-null.

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

`$1` inside a `$$…$$` dollar-quoted string. The redactor strips
dollar-quoted bodies because pgsql-ast-parser has no grammar for
`$$…$$`, but the substitute is `null::text` — which the AST sees
as a *cast of null*, not a *literal*, so `isNonNullableField`
doesn't recognise it as not-null and the column comes out
nullable. Hand-written expected reflects what we'd want; actual is
`notNull: false`. See the file-level prose for the bigger
discussion.

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
The redactor recognises quoted identifiers as a distinct lexical
form so the `$1` inside doesn't get mangled by the regex sub.

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

`$1` inside a single-quoted text representation of an int array.
**Pg itself rejects this query at PREPARE time** — the literal
`'{1,2,$1}'` is constant-folded during planning, and `"$1"` isn't a
valid integer. Pgkit's typegen would also fail to analyze it (the
`\gdesc` flow needs a successful PREPARE first). Documented here so
we have visibility on the case if it ever comes up.

```sql
select '{1,2,$1}'::int[] as arr, x from t where x = $1
```

```yaml
ok: false
error: |-
  invalid input syntax for type integer: "$1"
    caused by: invalid input syntax for type integer: "$1"
```

## bare-dollar-without-number

A standalone `$` followed by digits (in a literal context that doesn't
match any param). Both columns now come back not-null.

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
