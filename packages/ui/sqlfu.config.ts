import {defineConfig} from 'sqlfu/experimental';

export default defineConfig({
  db: './db/app.sqlite',
  migrationsDir: './migrations',
  definitionsPath: './definitions.sql',
  sqlDir: './sql',
});
