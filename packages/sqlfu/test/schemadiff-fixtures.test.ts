import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

import {diffSchemaSql} from '../src/schemadiff/index.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schemadiff');
const shouldUpdateFixtures = process.env.SQLFU_SCHEMADIFF_UPDATE === '1';

if (shouldUpdateFixtures) {
  await rewriteSchemadiffFixtures(fixturesDir);
}

for (const fixturePath of await listFixtureFiles(fixturesDir)) {
  describe(path.basename(fixturePath), async () => {
    const cases = parseSchemadiffFixture(await fs.readFile(fixturePath, 'utf8'));

    for (const fixtureCase of cases) {
      test(fixtureCase.name, async () => {
        if (fixtureCase.error) {
          await expect(runFixtureCase(fixtureCase)).rejects.toThrow(fixtureCase.error);
          return;
        }

        await expect(runFixtureCase(fixtureCase)).resolves.toBe(fixtureCase.output);
      });
    }
  });
}

type SchemadiffFixtureCase = {
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly baselineSql: string;
  readonly desiredSql: string;
  readonly output?: string;
  readonly error?: string;
};

async function runFixtureCase(fixtureCase: SchemadiffFixtureCase): Promise<string> {
  const diff = await diffSchemaSql({
    projectRoot: process.cwd(),
    baselineSql: fixtureCase.baselineSql,
    desiredSql: fixtureCase.desiredSql,
    allowDestructive: false,
    ...fixtureCase.config,
  } as Parameters<typeof diffSchemaSql>[0]);

  return diff.join('\n');
}

async function listFixtureFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, {withFileTypes: true});
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.fixture.sql'))
    .map((entry) => path.join(root, entry.name))
    .sort();
}

function parseSchemadiffFixture(contents: string): SchemadiffFixtureCase[] {
  const cases: SchemadiffFixtureCase[] = [];
  const defaultConfig = parseDefaultConfig(contents);
  const regionPattern = /^-- #region: (?<name>.+)\n(?<body>[\s\S]*?)^-- #endregion$/gm;

  for (const match of contents.matchAll(regionPattern)) {
    const groups = match.groups;
    if (!groups) {
      continue;
    }

    const configMatch = groups.body.match(/^-- ?config: (?<json>.+)$/m);
    const baselineMarker = groups.body.match(/^-- ?baseline:$/m);
    const desiredMarker = groups.body.match(/^-- ?desired:$/m);
    const emptyOutputMarker = groups.body.match(/^-- ?output:\s*<empty>\s*$/m);
    const outputMarker = groups.body.match(/^-- ?output:$/m);
    const inlineErrorMatch = groups.body.match(/^-- ?error:\s*(?<json>"(?:\\.|[^"])*")\s*$/m);

    if (baselineMarker?.index === undefined || desiredMarker?.index === undefined) {
      throw new Error(`Invalid schemadiff fixture region "${groups.name}"`);
    }

    const resultMarkerIndex = emptyOutputMarker?.index ?? outputMarker?.index ?? inlineErrorMatch?.index;
    if (resultMarkerIndex === undefined) {
      throw new Error(`Invalid schemadiff fixture region "${groups.name}"`);
    }

    const baselineStart = baselineMarker.index + baselineMarker[0].length + 1;
    const desiredStart = desiredMarker.index + desiredMarker[0].length + 1;
    const baselineSql = trimFixtureBlock(groups.body.slice(baselineStart, desiredMarker.index));
    const desiredSql = trimFixtureBlock(groups.body.slice(desiredStart, resultMarkerIndex));
    const output = emptyOutputMarker
      ? ''
      : outputMarker
        ? trimFixtureBlock(groups.body.slice(outputMarker.index! + outputMarker[0].length + 1))
        : undefined;
    const error = inlineErrorMatch?.groups?.json ? JSON.parse(inlineErrorMatch.groups.json) as string : undefined;

    cases.push({
      name: groups.name,
      config: {
        ...defaultConfig,
        ...(configMatch?.groups?.json ? JSON.parse(configMatch.groups.json) as Record<string, unknown> : {}),
      },
      baselineSql,
      desiredSql,
      output,
      error,
    });
  }

  return cases;
}

function parseDefaultConfig(contents: string): Record<string, unknown> {
  const defaultConfigMatch = contents.match(/^-- default config: (?<json>.+)$/m);
  return defaultConfigMatch?.groups?.json ? JSON.parse(defaultConfigMatch.groups.json) as Record<string, unknown> : {};
}

function trimFixtureBlock(value: string): string {
  return value.replace(/\n+$/g, '');
}

async function rewriteSchemadiffFixtures(root: string): Promise<void> {
  for (const fixturePath of await listFixtureFiles(root)) {
    const original = await fs.readFile(fixturePath, 'utf8');
    const rewritten = await rewriteFixtureContents(original);
    if (rewritten !== original) {
      await fs.writeFile(fixturePath, rewritten);
    }
  }
}

async function rewriteFixtureContents(contents: string): Promise<string> {
  const defaultConfig = parseDefaultConfig(contents);
  const regionPattern = /^-- #region: (?<name>.+)\n(?<body>[\s\S]*?)^-- #endregion$/gm;
  const rewrittenRegions: string[] = [];

  for (const match of contents.matchAll(regionPattern)) {
    const groups = match.groups;
    if (!groups) {
      throw new Error('Invalid schemadiff fixture while rewriting');
    }

    rewrittenRegions.push(await rewriteRegion(groups.name, groups.body, defaultConfig));
  }

  const header = contents.match(/^-- default config: .+\n\n/m)?.[0] ?? '';
  return `${header}${rewrittenRegions.join('\n\n')}\n`;
}

async function rewriteRegion(name: string, body: string, defaultConfig: Record<string, unknown>): Promise<string> {
  const configMatch = body.match(/^-- ?config: (?<json>.+)$/m);
  const baselineMarker = body.match(/^-- ?baseline:$/m);
  const desiredMarker = body.match(/^-- ?desired:$/m);
  const resultMarker = body.match(/^-- ?(?:output:\s*<empty>|output:|error:.*)$/m);
  if (baselineMarker?.index === undefined || desiredMarker?.index === undefined || resultMarker?.index === undefined) {
    throw new Error(`Invalid schemadiff fixture region "${name}"`);
  }

  const baselineStart = baselineMarker.index + baselineMarker[0].length + 1;
  const desiredStart = desiredMarker.index + desiredMarker[0].length + 1;
  const baselineSql = trimFixtureBlock(body.slice(baselineStart, desiredMarker.index));
  const desiredSql = trimFixtureBlock(body.slice(desiredStart, resultMarker.index));
  const localConfig = configMatch?.groups?.json ? JSON.parse(configMatch.groups.json) as Record<string, unknown> : {};

  try {
    const output = await runFixtureCase({
      name,
      baselineSql,
      desiredSql,
      config: {...defaultConfig, ...localConfig},
    });

    return [
      `-- #region: ${name}`,
      ...(Object.keys(localConfig).length > 0 ? [`-- config: ${JSON.stringify(localConfig)}`] : []),
      '-- baseline:',
      baselineSql,
      '-- desired:',
      desiredSql,
      output ? '-- output:' : '-- output: <empty>',
      ...(output ? [output] : []),
      '-- #endregion',
    ].join('\n');
  } catch (error) {
    return [
      `-- #region: ${name}`,
      ...(Object.keys(localConfig).length > 0 ? [`-- config: ${JSON.stringify(localConfig)}`] : []),
      '-- baseline:',
      baselineSql,
      '-- desired:',
      desiredSql,
      `-- error: ${JSON.stringify(error instanceof Error ? error.message : String(error))}`,
      '-- #endregion',
    ].join('\n');
  }
}
