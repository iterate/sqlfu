import {defineConfig} from '../sqlfu/src/core/config.js';

export default defineConfig({
  db: './db/app.sqlite',
  migrationsDir: './migrations',
  definitionsPath: './definitions.sql',
  sqlDir: './sql',
});
