// Vitest-free runner for the pg-typegen fixture suite. Both
// `typegen-fixtures.test.ts` and `scripts/regenerate-typegen-expected.ts`
// import from here.
//
// The split exists because the regenerate script runs under tsx and
// can't import a file that calls `beforeAll(...)` at module scope.
import {readdirSync, readFileSync} from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, join} from 'node:path';

import type {QueryAnalysis, SqlfuHost} from 'sqlfu';

import {pgDialect} from '../src/index.js';
import {TEST_ADMIN_URL} from './pg-fixture.js';
import {parseTypegenFixture, type TypegenFixtureCase, type TypegenFixture} from './typegen-fixture-md.js';

export const FIXTURES_DIR = new URL('./fixtures/typegen/', import.meta.url).pathname;

export type JsonAnalysis =
  | {
      ok: true;
      queryType: string;
      columns: {name: string; tsType: string; notNull: boolean}[];
      parameters: {name: string; tsType: string; notNull: boolean}[];
    }
  | {ok: false; error: string};

export interface LoadedFixture {
  /** File path of the .md (so error messages can point back at it). */
  path: string;
  /** File basename without `.md` (used as the `describe` block name). */
  name: string;
  fixture: TypegenFixture;
}

export function loadFixtures(): LoadedFixture[] {
  return readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const path = join(FIXTURES_DIR, name);
      const fixture = parseTypegenFixture(readFileSync(path, 'utf8'));
      return {path, name: basename(name, '.md'), fixture};
    });
}

/**
 * Run a single case and return the analyzer's output as a JSON-friendly
 * shape (matching the `expected` slot in the fixture). The caller
 * supplies a materialized scratch db; the runner is free to materialize
 * once per file and re-use it across cases.
 */
export async function runCase(
  materialized: Awaited<ReturnType<ReturnType<typeof pgDialect>['materializeTypegenSchema']>>,
  fixtureCase: TypegenFixtureCase,
): Promise<JsonAnalysis> {
  const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
  const analyses = await dialect.analyzeQueries(materialized, [
    {sqlPath: `${fixtureCase.name}.sql`, sqlContent: fixtureCase.query},
  ]);
  return simplifyAnalysis(analyses[0]);
}

/**
 * Open a scratch postgres database, apply the fixture's `sql definitions`
 * block, and return a disposable handle. Call once per file (cases
 * inside share the schema).
 */
export async function materializeFor(definitions: string) {
  const projectRoot = await mkdtemp(join(tmpdir(), 'sqlfu-pg-typegen-fixture-'));
  const dialect = pgDialect({adminUrl: TEST_ADMIN_URL});
  const materialized = await dialect.materializeTypegenSchema(stubHost(), {
    projectRoot,
    sourceSql: definitions,
  });
  const dispose = materialized[Symbol.asyncDispose];
  return {
    materialized,
    [Symbol.asyncDispose]: async () => {
      await dispose.call(materialized);
      await rm(projectRoot, {recursive: true, force: true});
    },
  };
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
