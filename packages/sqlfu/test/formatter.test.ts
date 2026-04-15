import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

import {formatSql} from '../src/index.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'formatter');

for (const fixturePath of await listFixtureFiles(fixturesDir)) {
  describe(path.basename(fixturePath), async () => {
    const cases = parseFormatterFixture(await fs.readFile(fixturePath, 'utf8'));

    for (const fixtureCase of cases) {
      test(fixtureCase.name, () => {
        expect(formatSql(fixtureCase.input, fixtureCase.config)).toBe(fixtureCase.output);
      });
    }
  });
}

type FormatterFixtureCase = {
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly input: string;
  readonly output: string;
};

async function listFixtureFiles(fixturesDir: string): Promise<string[]> {
  const entries = await fs.readdir(fixturesDir, {withFileTypes: true});
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.fixture.sql'))
    .map((entry) => path.join(fixturesDir, entry.name))
    .sort();
}

function parseFormatterFixture(contents: string): FormatterFixtureCase[] {
  const cases: FormatterFixtureCase[] = [];
  const regionPattern = /^-- #region: (?<name>.+)\n(?<body>[\s\S]*?)^-- #endregion$/gm;

  for (const match of contents.matchAll(regionPattern)) {
    const groups = match.groups;
    if (!groups) {
      continue;
    }

    const configMatch = groups.body.match(/^-- ?config: (?<json>.+)$/m);
    const inputMarker = groups.body.match(/^-- ?input:$/m);
    const unchangedOutputMarker = groups.body.match(/^-- ?output:\s*<unchanged>\s*$/m);
    const outputMarker = groups.body.match(/^-- ?output:$/m);
    if (inputMarker?.index === undefined || (!unchangedOutputMarker && outputMarker?.index === undefined)) {
      throw new Error(`Invalid formatter fixture region "${groups.name}"`);
    }

    const inputStart = inputMarker.index + inputMarker[0].length + 1;
    const resolvedOutputMarker = unchangedOutputMarker ?? outputMarker!;
    const outputStart = resolvedOutputMarker.index!;
    const input = trimFixtureBlock(groups.body.slice(inputStart, outputStart));
    const output = unchangedOutputMarker
      ? input
      : trimFixtureBlock(groups.body.slice(outputMarker!.index! + outputMarker![0].length + 1));
    cases.push({
      name: groups.name,
      config: configMatch?.groups?.json ? JSON.parse(configMatch.groups.json) as Record<string, unknown> : {},
      input,
      output,
    });
  }

  return cases;
}

function trimFixtureBlock(value: string): string {
  return value.replace(/\n+$/g, '');
}
