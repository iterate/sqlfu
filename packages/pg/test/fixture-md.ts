// Markdown-based fixture format shared by the pg-package's two suites:
//
//   - `migra-fixtures.test.ts`   — schema-diff regression suite
//   - `typegen-fixtures.test.ts` — query-analysis regression suite
//
// One `.md` file holds N test cases. Each case lives under a `## name`
// heading and supplies its files via two nested `<details>` blocks:
//
//     ## case-name
//
//     <details>
//     <summary>input</summary>
//
//     ```sql (a.sql)
//     create table t (id int);
//     ```
//
//     ```sql (b.sql)
//     create table t (id int, extra text);
//     ```
//
//     </details>
//
//     <details>
//     <summary>output</summary>
//
//     ```sql (expected.sql)
//     alter table "public"."t" add column "extra" text;
//     ```
//
//     </details>
//
// This matches sqlfu's existing typegen fixture format
// (`packages/sqlfu/test/generate/fixture-helpers.ts`). The parser is
// intentionally duplicated here rather than imported across packages —
// pg-package's tests should stand alone, and the parsing logic is small.
import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

export interface FixtureFile {
  /** Logical name (e.g. `a.sql`, `definitions.sql`, `sql/q1.sql`). */
  path: string;
  /** Code-fence language (sql, ts, json, …) — informational. */
  lang: string;
  content: string;
}

export interface FixtureCase {
  name: string;
  inputFiles: FixtureFile[];
  outputFiles: FixtureFile[];
  /**
   * Optional `data-skip="reason"` on the input `<details>` tag. When set,
   * runners should `test.skip` with the reason. Useful for parking known-
   * todo cases without deleting them from the .md.
   */
  skip?: string;
}

export function listFixtureFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(dir, name))
    .sort();
}

export function parseFixtureMd(contents: string): FixtureCase[] {
  const cases: FixtureCase[] = [];
  const headings = [...contents.matchAll(/^##\s+(?<name>.+)$/gm)];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const start = heading.index! + heading[0].length;
    const end = headings[i + 1]?.index ?? contents.length;
    const body = contents.slice(start, end);
    const name = heading.groups!.name.trim();

    const inputSection = extractDetailsSection(body, 'input');
    const outputSection = extractDetailsSection(body, 'output');
    if (!inputSection) {
      throw new Error(`Fixture case "${name}" is missing an <details><summary>input</summary> block`);
    }

    cases.push({
      name,
      inputFiles: parseFenceBlocks(inputSection.body),
      outputFiles: outputSection ? parseFenceBlocks(outputSection.body) : [],
      skip: inputSection.attrs['data-skip'],
    });
  }

  return cases;
}

/**
 * Rewrite a single case's `<details><summary>output</summary>…</details>`
 * block in-place. Used by `-u` flows when an assertion mismatches.
 */
export function updateFixtureOutputs(
  fixturePath: string,
  caseName: string,
  outputs: Record<string, string>,
): void {
  const contents = readFileSync(fixturePath, 'utf8');
  const headings = [...contents.matchAll(/^##\s+(.+)$/gm)];
  const idx = headings.findIndex((h) => h[1].trim() === caseName);
  if (idx < 0) {
    throw new Error(`Case "${caseName}" not found in ${fixturePath}`);
  }
  const sectionStart = headings[idx].index!;
  const sectionEnd = headings[idx + 1]?.index ?? contents.length;
  const section = contents.slice(sectionStart, sectionEnd);

  const block = renderOutputBlock(outputs);
  const outputPattern = /<details[^>]*>\s*<summary>output<\/summary>[\s\S]*?<\/details>/;
  let rewritten: string;
  if (outputPattern.test(section)) {
    rewritten = section.replace(outputPattern, block);
  } else {
    // No output block yet — append after the input block.
    rewritten = section.replace(
      /(<details[^>]*>\s*<summary>input<\/summary>[\s\S]*?<\/details>)/,
      (match, inputBlock: string) => `${inputBlock}\n\n${block}`,
    );
  }

  writeFileSync(fixturePath, contents.slice(0, sectionStart) + rewritten + contents.slice(sectionEnd));
}

function renderOutputBlock(outputs: Record<string, string>): string {
  const paths = Object.keys(outputs).sort();
  if (paths.length === 0) {
    return `<details>\n<summary>output</summary>\n\n</details>`;
  }
  const blocks = paths.map((filePath) => {
    const lang = inferLang(filePath);
    const body = outputs[filePath];
    const trailing = body.endsWith('\n') ? '' : '\n';
    return `\`\`\`${lang} (${filePath})\n${body}${trailing}\`\`\``;
  });
  return `<details>\n<summary>output</summary>\n\n${blocks.join('\n\n')}\n\n</details>`;
}

function inferLang(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf('.') + 1);
  if (ext === 'ts' || ext === 'tsx') return 'ts';
  if (ext === 'js' || ext === 'mjs') return 'js';
  if (ext === 'json') return 'json';
  if (ext === 'sql') return 'sql';
  return ext || 'txt';
}

function extractDetailsSection(
  container: string,
  summary: string,
): {body: string; attrs: Record<string, string>} | undefined {
  const escaped = summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<details([^>]*)>\\s*<summary>${escaped}</summary>([\\s\\S]*?)</details>`,
    'i',
  );
  const match = container.match(pattern);
  if (!match) return undefined;
  return {body: match[2], attrs: parseAttrs(match[1])};
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseFenceBlocks(section: string): FixtureFile[] {
  const files: FixtureFile[] = [];
  const fencePattern = /^```(?<lang>[\w-]+)\s*\((?<path>[^)]+)\)\s*\n(?<content>[\s\S]*?)^```\s*$/gm;
  for (const match of section.matchAll(fencePattern)) {
    const {lang, path, content} = match.groups!;
    files.push({path: path.trim(), lang, content});
  }
  return files;
}
