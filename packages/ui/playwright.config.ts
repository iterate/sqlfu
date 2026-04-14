import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3218',
    headless: true,
  },
  webServer: {
    command: 'bun run test/start-server.ts fixture-project --reset-db --port 3218',
    port: 3218,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
