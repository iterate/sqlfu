import assert from 'node:assert/strict';
import {test} from 'node:test';

import {createHighlighter} from 'shiki';

import {sqlTagGrammar} from '../src/sql-tag-grammar.mjs';

const highlight = async (code) => {
  const highlighter = await createHighlighter({themes: ['github-dark'], langs: ['typescript', 'sql', sqlTagGrammar]});
  return highlighter.codeToHtml(code, {lang: 'typescript', theme: 'github-dark'});
};

test('sql tagged templates in TypeScript blocks use SQL token colors', async () => {
  const html = await highlight('const query = sql`select id, slug from posts`;');

  assert.match(html, /<span style="color:#9ECBFF">`<\/span><span style="color:#F97583">select<\/span>/);
  assert.match(html, /<span style="color:#F97583">from<\/span><span style="color:#E1E4E8"> posts<\/span>/);
});

test('keywords beyond a hand-picked list are highlighted via the sql grammar', async () => {
  const html = await highlight('const query = sql`select id from posts order by id desc`;');

  // `desc` comes from the real sql grammar, not a maintained keyword list.
  assert.match(html, /<span style="color:#F97583">\s*desc<\/span>/);
});

test('mode tags with generic type arguments still highlight the template', async () => {
  const html = await highlight(
    'const q = sql.one<{result: {post_count: number}}>`select count(*) as post_count from posts`;',
  );

  assert.match(html, /<span style="color:#F97583">select<\/span>/);
  assert.match(html, /<span style="color:#F97583">\s*as<\/span>/);
  // The generic type argument renders as TypeScript, not as SQL or string text.
  assert.match(html, /<span style="color:#79B8FF">\s*number<\/span>/);
});

test('fragment snippets without top-level keywords still highlight', async () => {
  // No const/import/export/from TypeScript tokens anywhere in the block: the
  // old transformer's palette inference produced color-less spans for this.
  const html = await highlight('listPosts: sql`select slug from posts`,');

  assert.match(html, /<span style="color:#F97583">select<\/span>/);
  assert.match(html, /<span style="color:#F97583">\s*from<\/span>/);
});

test('sql templates inside comments are left alone', async () => {
  const html = await highlight('// try sql`select 1` for a quick check');

  assert.doesNotMatch(html, /<span style="color:#F97583">/);
  assert.match(html, /<span style="color:#6A737D">\/\/ try sql`select 1` for a quick check<\/span>/);
});

test('sql-looking text inside string literals is left alone', async () => {
  const html = await highlight(`const hint = 'wrap it like sql\`select 1\` does';`);

  assert.doesNotMatch(html, /<span style="color:#F97583">select<\/span>/);
});

test('sql comments inside templates are not keyword-colored', async () => {
  const html = await highlight('const query = sql`select id -- from is not a keyword here\nfrom posts`;');

  // The `from` inside the SQL line comment stays comment-colored.
  assert.match(html, /<span style="color:#6A737D">-- from is not a keyword here<\/span>/);
});

test('multi-line inline config templates highlight every line', async () => {
  const code = [
    "import {defineConfig, sql} from 'sqlfu';",
    '',
    'export default defineConfig({',
    '  definitions: sql`',
    '    create table posts (',
    '      id int,',
    '      slug text',
    '    );',
    '  `,',
    '  queries: {',
    '    listPosts: sql`',
    '      select id, slug',
    '      from posts',
    '      order by id desc',
    '    `,',
    '  },',
    '});',
  ].join('\n');
  const html = await highlight(code);

  assert.match(html, /<span style="color:#F97583">\s*create<\/span><span style="color:#F97583"> table<\/span>/);
  assert.match(html, /<span style="color:#F97583">\s*select<\/span>/);
  assert.match(html, /<span style="color:#F97583">\s*desc<\/span>/);
  // Code after the templates goes back to plain TypeScript highlighting.
  assert.match(html, /<span style="color:#E1E4E8">}\);<\/span>/);
});
