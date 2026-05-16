import {expect, test} from 'vitest';

import rootPackageJson from '../../../package.json' with {type: 'json'};

test('root test script covers release-built package test suites', () => {
  const scripts = rootPackageJson.scripts;

  expect(scriptFilters(scripts.test)).toEqual(expect.arrayContaining(['sqlfu', '@sqlfu/pg', '@sqlfu/ui']));

  for (const filter of ['sqlfu', '@sqlfu/pg', '@sqlfu/ui']) {
    expect(scriptFilters(scripts.build), `${filter} should be release-built`).toContain(filter);
    expect(scriptFilters(scripts.typecheck), `${filter} should be typechecked`).toContain(filter);
  }
});

function scriptFilters(script: string): string[] {
  return [...script.matchAll(/--filter\s+([^\s]+)/g)].map((match) => match[1]);
}
