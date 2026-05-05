import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const websiteRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const docsRoot = path.join(websiteRoot, 'src', 'content', 'docs', 'docs');
const outputPath = path.join(websiteRoot, 'public', 'llms.txt');
const siteUrl = 'https://sqlfu.dev';

const sections = [
  {
    title: 'Start here',
    lead: 'Read these first when you are new to sqlfu or need to orient yourself before editing a project.',
    slugs: ['getting-started', 'sqlfu', 'agent-skill'],
  },
  {
    title: 'Core concepts',
    lead: 'The main mental model: SQL artifacts are the source, TypeScript wrappers and UI metadata are generated from them.',
    slugs: ['client', 'migration-model', 'typegen', 'ui'],
  },
  {
    title: 'Features and guides',
    lead: 'Task-oriented pages for operating sqlfu in a real application.',
    slugs: [
      'guides/durable-objects',
      'guides/cloudflare-d1',
      'guides/node-sqlite',
      'guides/bun-sqlite',
      'guides/turso-libsql',
      'guides/expo-sqlite',
      'guides/sqlite-wasm',
      'cli',
      'adapters',
      'cloudflare-d1',
      'runtime-validation',
      'observability',
      'lint-plugin',
      'formatter',
      'dynamic-queries',
      'id-helpers',
      'outbox',
    ],
  },
  {
    title: 'Reference',
    lead: 'Use these when you need exact surfaces, error shapes, or implementation details.',
    slugs: ['imports', 'errors', 'schema-diff-model'],
  },
  {
    title: 'Generate examples',
    lead: 'Executable snapshot fixtures for `sqlfu generate`. Each page shows real inputs and exact generated TypeScript output.',
    slugs: [
      'examples',
      'examples/basics',
      'examples/config',
      'examples/errors',
      'examples/query-annotations',
      'examples/query-shapes',
      'examples/result-types',
      'examples/validators',
      'examples/logical-types',
    ],
  },
];

const optionalLinks = [
  {
    title: 'sqlfu hosted demo',
    url: `${siteUrl}/ui?demo=1`,
    description: 'Run the Admin UI demo in a browser without installing sqlfu.',
  },
  {
    title: 'sqlfu blog',
    url: `${siteUrl}/blog`,
    description: 'Product essays and release narratives. Useful background, but not required API reference.',
  },
  {
    title: 'GitHub repository',
    url: 'https://github.com/mmkal/sqlfu',
    description: 'Source code, tasks, issues, and the agent skill under `skills/using-sqlfu`.',
  },
];

const docs = await readDocs(docsRoot);
const usedSlugs = new Set();
const missingSlugs = [];
const lines = [
  '# sqlfu',
  '',
  '> sqlfu is a SQLite-first toolkit for teams that want schema, migrations, queries, formatting, diffing, generated TypeScript wrappers, and the Admin UI to stay close to authored SQL files.',
  '',
  'This file is an agent navigation index for the documentation site at https://sqlfu.dev. It points to the current docs and generated examples so an agent can pick the right page in one hop.',
  '',
  'Agent notes:',
  '',
  '- Prefer checked-in SQL artifacts over ORM-shaped rewrites: `definitions.sql`, `migrations/`, `sql/*.sql`, and generated wrappers under `sql/.generated/`.',
  '- For a new project, start with Getting Started, then read CLI, SQL migrations, Type generation from SQL, Runtime client, and Adapters as needed.',
  '- For an existing project, inspect `sqlfu.config.ts` first, then run `npx sqlfu check` before drafting migrations or regenerating wrappers.',
  '- Generated files should normally be regenerated with `npx sqlfu generate`, not edited by hand.',
  '',
];

for (const section of sections) {
  appendSection(lines, section, docs, usedSlugs, missingSlugs);
}

appendOptional(lines, docs, usedSlugs);

if (missingSlugs.length > 0) {
  throw new Error(`Missing docs for llms.txt: ${missingSlugs.join(', ')}`);
}

await fs.mkdir(path.dirname(outputPath), {recursive: true});
await fs.writeFile(outputPath, `${lines.join('\n').trim()}\n`);

console.log(`wrote ${path.relative(websiteRoot, outputPath)}`);

function appendSection(lines, section, docs, usedSlugs, missingSlugs) {
  lines.push(`## ${section.title}`, '');

  if (section.lead) {
    lines.push(section.lead, '');
  }

  for (const slug of section.slugs) {
    const doc = docs.get(slug);
    if (!doc) {
      missingSlugs.push(slug);
      continue;
    }

    usedSlugs.add(slug);
    lines.push(formatDocLink(doc));
  }

  lines.push('');
}

function appendOptional(lines, docs, usedSlugs) {
  const unlistedDocs = Array.from(docs.values())
    .filter((doc) => !usedSlugs.has(doc.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  lines.push('## Optional', '');
  lines.push('Skip these when context is tight or when the task is only about API usage.', '');

  for (const link of optionalLinks) {
    lines.push(`- [${link.title}](${link.url}): ${link.description}`);
  }

  for (const doc of unlistedDocs) {
    lines.push(formatDocLink(doc));
  }

  lines.push('');
}

function formatDocLink(doc) {
  return `- [${doc.title}](${siteUrl}/docs/${doc.slug}): ${doc.description}`;
}

async function readDocs(rootDir) {
  const files = await listMarkdownFiles(rootDir);
  const docs = new Map();

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const meta = parseFrontmatter(raw, filePath);
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/');
    const slug = relativePath.replace(/\.(md|mdx)$/u, '');

    docs.set(slug, {
      slug,
      title: meta.title,
      description: meta.description,
    });
  }

  return docs;
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(entryPath)));
      continue;
    }

    if (/\.(md|mdx)$/u.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/u);
  if (!match) {
    throw new Error(`Missing frontmatter in ${filePath}`);
  }

  const meta = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/u);
    if (!field) {
      continue;
    }

    meta[field[1]] = JSON.parse(field[2]);
  }

  if (!meta.title || !meta.description) {
    throw new Error(`Missing title or description in ${filePath}`);
  }

  return meta;
}
