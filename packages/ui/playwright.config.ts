import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3217',
    headless: true,
  },
  webServer: {
    command: 'bun run test/start-server.ts',
    port: 3217,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
