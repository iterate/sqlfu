import {DatabaseSync, constants} from 'node:sqlite';
import {expect, test} from 'vitest';

test('sqlite authorizer reports column references from check constraints and partial indexes at compile time', () => {
  using fixture = createAuthorizerFixture();

  fixture.database.exec(`
    create table users (
      id integer primary key,
      name text not null,
      check (name <> '')
    );

    create table posts (
      id integer primary key,
      user_id integer references users(id),
      title text not null
    );

    create index posts_title_active on posts(title) where user_id is not null;
  `);

  expect(fixture.references()).toEqual(
    expect.arrayContaining([
      {action: 'read', relation: 'users', column: 'name', source: null},
      {action: 'read', relation: 'posts', column: 'title', source: null},
      {action: 'read', relation: 'posts', column: 'user_id', source: null},
    ]),
  );
});

test('sqlite authorizer reports view and trigger body references when statements are prepared', () => {
  using fixture = createAuthorizerFixture();

  fixture.database.exec(`
    create table users (
      id integer primary key,
      name text not null
    );

    create table posts (
      id integer primary key,
      user_id integer references users(id),
      title text not null
    );

    create view post_cards as
    select p.id, p.title, u.name as author
    from posts p
    join users u on u.id = p.user_id;

    create trigger posts_ai after insert on posts
    begin
      update users set name = name where id = new.user_id;
    end;
  `);

  fixture.clear();
  fixture.database.prepare(`select * from post_cards where author like 'A%'`);
  fixture.database.prepare(`insert into posts(user_id, title) values (1, 'hello')`);

  expect(fixture.referencesFrom('post_cards')).toEqual([
    {action: 'read', relation: 'posts', column: 'id', source: 'post_cards'},
    {action: 'read', relation: 'posts', column: 'title', source: 'post_cards'},
    {action: 'read', relation: 'posts', column: 'user_id', source: 'post_cards'},
    {action: 'read', relation: 'users', column: 'id', source: 'post_cards'},
    {action: 'read', relation: 'users', column: 'name', source: 'post_cards'},
  ]);

  expect(fixture.referencesFrom('posts_ai')).toEqual([
    {action: 'read', relation: 'posts', column: 'user_id', source: 'posts_ai'},
    {action: 'read', relation: 'users', column: 'id', source: 'posts_ai'},
    {action: 'read', relation: 'users', column: 'name', source: 'posts_ai'},
    {action: 'update', relation: 'users', column: 'name', source: 'posts_ai'},
  ]);
});

test('column origin and explain query plan do not replace dependency analysis', () => {
  using fixture = createAuthorizerFixture();

  fixture.database.exec(`
    create table posts (
      id integer primary key,
      user_id integer,
      title text not null
    );
  `);

  const statement = fixture.database.prepare('select title from posts where user_id = 1');
  expect(statement.columns()).toMatchObject([{name: 'title', table: 'posts', column: 'title'}]);
  expect(statement.columns()).not.toEqual(
    expect.arrayContaining([expect.objectContaining({table: 'posts', column: 'user_id'})]),
  );

  const plan = fixture.database.prepare('explain query plan select title from posts where user_id = 1').all() as Array<{
    detail: string;
  }>;
  expect(plan.map((row) => row.detail).join('\n')).toContain('SCAN posts');
  expect(plan.map((row) => row.detail).join('\n')).not.toContain('user_id');
});

type Reference = {
  action: 'read' | 'update';
  relation: string;
  column: string;
  source: string | null;
};

function createAuthorizerFixture() {
  const database = new DatabaseSync(':memory:');
  const references: Reference[] = [];

  database.setAuthorizer((actionCode, relation, column, databaseName, source) => {
    if (
      databaseName === 'main' &&
      relation &&
      column &&
      !relation.startsWith('sqlite_') &&
      (actionCode === constants.SQLITE_READ || actionCode === constants.SQLITE_UPDATE)
    ) {
      references.push({
        action: actionCode === constants.SQLITE_READ ? 'read' : 'update',
        relation,
        column,
        source,
      });
    }

    return constants.SQLITE_OK;
  });

  return {
    database,
    clear() {
      references.length = 0;
    },
    references() {
      return uniqueReferences(references);
    },
    referencesFrom(source: string) {
      return uniqueReferences(references.filter((reference) => reference.source === source));
    },
    [Symbol.dispose]() {
      database.setAuthorizer(null);
      database.close();
    },
  };
}

function uniqueReferences(references: Reference[]) {
  return Array.from(new Map(references.map((reference) => [JSON.stringify(reference), reference])).values()).sort(
    (left, right) =>
      sourceOrder(left).localeCompare(sourceOrder(right)) ||
      left.relation.localeCompare(right.relation) ||
      left.column.localeCompare(right.column) ||
      left.action.localeCompare(right.action),
  );
}

function sourceOrder(reference: Reference) {
  return reference.source || '';
}
