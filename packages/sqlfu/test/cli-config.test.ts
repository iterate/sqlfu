import fs from 'node:fs/promises';
import path from 'node:path';

import dedent from 'dedent';
import {expect, test} from 'vitest';

import {extractSqlfuCliArgv} from '../src/node/cli-argv.js';
import {createSqlfuCli} from '../src/node/sqlfu-cli.js';
import {loadProjectState} from '../src/node/config.js';
import {createTempFixtureRoot, writeFixtureFiles} from './fs-fixture.js';

test('the CLI accepts a non-default config file path', async () => {
  const root = await createTempFixtureRoot('cli-config');
  await writeFixtureFiles(root, {
    'counter.sqlfu.config.ts': dedent`
      export default {
        definitions: './counter-definitions.sql',
        queries: './counter-sql',
      };
    `,
    'counter-definitions.sql': dedent`
      create table counter (
        id integer primary key,
        value integer not null
      );
    `,
    'counter-sql/get.sql': 'select id, value from counter order by id;',
    'main-definitions.sql': 'create table main_database(id integer primary key);',
    'main-sql/get.sql': 'select id from main_database;',
  });

  using cwd = chdir(root);

  const cli = await createSqlfuCli({configPath: 'counter.sqlfu.config.ts'});
  await runCli(cli, ['generate']);

  await expect(fs.readFile(path.join(root, 'counter-sql/.generated/get.sql.ts'), 'utf8')).resolves.toContain(
    'counter',
  );
  await expect(fs.stat(path.join(root, 'main-sql/.generated/get.sql.ts'))).rejects.toMatchObject({code: 'ENOENT'});

  void cwd;
});

test('loadProjectState resolves paths relative to the selected config file', async () => {
  const root = await createTempFixtureRoot('cli-config-loader');
  await writeFixtureFiles(root, {
    'durable-objects/counter/sqlfu.config.ts': dedent`
      export default {
        definitions: './definitions.sql',
        queries: './sql',
      };
    `,
  });

  using cwd = chdir(root);

  const project = await loadProjectState({configPath: 'durable-objects/counter/sqlfu.config.ts'});
  const projectRoot = path.join(process.cwd(), 'durable-objects/counter');

  expect(project).toMatchObject({
    initialized: true,
    projectRoot,
    configPath: path.join(projectRoot, 'sqlfu.config.ts'),
  });
  expect(project.initialized).toBe(true);
  if (project.initialized) {
    expect(path.normalize(project.config.definitions)).toBe(path.join(projectRoot, 'definitions.sql'));
    expect(path.normalize(project.config.queries)).toBe(path.join(projectRoot, 'sql'));
  }

  void cwd;
});

test('extractSqlfuCliArgv removes the global config flag before command parsing', () => {
  expect(extractSqlfuCliArgv(['generate', '--config', 'counter.sqlfu.config.ts'])).toMatchObject({
    argv: ['generate'],
    configPath: 'counter.sqlfu.config.ts',
  });
  expect(extractSqlfuCliArgv(['--config=counter.sqlfu.config.ts', 'generate'])).toMatchObject({
    argv: ['generate'],
    configPath: 'counter.sqlfu.config.ts',
  });
  expect(() => extractSqlfuCliArgv(['generate', '--config'])).toThrow('Missing value for --config.');
});

async function runCli(cli: Awaited<ReturnType<typeof createSqlfuCli>>, argv: string[]) {
  try {
    await cli.run({
      argv,
      logger: {info() {}, error() {}},
      process: {
        exit(code) {
          throw new CliExit(code);
        },
      },
    });
  } catch (error) {
    if (error instanceof CliExit && error.code === 0) {
      return;
    }
    throw error;
  }
}

function chdir(cwd: string) {
  const previous = process.cwd();
  process.chdir(cwd);
  return {
    [Symbol.dispose]() {
      process.chdir(previous);
    },
  };
}

class CliExit extends Error {
  constructor(public code: number) {
    super(`CLI exited with ${code}`);
  }
}
