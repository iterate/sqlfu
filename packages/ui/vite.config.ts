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
      const files = await listTextAssetFiles(distDir);
      const entries = await Promise.all(
        files.map(async (filePath) => {
          const relativePath = path.relative(distDir, filePath).split(path.sep).join('/');
          return {
            assetPath: `/${relativePath}`,
            contents: await fs.readFile(filePath, 'utf8'),
          };
        }),
      );

      await execFileAsync(tscBinary(), ['-p', 'tsconfig.partial-fetch.json'], {cwd: resolvedConfig.root});
      await fs.writeFile(path.join(distDir, 'sqlfu-ui-assets.generated.js'), renderAssetsModule(entries));
    },
  };
}

function tscBinary() {
  return process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
}

async function listTextAssetFiles(dir: string): Promise<string[]> {
  const files = await Array.fromAsync(fs.glob('**/*.{html,js,css}', {cwd: dir}));
  return files
    .filter((filePath) => filePath !== 'partial-fetch.js')
    .filter((filePath) => filePath !== 'sqlfu-ui-assets.generated.js')
    .map((filePath) => path.join(dir, filePath))
    .sort();
}

function renderAssetsModule(entries: Array<{assetPath: string; contents: string}>) {
  return `export default ${JSON.stringify(Object.fromEntries(entries.map((entry) => [entry.assetPath, entry.contents])), null, 2)};\n`;
}
