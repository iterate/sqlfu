// Markdown format for the pg-typegen fixture suite. One file per topic;
// inside, a file-level `sql definitions` block sets up the schema, and
// each `## case-name` heading is a single focused test made up of:
//
//   ```sql
//   <the query>
//   ```
//
//   ```yaml
//   <the expected analysis>
//   ```
//
// No "filesystem"-style `(path)` labels — slugs come from the heading
// itself, and we never write the contents to disk. The shape is
// intentionally different from the migra fixtures (which need an
// a/b/expected SQL trio per case) — query-analysis is a 1:1 question
// about *one* SQL string, and the format reflects that.
import {Document, parse as parseYaml, type YAMLMap} from 'yaml';

export interface TypegenFixtureCase {
  name: string;
  query: string;
  expected: unknown;
  /** When true, the test runner skips this case with the given reason. */
  skip?: string;
}

export interface TypegenFixture {
  /** Schema setup applied once per file (the file-level `sql definitions` block). */
  definitions: string;
  cases: TypegenFixtureCase[];
}

export function parseTypegenFixture(contents: string): TypegenFixture {
  const headings = [...contents.matchAll(/^##[ \t]+(?<name>.+?)[ \t]*$/gm)];
  const headArea = headings.length > 0 ? contents.slice(0, headings[0].index!) : contents;

  const definitions = extractFenceBody(headArea, /^```sql\s+definitions[ \t]*\n([\s\S]*?)^```[ \t]*$/m) ?? '';

  const cases: TypegenFixtureCase[] = [];
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const body = contents.slice(heading.index! + heading[0].length, headings[i + 1]?.index ?? contents.length);
    const name = heading.groups!.name.trim();

    const query = extractFenceBody(body, /^```sql(?:[ \t]+query)?[ \t]*\n([\s\S]*?)^```[ \t]*$/m);
    const expectedYaml = extractFenceBody(body, /^```yaml(?:[ \t]+expected)?[ \t]*\n([\s\S]*?)^```[ \t]*$/m);

    if (query == null) {
      throw new Error(`Case "${name}" has no \`\`\`sql block`);
    }

    const skip = body.match(/<!--\s*skip:\s*(.+?)\s*-->/)?.[1];

    cases.push({
      name,
      query: query.trim(),
      expected: expectedYaml == null ? undefined : parseYaml(expectedYaml),
      skip,
    });
  }

  return {definitions, cases};
}

function extractFenceBody(container: string, pattern: RegExp): string | undefined {
  const match = container.match(pattern);
  return match?.[1];
}

/**
 * Render an `expected` value as the body of a ```yaml``` fence. Top-level
 * is block style (one key per line); list entries use flow style (one
 * `{name: a, tsType: number, notNull: true}` per line). Much more
 * scannable for the analysis objects we encode than the default
 * all-block layout.
 */
export function stringifyExpected(value: unknown): string {
  const doc = new Document(value);
  const root = doc.contents as YAMLMap;
  if (root && typeof root === 'object' && 'items' in root) {
    for (const pair of root.items) {
      const inner = (pair as {value?: {items?: {flow?: boolean}[]}}).value;
      if (inner && Array.isArray(inner.items)) {
        for (const item of inner.items) {
          if (item && typeof item === 'object') item.flow = true;
        }
      }
    }
  }
  return doc.toString({lineWidth: 0, flowCollectionPadding: false}).replace(/\n$/, '');
}
