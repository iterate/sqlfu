import {expect, test} from 'vitest';

import {
  generatedWrapperFileForQueryPath,
  generatedWrapperFileForSqlFile,
  parseQuerySourceManifest,
  queryIdentityFromPath,
  querySourceManifestEntry,
  renderQuerySourceManifest,
} from '../src/query-identity.js';

test('queryIdentityFromPath derives the generated function name from a query path', () => {
  expect(queryIdentityFromPath('users/list-active')).toBe('usersListActive');
  expect(queryIdentityFromPath('list_users')).toBe('listUsers');
  expect(queryIdentityFromPath('')).toBe('');
});

test('generated wrapper paths preserve the source path and use .sql.ts', () => {
  expect(generatedWrapperFileForSqlFile('users/list-active.sql')).toBe('users/list-active.sql.ts');
  expect(generatedWrapperFileForQueryPath('users/list-active')).toBe('users/list-active.sql.ts');
  expect(() => generatedWrapperFileForSqlFile('users/list-active')).toThrow(/Expected a \.sql query source path/u);
});

test('query source manifest rendering and parsing round-trip source SQL', () => {
  const entry = querySourceManifestEntry({
    relativePath: 'users/list-active',
    sqlContent: 'select id, name\nfrom users\nwhere active = 1;\n',
  });

  const manifest = renderQuerySourceManifest({entries: [entry], importExtension: '.js'});

  expect(manifest).toContain('export * from "./users/list-active.sql.js";');
  expect(parseQuerySourceManifest(manifest)).toEqual([entry]);
});

test('query source manifest keeps the legacy extensionless query path sort order', () => {
  const manifest = renderQuerySourceManifest({
    entries: [
      {sqlFile: 'user-details.sql', generatedFile: 'user-details.sql.ts', sourceSql: 'select 1;'},
      {sqlFile: 'user.sql', generatedFile: 'user.sql.ts', sourceSql: 'select 2;'},
    ],
    importExtension: '.js',
  });

  expect(manifest.indexOf('export * from "./user.sql.js";')).toBeLessThan(
    manifest.indexOf('export * from "./user-details.sql.js";'),
  );
  expect(parseQuerySourceManifest(manifest).map((entry) => entry.sqlFile)).toEqual(['user.sql', 'user-details.sql']);
});

test('query source manifest parser ignores malformed entries', () => {
  const manifest = [
    'export const sqlfuQuerySources = [',
    '\t{ sqlFile: "list-users.sql", generatedFile: 123, sourceSql: "select 1;" },',
    '\t{ sqlFile: "list-posts.sql", generatedFile: "list-posts.sql.ts", sourceSql: "select 2;" },',
    '];',
    '',
  ].join('\n');

  expect(parseQuerySourceManifest(manifest)).toEqual([
    {sqlFile: 'list-posts.sql', generatedFile: 'list-posts.sql.ts', sourceSql: 'select 2;'},
  ]);
});
