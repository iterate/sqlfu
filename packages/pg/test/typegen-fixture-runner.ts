// Vitest-free helpers for the typegen fixture suite. Both
// `typegen-fixtures.test.ts` and the regeneration script in
// `scripts/regenerate-typegen-expected.ts` import from here.
//
// The split exists because the regenerate script runs under tsx and
// can't import a file that calls `beforeAll(...)` at module scope.
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import type {QueryAnalysis, SqlfuHost, SqlfuProjectConfig} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import type {FixtureCase} from './fixture-md.js';
import {TEST_ADMIN_URL} from './pg-fixture.js';

export const FIXTURES_DIR = new URL('./fixtures/typegen/', import.meta.url).pathname;

export type JsonAnalysis =
  | {
      ok: true;
      queryType: string;
      columns: {name: string; tsType: string; notNull: boolean}[];
      parameters: {name: string; tsType: string; notNull: boolean}[];
    }
  | {ok: false; error: string};

export interface TypegenCaseResult {
  actual: Record<string, JsonAnalysis>;
  expected: Record<string, JsonAnalysis>;
}

export async function runTypegenCase(fixtureCase: FixtureCase): Promise<TypegenCaseResult> {
  const definitionsSql = fixtureCase.inputFiles.find((f) => f.path === 'definitions.sql')?.content ?? '';
  const sqlFiles = fixtureCase.inputFiles.filter((f) => f.path.startsWith('sql/'));
  if (sqlFiles.length === 0) {
    throw new Error(`Case "${fixtureCase.name}" has no sql/*.sql query files`);
  }

  await using config = await projectConfigForCase(definitionsSql);
  const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
  await using materialized = await dialect.materializeTypegenSchema(stubHost(), config);
  const analyses = await dialect.analyzeQueries(
    materialized,
    sqlFiles.map((file) => ({sqlPath: file.path, sqlContent: file.content})),
  );

  const actual: Record<string, JsonAnalysis> = {};
  for (const [i, file] of sqlFiles.entries()) {
    const analysis = analyses[i];
    const queryName = file.path.replace(/^sql\//, '').replace(/\.sql$/, '');
    actual[queryName] = simplifyAnalysis(analysis);
  }

  const expected: Record<string, JsonAnalysis> = {};
  for (const file of fixtureCase.outputFiles) {
    if (!file.path.startsWith('analyses/')) continue;
    const queryName = file.path.replace(/^analyses\//, '').replace(/\.json$/, '');
    expected[queryName] = JSON.parse(file.content);
  }

  return {actual, expected};
}

export function simplifyAnalysis(analysis: QueryAnalysis): JsonAnalysis {
  if (!analysis.ok) {
    return {ok: false, error: analysis.error.description};
  }
  const {descriptor} = analysis;
  return {
    ok: true,
    queryType: descriptor.queryType,
    columns: descriptor.columns.map((c) => ({name: c.name, tsType: c.tsType, notNull: c.notNull})),
    parameters: descriptor.parameters.map((p) => ({name: p.name, tsType: p.tsType, notNull: p.notNull})),
  };
}

interface ProjectConfigHandle extends SqlfuProjectConfig, AsyncDisposable {}

async function projectConfigForCase(definitionsSql: string): Promise<ProjectConfigHandle> {
  const projectRoot = await mkdtemp(join(tmpdir(), 'sqlfu-pg-typegen-fixture-'));
  await writeFile(join(projectRoot, 'definitions.sql'), definitionsSql);
  const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
  return {
    projectRoot,
    definitions: join(projectRoot, 'definitions.sql'),
    queries: join(projectRoot, 'sql'),
    generate: {
      validator: null,
      prettyErrors: true,
      sync: false,
      importExtension: '.js',
      authority: 'desired_schema',
    },
    dialect,
    [Symbol.asyncDispose]: async () => {
      await rm(projectRoot, {recursive: true, force: true});
    },
  };
}

function stubHost(): SqlfuHost {
  const fs: SqlfuHost['fs'] = {
    async readFile(path: string) {
      const fsp = await import('node:fs/promises');
      return fsp.readFile(path, 'utf8');
    },
    async writeFile() {
      throw new Error('stubHost.fs.writeFile not implemented');
    },
    async readdir() {
      throw new Error('stubHost.fs.readdir not implemented');
    },
    async mkdir() {
      throw new Error('stubHost.fs.mkdir not implemented');
    },
    async rm() {
      throw new Error('stubHost.fs.rm not implemented');
    },
    async rename() {
      throw new Error('stubHost.fs.rename not implemented');
    },
    async exists() {
      return false;
    },
  };
  return {
    fs,
    openDb: async () => {
      throw new Error('stubHost.openDb not implemented');
    },
    openScratchDb: async () => {
      throw new Error('stubHost.openScratchDb not implemented');
    },
    execAdHocSql: async () => {
      throw new Error('stubHost.execAdHocSql not implemented');
    },
    initializeProject: async () => {
      throw new Error('stubHost.initializeProject not implemented');
    },
    digest: async (content) => content,
    now: () => new Date('2026-05-03T00:00:00.000Z'),
    uuid: () => 'test-uuid',
    logger: {log: () => {}, warn: () => {}, error: () => {}},
    catalog: {
      load: async () => ({queries: {}, queryDocuments: {}}) as never,
      refresh: async () => {},
      analyzeSql: async () => ({}) as never,
    },
  };
}
