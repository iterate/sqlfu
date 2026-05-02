import fs from 'node:fs/promises';
import path from 'node:path';
import {expect, test} from 'vitest';

import {readAlchemyD1State} from '../../src/cloudflare/alchemy-state.js';

const repoRoot = path.resolve(path.dirname(import.meta.filename), '../../../..');

test('readAlchemyD1State reads the v2 state file for a top-level D1 resource', async () => {
  await using fixture = await alchemyStateFixture({
    'state/my-app/dev/database.json': JSON.stringify({
      id: 'database',
      type: 'Cloudflare.D1Database',
      props: {name: 'my-app-dev-database', migrationsDir: './migrations'},
      attr: {
        databaseId: 'db-uuid-001',
        databaseName: 'my-app-dev-database',
        accountId: 'acct-001',
        jurisdiction: 'default',
        migrationsDir: './migrations',
        migrationsTable: 'd1_migrations',
        migrationsHashes: {},
        importHashes: {},
      },
    }),
  });

  const state = readAlchemyD1State({
    stack: 'my-app',
    stage: 'dev',
    fqn: 'database',
    cwd: fixture.cwd,
  });

  expect(state).toMatchObject({
    databaseId: 'db-uuid-001',
    databaseName: 'my-app-dev-database',
    accountId: 'acct-001',
  });
});

test('readAlchemyD1State decodes nested FQN paths (Namespace/database) to Namespace__database.json', async () => {
  await using fixture = await alchemyStateFixture({
    'state/my-app/prod/Auth__database.json': JSON.stringify({
      id: 'database',
      type: 'Cloudflare.D1Database',
      props: {},
      attr: {
        databaseId: 'db-uuid-nested',
        databaseName: 'auth-db',
        accountId: 'acct-001',
      },
    }),
  });

  const state = readAlchemyD1State({
    stack: 'my-app',
    stage: 'prod',
    fqn: 'Auth/database',
    cwd: fixture.cwd,
  });

  expect(state.databaseId).toBe('db-uuid-nested');
});

test('readAlchemyD1State walks up from a nested cwd to find .alchemy/', async () => {
  await using fixture = await alchemyStateFixture({
    'state/my-app/dev/database.json': JSON.stringify({
      id: 'database',
      type: 'Cloudflare.D1Database',
      props: {},
      attr: {databaseId: 'db-uuid', databaseName: 'name', accountId: 'acct'},
    }),
  });
  const nested = path.join(fixture.cwd, 'apps', 'web', 'src', 'server');
  await fs.mkdir(nested, {recursive: true});

  const state = readAlchemyD1State({stack: 'my-app', stage: 'dev', fqn: 'database', cwd: nested});
  expect(state.databaseId).toBe('db-uuid');
});

test('readAlchemyD1State accepts an explicit alchemyDir', async () => {
  await using fixture = await alchemyStateFixture({
    'state/my-app/dev/database.json': JSON.stringify({
      id: 'database',
      type: 'Cloudflare.D1Database',
      props: {},
      attr: {databaseId: 'db-uuid-explicit', databaseName: 'name', accountId: 'acct'},
    }),
  });
  const alchemyDir = path.join(fixture.cwd, '.alchemy');

  const state = readAlchemyD1State({stack: 'my-app', stage: 'dev', fqn: 'database', alchemyDir});
  expect(state.databaseId).toBe('db-uuid-explicit');
});

test('readAlchemyD1State throws actionably when no .alchemy/state/ is found via walk-up', async () => {
  await using fixture = await alchemyStateFixture({});
  const wanderer = path.join(fixture.cwd, 'no-alchemy-here');
  await fs.mkdir(wanderer, {recursive: true});
  await fs.rm(path.join(fixture.cwd, '.alchemy'), {recursive: true, force: true});

  expect(() => readAlchemyD1State({stack: 'a', stage: 'b', fqn: 'c', cwd: wanderer})).toThrow(
    /No \.alchemy directory found from/,
  );
});

test('readAlchemyD1State throws actionably when the state file is missing', async () => {
  // The state/ subdir has to exist for the walker to recognise this as an
  // alchemy persist root; without it the walker would walk past, and the
  // user would see "no .alchemy found" instead of the more useful
  // "missing state file for stack=foo stage=bar".
  await using fixture = await alchemyStateFixture({'state/.gitkeep': ''});

  expect(() => readAlchemyD1State({stack: 'my-app', stage: 'dev', fqn: 'database', cwd: fixture.cwd})).toThrow(
    /Alchemy state file not found.*state\/my-app\/dev\/database\.json/s,
  );
});

test('readAlchemyD1State throws actionably when the state file is for a different resource type', async () => {
  await using fixture = await alchemyStateFixture({
    'state/my-app/dev/database.json': JSON.stringify({
      id: 'database',
      type: 'Cloudflare.Worker',
      props: {},
      attr: {workerId: 'not-a-database'},
    }),
  });

  expect(() => readAlchemyD1State({stack: 'my-app', stage: 'dev', fqn: 'database', cwd: fixture.cwd})).toThrow(
    /Cloudflare\.Worker.*expected Cloudflare\.D1Database/,
  );
});

async function alchemyStateFixture(files: Record<string, string>) {
  const root = path.join(repoRoot, 'tmp', `alchemy-state-fixture-ignoreme-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const alchemyDir = path.join(root, '.alchemy');
  await fs.mkdir(alchemyDir, {recursive: true});

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(alchemyDir, relativePath);
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, content);
  }

  return {
    cwd: root,
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}
