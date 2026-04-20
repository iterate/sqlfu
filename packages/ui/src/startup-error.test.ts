import {expect, test} from 'vitest';

import {
  MINIMUM_SERVER_VERSION,
  ServerVersionMismatchError,
  checkServerVersion,
  classifyStartupError,
  compareSqlfuVersions,
} from './startup-error.ts';

test('classifies missing HTTP status as unreachable', () => {
  expect(classifyStartupError(new TypeError('Failed to fetch'))).toMatchObject({
    kind: 'unreachable',
    status: null,
  });
});

test('classifies 4xx responses as client errors', () => {
  expect(
    classifyStartupError({
      status: 404,
      message: 'Not found',
    }),
  ).toMatchObject({
    kind: 'client-error',
    status: 404,
  });
});

test('classifies nested 5xx responses as server errors', () => {
  expect(
    classifyStartupError({
      response: {
        status: 500,
      },
      message: 'Internal server error',
    }),
  ).toMatchObject({
    kind: 'server-error',
    status: 500,
  });
});

test('classifies ServerVersionMismatchError as version-mismatch with both versions', () => {
  const error = new ServerVersionMismatchError({
    serverVersion: '0.0.1',
    minimumServerVersion: '0.0.2-3',
  });
  expect(classifyStartupError(error)).toMatchObject({
    kind: 'version-mismatch',
    status: null,
    serverVersion: '0.0.1',
    minimumServerVersion: '0.0.2-3',
  });
});

test('checkServerVersion returns null when the server is at the floor', () => {
  expect(checkServerVersion({serverVersion: MINIMUM_SERVER_VERSION})).toBeNull();
});

test('checkServerVersion returns null when the server is newer than the floor', () => {
  expect(checkServerVersion({serverVersion: '999.0.0'})).toBeNull();
});

test('checkServerVersion returns a mismatch error when the server is below the floor', () => {
  const result = checkServerVersion({serverVersion: '0.0.1'});
  expect(result).toBeInstanceOf(ServerVersionMismatchError);
  expect(result).toMatchObject({
    serverVersion: '0.0.1',
    minimumServerVersion: MINIMUM_SERVER_VERSION,
  });
});

test('checkServerVersion treats missing serverVersion as mismatch (old server)', () => {
  const result = checkServerVersion({serverVersion: undefined});
  expect(result).toBeInstanceOf(ServerVersionMismatchError);
  expect(result).toMatchObject({
    serverVersion: null,
    minimumServerVersion: MINIMUM_SERVER_VERSION,
  });
});

test('compareSqlfuVersions orders numeric segments correctly', () => {
  expect(compareSqlfuVersions('0.0.1', '0.0.2')).toBeLessThan(0);
  expect(compareSqlfuVersions('0.0.2', '0.0.1')).toBeGreaterThan(0);
  expect(compareSqlfuVersions('1.2.3', '1.2.3')).toBe(0);
  expect(compareSqlfuVersions('0.1.0', '0.0.99')).toBeGreaterThan(0);
  expect(compareSqlfuVersions('2.0.0', '1.99.99')).toBeGreaterThan(0);
});

test('compareSqlfuVersions treats a prerelease as older than the released version', () => {
  expect(compareSqlfuVersions('0.0.2-3', '0.0.2')).toBeLessThan(0);
  expect(compareSqlfuVersions('0.0.2', '0.0.2-3')).toBeGreaterThan(0);
});

test('compareSqlfuVersions orders prerelease numbers', () => {
  expect(compareSqlfuVersions('0.0.2-3', '0.0.2-4')).toBeLessThan(0);
  expect(compareSqlfuVersions('0.0.2-4', '0.0.2-3')).toBeGreaterThan(0);
  expect(compareSqlfuVersions('0.0.2-3', '0.0.2-3')).toBe(0);
});

test('compareSqlfuVersions throws on unsupported shapes', () => {
  expect(() => compareSqlfuVersions('not-a-version', '0.0.1')).toThrow(/Unsupported sqlfu version shape/u);
  expect(() => compareSqlfuVersions('0.0.1', '1.2.3-beta.4')).toThrow(/Unsupported sqlfu version shape/u);
});
