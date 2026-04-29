import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {defineConfig, type Plugin, type ResolvedConfig} from 'vite';
import react from '@vitejs/plugin-react';

const execFileAsync = promisify(execFile);

export default defineConfig({
  base: './',
  plugins: [react(), sqlfuPartialFetchBundle()],
  server: {
    allowedHosts: ['.ngrok.app', '.ngrok.dev'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

function sqlfuPartialFetchBundle(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    name: 'sqlfu-partial-fetch-bundle',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config;
    },
    async closeBundle() {
      const distDir = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir);
      const files = await Array.fromAsync(
        fs.glob('**/*.{html,js,css}', {
          cwd: distDir,
          exclude: ['lib/**'],
        }),
      );
      const entries = await Promise.all(
        files.map(async (filePath) => {
          return [`/${filePath}`, await fs.readFile(path.join(distDir, filePath), 'utf8')];
        }),
      );

      await execFileAsync('tsc', ['-p', 'tsconfig.lib.json'], {cwd: resolvedConfig.root});
      await fs.writeFile(
        path.join(distDir, 'lib', 'serialized-assets.js'),
        `export default ${JSON.stringify(Object.fromEntries(entries), null, 2)};\n`,
      );
    },
  };
}
