import fs from 'node:fs/promises';
import path from 'node:path';
import {Database} from 'bun:sqlite';

import {startSqlfuUiServer} from '../src/server.ts';

const projectRoot = path.join(import.meta.dir, 'fixture-project');
const dbPath = path.join(projectRoot, 'app.db');

await fs.rm(dbPath, {force: true});

const database = new Database(dbPath);
try {
  const definitionsSql = await fs.readFile(path.join(projectRoot, 'definitions.sql'), 'utf8');
  database.exec(definitionsSql);
  database.exec(`
    insert into posts (slug, title, body, published) values
      ('hello-world', 'Hello World', 'First post body', 1),
      ('draft-notes', 'Draft Notes', 'Unpublished notes', 0);
  `);
} finally {
  database.close();
}

await startSqlfuUiServer({
  port: 3217,
  projectRoot,
});

await new Promise(() => {});
