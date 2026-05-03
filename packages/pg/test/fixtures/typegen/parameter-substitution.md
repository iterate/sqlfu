# Typegen fixture: parameter-substitution edge cases

Probes how `analyzeQueries` handles `$N` placeholders in places the
regex-based `$N → NULL::<type>` substitution used to mis-substitute
(`'$1'` inside a string literal, `$$..$$` dollar-quoted body, etc).

All cases pass thanks to two changes:

  1. `neutralize-string-literals.ts` — a focused tokenizer that
     rewrites the parts of SQL that confuse our two downstream
     pipelines, in-place, while preserving everything else. `$`
     characters inside string bodies become `SQLFU_DOLLAR` (so the
     regex `$N` substitution can't match a substring of a literal),
     and `$$ … $$` dollar-quoted forms become plain `'…'` (so
     `pgsql-ast-parser` can parse them). One pass; both pipelines
     consume the same neutralized SQL.
  2. The `getAliasInfo` patch in `vendor/typegen/query/parse.ts` —
     it used to silently drop non-`ref`/`call` columns from per-
     field analysis, so source-less columns like `select 1 as a`
     never reached `isNonNullableField`.

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

`$1` inside a single-quoted string. The neutralizer rewrites the
in-string `$` to `SQLFU_DOLLAR` so the regex `$N` sub matches only
the WHERE-clause parameter; pgsql-ast-parser sees a real
string-literal node and `isNonNullableField` infers not-null.

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

`$1` inside a `$$…$$` dollar-quoted string. The neutralizer
rewrites dollar-quoted forms to single-quoted (pgsql-ast-parser
has no grammar for `$$…$$`), preserving the body with `'` → `''`
escapes and `$` → `SQLFU_DOLLAR` neutralisation. The AST sees a
real `string` node and `isNonNullableField` infers not-null.

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
The neutralizer recognises quoted identifiers as a distinct
lexical form so the `$1` inside isn't mistaken for a string body.

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
