import assert from 'node:assert/strict';
import {test} from 'node:test';

import {createHighlighter} from 'shiki';

import {sqlTagShikiTransformer} from '../src/sql-tag-shiki-transformer.mjs';

test('sql tagged templates in TypeScript blocks use SQL token colors', async () => {
  const highlighter = await createHighlighter({themes: ['github-dark'], langs: ['typescript', 'sql']});

  const html = highlighter.codeToHtml('const query = sql`select id, slug from posts`;', {
    lang: 'typescript',
    theme: 'github-dark',
    transformers: [sqlTagShikiTransformer()],
  });

  assert.match(html, /<span style="color:#9ECBFF">`<\/span><span style="color:#F97583">select<\/span>/);
  assert.match(html, /<span style="color:#F97583">from<\/span><span style="color:#E1E4E8"> posts<\/span>/);
});
