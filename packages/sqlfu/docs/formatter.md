# Formatter

sqlfu includes a SQLite-focused SQL formatter. Use it from the CLI when you want
to rewrite files, from ESLint when you want editor feedback, or from TypeScript
when you need to format SQL programmatically.

## Format files

```sh
npx sqlfu format "sql/**/*.sql" definitions.sql
```

The command accepts file paths, directories, and simple glob patterns. It
rewrites files in place and reports which files changed.

```txt
Formatted files:
  sql/get-posts.sql
Already formatted:
  definitions.sql
```

The formatter is intentionally opinionated: SQLite-first, lowercase by default,
and biased toward keeping simple clause bodies inline when they still read well.

## Use ESLint

The lint plugin exposes the same formatter through `sqlfu/format-sql`.

```js
import sqlfu from 'sqlfu/lint-plugin';

export default [
  {
    files: ['**/*.sql'],
    plugins: {sqlfu},
    processor: 'sqlfu/sql',
    rules: {
      'sqlfu/format-sql': 'error',
    },
  },
];
```

Then run:

```sh
eslint --fix "sql/**/*.sql"
```

Use this when you want the formatter in the same editor and CI loop as the rest
of your lint rules.

## Use TypeScript

```ts
import {formatSql} from 'sqlfu/api';

const sql = formatSql(`
SELECT id,title
FROM posts
WHERE published = 1
ORDER BY created_at DESC
`);
```

`formatSql()` is the lowest-level API. It is useful for codegen, tests, and
tools that already have SQL text in memory.

## Related pages

- [Lint plugin](https://sqlfu.dev/docs/lint-plugin) covers all SQL-aware ESLint
  rules.
- [CLI](https://sqlfu.dev/docs/cli) lists the rest of the command surface.
