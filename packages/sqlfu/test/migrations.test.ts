import dedent from 'dedent';
import fs from 'node:fs/promises';
import path from 'node:path';

import {createClient} from '@libsql/client';
import {createRouterClient} from '@orpc/server';
import {describe, expect, test} from 'vitest';

import {getMigrationPrefix, router} from '../src/api.js';
import {createLibsqlClient, createNodeSqliteClient} from '../src/client.js';
import {extractSchema, runSqlStatements} from '../src/core/sqlite.js';
import type {Client, SqlfuProjectConfig} from '../src/core/types.js';
import {createTempFixtureRoot, dumpFixtureFs, writeFixtureFiles} from './fs-fixture.js';
import { DatabaseSync } from 'node:sqlite';

type DisposableClient = {
  readonly client: Client;
  [Symbol.asyncDispose](): Promise<void>;
};

describe('draft', () => {
  test('creates the first migration from definitions.sql when there is no migration history yet', async () => {
    await using fixture = await createMigrationsFixture('first-migration-from-empty-history', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
    });

    await fixture.api.draft();

    expect(await fixture.dumpFs()).toMatchInlineSnapshot(`
      "definitions.sql
        create table person(name text not null);
      migrations/
        2026-04-10T00.00.00.000Z_create_table_person.sql
          create table person(name text not null);
      "
    `);
  });

  test('creates the next migration from the replayed baseline', async () => {
    await using fixture = await createMigrationsFixture('next-migration-from-baseline', {
      desiredSchema: dedent`
        create table person(name text not null);
        create table pet(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await fixture.api.draft();

    expect(await fixture.dumpFs()).toMatchInlineSnapshot(`
      "definitions.sql
        create table person(name text not null);
        create table pet(name text not null);
      migrations/
        2026-04-10T00.00.00.000Z_create_person.sql
          create table person(name text not null);
        2026-04-10T01.00.00.000Z_create_table_pet.sql
          create table pet(name text not null);
      "
    `);
  });

  test('is a no-op when replayed migrations already match definitions.sql', async () => {
    await using fixture = await createMigrationsFixture('draft-no-op', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    const before = await fixture.listMigrationFiles();

    await fixture.api.draft();

    expect(await fixture.listMigrationFiles()).toEqual(before);
  });
});

describe('migrate', () => {
  test('applies only newly added migrations on the second run', async () => {
    await using fixture = await createMigrationsFixture('migrate-replays-without-migrations-table');

    await fixture.writeMigration('add_person', dedent`
      create table person(name text not null);
    `);

    await fixture.api.migrate();

    await fixture.writeMigration('add_pet', dedent`
      create table pet(name text not null, species text not null);
    `);

    await fixture.api.migrate();

    expect(await fixture.dumpDbSchema()).toMatchInlineSnapshot(`
      "create table person(name text not null);
      create table pet(name text not null, species text not null);"
    `);
  });
});

describe('check recommendations', () => {
  test('recommends draft for repo drift only', async () => {
    await using fixture = await createMigrationsFixture('check-repo-drift-only', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
    });

    await expect(fixture.api.check.all()).rejects.toMatchInlineSnapshot(`
      [Error: Repo Drift
      Desired Schema does not match Migrations.
      Recommendation: run \`sqlfu draft\`.]
    `);
  });

  test('recommends migrate for pending migrations only', async () => {
    await using fixture = await createMigrationsFixture('check-pending-migrations-only', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await expect(fixture.api.check.all()).rejects.toMatchInlineSnapshot(`
      [Error: Pending Migrations
      Migration History is behind Migrations.
      Recommendation: run \`sqlfu migrate\`.]
    `);
  });

  test('recommends baseline for schema drift when live schema already matches a known target', async () => {
    await using fixture = await createMigrationsFixture('check-schema-drift-only', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await fixture.writeDbSql(`
      create table person(name text not null);
    `);

    await expect(fixture.api.check.all()).rejects.toMatchInlineSnapshot(`
      [Error: Schema Drift
      Live Schema does not match Migration History.
      Recommended Baseline Target: 2026-04-10T00.00.00.000Z_create_person
      Recommendation: run \`sqlfu baseline 2026-04-10T00.00.00.000Z_create_person\`.]
    `);
  });
});

describe('history drift recommendations', () => {
  test('pinpoints the applied migration that was edited after apply', async () => {
    await using fixture = await createMigrationsFixture('check-history-drift-edited-migration', {
      desiredSchema: dedent`
        create table person(first_name text not null, last_name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await fixture.api.migrate();
    await fixture.writeFile(await fixture.globOne('migrations/*create_person.sql'), dedent`
      create table person(first_name text not null, last_name text not null);
    `);

    await expect(fixture.api.check.all()).rejects.toMatchInlineSnapshot(`
      [Error: History Drift
      Migration History does not match Migrations.
      Edited applied migration: 2026-04-10T00.00.00.000Z_create_person
      Recommended Goto Target: 2026-04-10T00.00.00.000Z_create_person
      Recommendation: restore the original migration from git, or run \`sqlfu goto 2026-04-10T00.00.00.000Z_create_person\` if you want to reconcile this database to the current repo state.]
    `);
  });

  test('recommends baseline only when history drift exists but live schema already matches a current target', async () => {
    await using fixture = await createMigrationsFixture('check-history-drift-baseline-only', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await fixture.api.migrate();
    await fixture.writeDbSql(dedent`
      update sqlfu_migrations
      set content = 'oops this is wrong'
    `);

    await expect(fixture.api.check.all()).rejects.toMatchInlineSnapshot(`
      [Error: History Drift
      Migration History does not match Migrations.
      Edited applied migration: 2026-04-10T00.00.00.000Z_create_person
      Recommended Baseline Target: 2026-04-10T00.00.00.000Z_create_person
      Recommendation: restore the original migration from git, or run \`sqlfu baseline 2026-04-10T00.00.00.000Z_create_person\` if you want to keep the current live schema.]
    `);
  });

  test('pinpoints an applied migration file that has been deleted', async () => {
    await using fixture = await createMigrationsFixture('check-history-drift-deleted-migration', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await fixture.api.migrate();
    await fs.rm(path.join(fixture.root, await fixture.globOne('migrations/*create_person.sql')));

    await expect(fixture.api.check.all()).rejects.toMatchInlineSnapshot(`
      [Error: History Drift
      Migration History does not match Migrations.
      Deleted applied migration: 2026-04-10T00.00.00.000Z_create_person
      Recommendation: restore the missing migration from git.]
    `);
  });
});

describe('baseline', () => {
  test('updates migration history only for the exact target', async () => {
    await using fixture = await createMigrationsFixture('baseline-exact-target', {
      desiredSchema: dedent`
        create table person(name text not null);
      `,
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
      },
    });

    await fixture.writeDbSql(`
      create table person(name text not null);
    `);

    await fixture.api.baseline({target: '2026-04-10T00.00.00.000Z_create_person'});

    expect(await fixture.dumpDbSchema()).toMatchInlineSnapshot(`
      "create table person(name text not null);"
    `);
    expect(await fixture.migrationNames()).toEqual([
      "create_person",
    ]);
  });
});

describe('goto', () => {
  test('updates live schema and migration history to the exact target', async () => {
    await using fixture = await createMigrationsFixture('goto-exact-target', {
      migrations: {
        create_person: dedent`
          create table person(name text not null);
        `,
        create_pet: dedent`
          create table pet(name text not null);
        `,
      },
    });

    await fixture.writeDbSql(`
      create table person(name text not null);
      create table pet(name text not null);
      create table toy(name text not null);
      insert into person(name) values ('alice');
      insert into pet(name) values ('fido');
      insert into toy(name) values ('ball');
    `);

    await fixture.api.goto({target: path.parse(await fixture.globOne('*/*create_person*')).name});

    expect(await fixture.dumpDbSchema()).toMatchInlineSnapshot(`
      "create table person(name text not null);"
    `);
    expect(await fixture.migrationNames()).toEqual([
      "create_person",
    ]);
    expect(await fixture.db.sql`select name from person order by name`).toMatchObject([
      {name: 'alice'},
    ]);

    await fixture.api.goto({target: path.parse(await fixture.globOne('*/*create_pet*')).name});

    expect(await fixture.dumpDbSchema()).toMatchInlineSnapshot(`
      "create table person(name text not null);
      create table pet(name text not null);"
    `);
    expect(await fixture.migrationNames()).toEqual([
      "create_person",
      "create_pet",
    ]);
    expect(await fixture.db.sql`select name from person order by name`).toMatchObject([
      {name: 'alice'},
    ]);
    // original pets got dropped when we did goto person
    expect(await fixture.db.sql`select name from pet order by name`).toMatchObject([]);
  });
});

async function createMigrationsFixture(
  slug: string,
  input: {
    desiredSchema?: string;
    migrations?: Record<string, string>;
  } = {},
) {
  const root = await createTempFixtureRoot(slug);
  const dbPath = path.join(root, 'dev.db');
  const projectConfig: SqlfuProjectConfig = {
    projectRoot: root,
    db: dbPath,
    migrationsDir: path.join(root, 'migrations'),
    definitionsPath: path.join(root, 'definitions.sql'),
    sqlDir: path.join(root, 'sql'),
    generatedImportExtension: '.js',
  };

  let nowUsage = 0;
  const fakeNow = () => {
    const addHours = nowUsage++;
    return new Date(new Date('2026-04-10T00:00:00.000Z').getTime() + addHours * 60 * 60_000);
  };

  const migrations = Object.fromEntries(
    Object.entries(input.migrations ?? {}).map(([name, content]) => [
      `migrations/${getMigrationPrefix(fakeNow())}_${name}.sql`,
      content,
    ]),
  );

  await writeFixtureFiles(root, {
    'definitions.sql': input.desiredSchema || '',
    ...migrations,
  });

  const api = createRouterClient(router, {
    context: {
      config: projectConfig,
      now: fakeNow,
    },
  });
  const db = createNodeSqliteClient(new DatabaseSync(dbPath));

  return {
    root,
    api,
    db,
    async readFile(relativePath: string) {
      return fs.readFile(path.join(root, relativePath), 'utf8');
    },
    async writeFile(relativePath: string, contents: string) {
      const fullPath = path.join(root, relativePath);
      await fs.mkdir(path.dirname(fullPath), {recursive: true});
      await fs.writeFile(fullPath, contents);
    },
    async globOne(pattern: string) {
      const results = await Array.fromAsync(fs.glob(pattern, {cwd: root}));
      if (results.length !== 1) throw new Error(`expected 1 file for ${pattern}, got ${results.join(',') || 'none'}`);
      return results[0];
    },
    async readMigration(name: string) {
      return this.readFile(await this.globOne(`migrations/*${name}*`));
    },
    async listMigrationFiles() {
      return Array.fromAsync(fs.glob('migrations/*.sql', {cwd: root})).then((files) => files.sort());
    },
    async writeMigration(name: string, content: string) {
      await this.writeFile(`migrations/${getMigrationPrefix(fakeNow())}_${name}.sql`, content);
    },
    async dumpFs() {
      return dumpFixtureFs(root, {ignoredNames: ['dev.db', '.sqlfu']});
    },
    async dumpDbSchema() {
      return exportDatabaseSchema(dbPath);
    },
    async writeDbSql(sql: string) {
      await executeDatabaseSql(dbPath, sql);
    },
    async readMigrationHistory() {
      return readMigrationHistory(dbPath);
    },
    async migrationNames() {
      const history = await this.readMigrationHistory();
      return history.map(m => m.name.split('Z_').pop());
    },
    async [Symbol.asyncDispose]() {
      await fs.rm(root, {recursive: true, force: true});
    },
  };
}

async function createLibsqlDatabase(dbPath: string): Promise<DisposableClient> {
  await fs.mkdir(path.dirname(dbPath), {recursive: true});
  const client = createClient({url: `file:${dbPath}`});
  const sqlfuClient = createLibsqlClient(client);

  return {
    client: sqlfuClient,
    async [Symbol.asyncDispose]() {
      client.close();
    },
  } satisfies DisposableClient;
}

async function exportDatabaseSchema(dbPath: string) {
  await using database = await createLibsqlDatabase(dbPath);
  return extractSchema(database.client);
}

async function executeDatabaseSql(dbPath: string, sql: string) {
  await using database = await createLibsqlDatabase(dbPath);
  await runSqlStatements(database.client, dedent(sql));
}

async function readMigrationHistory(dbPath: string) {
  await using database = await createLibsqlDatabase(dbPath);
  try {
    return await database.client.all<{name: string; content: string}>({
      sql: `
        select name, content
        from sqlfu_migrations
        order by name
      `,
      args: [],
    });
  } catch (error: unknown) {
    if (String(error).includes('no such table')) {
      return [];
    }
    throw error;
  }
}
