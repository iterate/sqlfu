import {expect, test} from 'vitest';

import {splitSqlStatements} from '../src/sqlite-text.js';

test('sql statement splitter uses the same quote and comment scan rules', () => {
  expect(
    splitSqlStatements(
      [
        `select ':literal;' as single, ";double" as double, \`tick;name\` as tick, [bracket;name] as bracketed;`,
        `-- comment;`,
        `/* block; */`,
        `select 2;`,
      ].join('\n'),
    ),
  ).toMatchObject([
    `select ':literal;' as single, ";double" as double, \`tick;name\` as tick, [bracket;name] as bracketed;`,
    [`-- comment;`, `/* block; */`, `select 2;`].join('\n'),
  ]);
});
