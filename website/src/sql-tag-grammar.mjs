/**
 * A TextMate injection grammar that highlights the SQL inside `sql`...``
 * tagged templates (including `sql.one<...>`...`` mode/generic variants) in
 * ts/js code blocks.
 *
 * Working at the grammar level - instead of post-processing highlighter
 * tokens - means theme colors, SQL keyword coverage, and string/comment
 * awareness all come from the real `sql` grammar, and the injection selector
 * keeps `sql`...`` text inside TypeScript comments and string literals
 * untouched. Register it alongside the languages it injects into, e.g.
 * `createHighlighter({langs: ['typescript', 'sql', sqlTagGrammar]})` or
 * expressive-code's `shiki.langs`.
 */
export const sqlTagGrammar = {
  name: 'sqlfu-sql-tag',
  scopeName: 'inline.sqlfu-sql-tag',
  injectionSelector:
    'L:source.ts -comment -string, L:source.tsx -comment -string, L:source.js -comment -string, L:source.jsx -comment -string',
  injectTo: ['source.ts', 'source.tsx', 'source.js', 'source.jsx'],
  embeddedLangs: ['sql'],
  patterns: [
    {
      // sql`...`, sql.one`...`, sql.many<{result: ...}>`...` - the generic
      // matcher tolerates one level of nested angle brackets, which covers the
      // shapes `sqlfu generate` writes back into inline configs.
      begin: '(?<![\\w$])(sql(?:\\.\\w+)?)\\s*(<(?:[^<>`]|<[^<>`]*>)*>)?\\s*(`)',
      beginCaptures: {
        1: {name: 'entity.name.function.tagged-template.ts'},
        2: {patterns: [{include: 'source.ts#type'}]},
        3: {name: 'punctuation.definition.string.template.begin.ts'},
      },
      end: '`',
      endCaptures: {0: {name: 'punctuation.definition.string.template.end.ts'}},
      patterns: [{include: 'source.ts#template-substitution-element'}, {include: 'source.sql'}],
    },
  ],
};
