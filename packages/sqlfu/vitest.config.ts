import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    // Keep the local default aggressive (vitest's 5s) so hangs surface fast in
    // the dev loop; shared CI runners are several times slower on cold starts.
    testTimeout: process.env.CI ? 30_000 : 5_000,
    provide: {
      updateSnapshots: process.argv.includes('--update') || process.argv.includes('-u'),
    },
  },
});
