import {expect, test} from 'vitest';

import {assertConfigShape, resolveProjectConfig} from '../src/config.js';

test('generate.experimentalJsonTypes defaults to false', () => {
  const config = resolveProjectConfig(
    {
      definitions: './definitions.sql',
      queries: './sql',
    },
    '/project/sqlfu.config.ts',
  );

  expect(config.generate).toMatchObject({
    experimentalJsonTypes: false,
  });
});

test('generate.casing defaults to camel', () => {
  const config = resolveProjectConfig(
    {
      definitions: './definitions.sql',
      queries: './sql',
    },
    '/project/sqlfu.config.ts',
  );

  expect(config.generate).toMatchObject({
    casing: 'camel',
  });
});

test('generate.casing accepts only camel or preserve', () => {
  expect(() =>
    assertConfigShape('/project/sqlfu.config.ts', {
      definitions: './definitions.sql',
      queries: './sql',
      generate: {casing: 'snake'},
    }),
  ).toThrow(`"generate.casing" must be 'camel', 'preserve', or undefined`);
});

test('generate.experimentalJsonTypes accepts only booleans', () => {
  expect(() =>
    assertConfigShape('/project/sqlfu.config.ts', {
      definitions: './definitions.sql',
      queries: './sql',
      generate: {experimentalJsonTypes: 'yes'},
    }),
  ).toThrow('"generate.experimentalJsonTypes" must be a boolean');
});
