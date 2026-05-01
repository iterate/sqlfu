import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import {findMiniflareD1Path} from '../src/api.js';
import {createTempFixtureRoot} from './fs-fixture.js';

const expectedD1FileName = '9b879a0c4a6f29874a7fe58c950a69251166fb200d20e8da9d95950658ca0f37.sqlite';

test('findMiniflareD1Path maps an Alchemy app slug to its Miniflare D1 sqlite path', () => {
  const miniflareV3Root = path.join('/repo', '.alchemy', 'miniflare', 'v3');

  const dbPath = findMiniflareD1Path('my-dev-app-slug', {miniflareV3Root});

  expect(dbPath).toBe(path.join(miniflareV3Root, 'd1', 'miniflare-D1DatabaseObject', expectedD1FileName));
});

test('findMiniflareD1Path discovers Alchemy Miniflare v3 from a nested cwd', async () => {
  await using fixture = await createAlchemyFixture();
  const nestedCwd = path.join(fixture.root, 'apps', 'web', 'src', 'server');
  await fs.mkdir(nestedCwd, {recursive: true});

  const dbPath = findMiniflareD1Path('my-dev-app-slug', {cwd: nestedCwd});

  expect(dbPath).toBe(path.join(fixture.miniflareV3Root, 'd1', 'miniflare-D1DatabaseObject', expectedD1FileName));
});

test('findMiniflareD1Path throws an actionable error outside an Alchemy project', async () => {
  await using fixture = await createTempDirectory('alchemy-miniflare-d1-path-missing');
  const nestedCwd = path.join(fixture.root, 'apps', 'web');
  await fs.mkdir(nestedCwd, {recursive: true});

  expect(() => findMiniflareD1Path('my-dev-app-slug', {cwd: nestedCwd})).toThrow(
    `No Alchemy Miniflare v3 root found from ${nestedCwd}. Pass {miniflareV3Root} or run from inside an Alchemy project.`,
  );
});

async function createAlchemyFixture() {
  const root = await createTempFixtureRoot('alchemy-miniflare-d1-path');
  const miniflareV3Root = path.join(root, '.alchemy', 'miniflare', 'v3');
  await fs.mkdir(miniflareV3Root, {recursive: true});

  return {
    root,
    miniflareV3Root,
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}

async function createTempDirectory(slug: string) {
  const root = await createTempFixtureRoot(slug);

  return {
    root,
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}
