import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const websiteRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(websiteRoot, '..');
const blogSourceDir = path.join(repoRoot, 'blog');
const blogDestDir = path.join(websiteRoot, 'src', 'content', 'blog');

await fs.rm(blogDestDir, {recursive: true, force: true});
await fs.mkdir(blogDestDir, {recursive: true});

const entries = await fs.readdir(blogSourceDir);
const sources = entries.filter((name) => name.endsWith('.md') && !name.includes('ignoreme')).sort();

for (const filename of sources) {
  const sourcePath = path.join(blogSourceDir, filename);
  const raw = await fs.readFile(sourcePath, 'utf8');
  const {metadata, markdown} = splitSourceFrontmatter(raw);

  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!dateMatch) {
    throw new Error(`Blog filename ${filename} must be prefixed YYYY-MM-DD-`);
  }
  const [, date, slug] = dateMatch;

  // Pull the first H1 as the title and drop it from the body so the page
  // template can render its own heading without duplication.
  const firstH1Match = markdown.match(/^#\s+(.+?)\s*$/m);
  if (!firstH1Match) {
    throw new Error(`Blog post ${filename} must have an H1 title`);
  }
  const title = firstH1Match[1];
  const body = markdown.replace(firstH1Match[0], '').replace(/^\n+/, '');

  // First non-empty paragraph after the H1 makes a reasonable description.
  const description = body
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .find((para) => para.length > 0 && !para.startsWith('#') && !para.startsWith('```'));

  const frontmatter =
    [
      '---',
      `title: ${JSON.stringify(title)}`,
      `slug: ${JSON.stringify(slug)}`,
      `date: ${JSON.stringify(date)}`,
      description && `description: ${JSON.stringify(description.slice(0, 240))}`,
      metadata.heroImage && `heroImage: ${JSON.stringify(metadata.heroImage)}`,
      metadata.heroAlt && `heroAlt: ${JSON.stringify(metadata.heroAlt)}`,
      '---',
    ]
      .filter((line) => line !== false && line !== null && line !== undefined)
      .join('\n') + '\n\n';

  const destPath = path.join(blogDestDir, `${slug}.md`);
  await fs.writeFile(destPath, frontmatter + body, 'utf8');
}

console.log(`synced ${sources.length} blog post(s) → ${path.relative(websiteRoot, blogDestDir)}`);

function splitSourceFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return {metadata: {}, markdown: raw};
  }

  const endMarker = '\n---\n';
  const endIndex = raw.indexOf(endMarker, 4);
  if (endIndex === -1) {
    throw new Error('Blog source frontmatter must end with --- on its own line');
  }

  const block = raw.slice(4, endIndex);
  const metadata = {};
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.+)$/);
    if (!match) {
      throw new Error(`Unsupported blog source frontmatter line: ${line}`);
    }
    metadata[match[1]] = parseFrontmatterValue(match[2]);
  }

  return {metadata, markdown: raw.slice(endIndex + endMarker.length)};
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    return JSON.parse(trimmed);
  }
  return trimmed;
}
