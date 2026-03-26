import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlite3defBinaryPath = path.join(packageRoot, '.sqlfu', 'bin', 'sqlite3def');
const {applyDefinitions, checkDatabase, diffDatabase, exportSchema, generateQueryTypes, loadProjectConfig} = await import(
  pathToFileURL(path.join(packageRoot, 'dist', 'index.js')).href,
);

test('generate and migrate honor sqlfu.config.ts defaults', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sqlfu-smoke-'));

  try {
    await fs.cp(path.join(packageRoot, 'definitions.sql'), path.join(tempRoot, 'definitions.sql'));
    await fs.cp(path.join(packageRoot, 'sql'), path.join(tempRoot, 'sql'), {recursive: true});
    await fs.writeFile(
      path.join(tempRoot, 'sqlfu.config.ts'),
      `
export default {
  dbPath: './app.db',
};
`,
    );
    await fs.writeFile(
      path.join(tempRoot, 'sql', 'find-post-by-slug.sql'),
      `
SELECT
  id,
  slug,
  title,
  published_at,
  body AS excerpt
FROM posts
WHERE slug = :slug
  AND published_at IS NOT NULL
LIMIT 1;
`,
    );

    const resolvedConfig = await loadProjectConfig({cwd: tempRoot});
    await generateQueryTypes({cwd: tempRoot, sqlite3defBinaryPath});
    await applyDefinitions({cwd: tempRoot, sqlite3defBinaryPath});

    const generatedQueryPath = path.join(tempRoot, 'sql', 'list-post-summaries.ts');
    const generatedParameterizedQueryPath = path.join(tempRoot, 'sql', 'find-post-by-slug.ts');
    const generatedIndexPath = path.join(tempRoot, 'sql', 'index.ts');
    const generatedTypesqlConfigPath = path.join(tempRoot, 'typesql.json');
    const configuredDbPath = path.join(tempRoot, 'app.db');

    const [generatedQuery, generatedParameterizedQuery, generatedTypesqlConfig, diffResult, exportedSchema] = await Promise.all([
      fs.readFile(generatedQueryPath, 'utf8'),
      fs.readFile(generatedParameterizedQueryPath, 'utf8'),
      fs.readFile(generatedTypesqlConfigPath, 'utf8'),
      diffDatabase({cwd: tempRoot, sqlite3defBinaryPath}),
      exportSchema({cwd: tempRoot, sqlite3defBinaryPath}),
    ]);

    await fs.access(generatedIndexPath);
    await fs.access(generatedTypesqlConfigPath);
    await fs.access(configuredDbPath);

    expect(resolvedConfig.configPath).toBe(path.join(tempRoot, 'sqlfu.config.ts'));
    expect(resolvedConfig.dbPath).toBe(configuredDbPath);
    expect(generatedQuery).toMatch(/export async function listPostSummaries/);
    expect(generatedQuery).toMatch(/id: number;/);
    expect(generatedQuery).toMatch(/slug: string;/);
    expect(generatedQuery).toMatch(/title: string;/);
    expect(generatedQuery).toMatch(/published_at: string;/);
    expect(generatedQuery).toMatch(/excerpt: string;/);
    expect(generatedQuery).not.toMatch(/:\s*any;/);

    expect(generatedParameterizedQuery).toMatch(/export type FindPostBySlugParams = \{/);
    expect(generatedParameterizedQuery).toMatch(/slug: string;/);
    expect(generatedParameterizedQuery).toMatch(/Promise<FindPostBySlugResult \| null>/);
    expect(generatedParameterizedQuery).toMatch(/body AS excerpt/);

    expect(generatedTypesqlConfig).toMatch(/"includeCrudTables": \[\]/);
    expect(diffResult.drift).toBe(false);
    expect(exportedSchema).toMatch(/CREATE TABLE posts/);

    await checkDatabase({cwd: tempRoot, sqlite3defBinaryPath});
  } finally {
    await fs.rm(tempRoot, {recursive: true, force: true});
  }
});
