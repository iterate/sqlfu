import {defineConfig} from '@playwright/test';

const uiPort = Number(process.env.SQLFU_UI_COMPAT_PORT || 3219);
const apiPort = Number(process.env.SQLFU_API_COMPAT_PORT || 56091);

// Floor-compatibility suite: today's UI build against the oldest server
// version SUPPORTED_SERVER_RANGE admits, installed from npm. Kept separate
// from playwright.config.ts because the webServer is a different animal (npm
// install + vite build + static serve, no per-test project templating).
export default defineConfig({
  testDir: './test-compat',
  timeout: 60_000,
  expect: {timeout: 15_000},
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${uiPort}`,
    headless: true,
  },
  webServer: {
    command: `pnpm exec tsx test-compat/start-floor-server.ts --ui-port ${uiPort} --api-port ${apiPort}`,
    port: uiPort,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
