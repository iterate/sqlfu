/**
 * ESLint config for this repo.
 *
 * ESLint is the sole linter — it runs sqlfu's own lint-plugin rules on both
 * TS/JS source (inline SQL templates) and standalone `.sql` files (via the
 * plugin's `sql-file` processor). oxfmt handles formatting; TypeScript handles
 * type errors. We don't layer generic lint rules on top — keep the lint loop
 * fast and focused on sqlfu-specific checks.
 */

import tseslint from 'typescript-eslint';

import sqlfu from './scripts/dogfood-lint-plugin.js';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.generated/**',
      '**/.sqlfu/**',
      '**/.typesql/**',
      '**/node_modules/**',
      'packages/sqlfu/src/vendor/**',
      // Fixture files contain intentionally-unformatted SQL (before/after
      // blocks, malformed input) — linting them would fight the fixtures.
      'packages/sqlfu/test/formatter/**',
      'packages/sqlfu/test/schemadiff/fixtures/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {ecmaVersion: 2022, sourceType: 'module'},
    },
    plugins: {sqlfu},
    rules: {
      'sqlfu/query-naming': 'error',
      'sqlfu/format-sql': 'error',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: {sqlfu},
    rules: {
      'sqlfu/query-naming': 'error',
      'sqlfu/format-sql': 'error',
    },
  },
  {
    // Test files often keep inline SQL compact for readability; the formatter
    // would reflow `select b from a` to two lines. Leave them alone.
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/test/**', '**/tests/**'],
    rules: {
      'sqlfu/format-sql': 'off',
    },
  },
  ...sqlfu.configs.sqlFiles,
];
