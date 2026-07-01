import {expect, test} from 'vitest';
import {InspectedSelectable, PostgreSQL} from '../src/vendor/schemainspect/pg/index.js';

test('PostgreSQL dependency loading handles circular selectable dependencies', async () => {
  const database = PostgreSQL.empty();
  const first = makeView('first_view');
  const second = makeView('second_view');

  first.dependent_on.push(second.signature);
  second.dependents.push(first.signature);
  second.dependent_on.push(first.signature);
  first.dependents.push(second.signature);

  database.selectables[first.signature] = first;
  database.selectables[second.signature] = second;

  await database.load_deps_all();

  expect(first).toMatchObject({
    dependent_on_all: [second.signature],
    dependents_all: [second.signature],
  });
  expect(second).toMatchObject({
    dependent_on_all: [first.signature],
    dependents_all: [first.signature],
  });
});

function makeView(name: string) {
  return new InspectedSelectable({
    name,
    schema: 'public',
    columns: {},
    definition: '',
    relationtype: 'v',
    comment: '',
  });
}
