# Typegen fixture: parameter-substitution edge cases

Probes how `analyzeQueries` handles `$N` placeholders in places the
regex-based `$N → NULL::<type>` substitution used to mis-substitute
(`'$1'` inside a string literal, `$$..$$` dollar-quoted body, etc).

The expected YAML below is hand-authored to reflect what a correctly-
functioning typegen should produce. Most cases now pass thanks to
`redact-string-literals.ts` — a focused tokenizer that swaps every
string-literal body for `null/*sqlfu_redacted_literal*/::text` before
the regex sub or the vendored AST pipeline see it. The marker comment
is metadata the future literal-not-null inference pass can recognise.

Failures that remain trace to a single open gap (literal nullability
inference): pgkit's typegen reports `'hello'` as a not-null column;
ours reports it as nullable because the vendored AST pipeline doesn't
yet have logic for "literal expressions are not-null." Tracked.

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
before any `$N` substitution sees it, so column types come through
correctly. Currently fails on `notNull` for `msg` — the vendored
pipeline doesn't infer "string literal is not null" yet.

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
dollar-quoted bodies before the AST pipeline sees them
(`pgsql-ast-parser` has no grammar for `$$…$$`), so the analysis
runs cleanly. Currently fails on `notNull` for `msg` — same
literal-not-null gap as `string-literal-with-dollar`.

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
match any param). Currently fails on `notNull` for `note` — same
literal-not-null gap as `string-literal-with-dollar`.

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
