import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    provide: {
        updateSnapshots: process.argv.includes('--update') || process.argv.includes('-u'),
    }
  },
});
