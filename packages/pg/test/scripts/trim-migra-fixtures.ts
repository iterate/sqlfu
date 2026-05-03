// One-shot: walk migra .md fixtures and trim leading/trailing blank
// lines from each fenced code block. The original conversion script
// preserved upstream pgkit's literal blank lines (they used blank
// `b.sql` content as a "this got removed" annotation), but those
// blanks are noise in our .md files.
import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const FIXTURES_DIR = new URL('../fixtures/migra/', import.meta.url).pathname;

let touched = 0;
for (const name of readdirSync(FIXTURES_DIR)) {
  if (!name.endsWith('.md')) continue;
  const path = join(FIXTURES_DIR, name);
  const original = readFileSync(path, 'utf8');
  const updated = original.replace(
    /^(```\w+(?:[ \t]+\([^)]+\))?[ \t]*\n)([\s\S]*?)(^```[ \t]*$)/gm,
    (_match, opener: string, body: string, closer: string) => {
      // Strip leading blank lines.
      let trimmed = body.replace(/^(?:[ \t]*\n)+/, '');
      // Strip trailing blank lines (keep the final newline before the closing fence).
      trimmed = trimmed.replace(/(?:[ \t]*\n){2,}$/, '\n');
      return opener + trimmed + closer;
    },
  );
  if (updated !== original) {
    writeFileSync(path, updated);
    touched++;
  }
}

console.log(`Trimmed ${touched} fixtures.`);
