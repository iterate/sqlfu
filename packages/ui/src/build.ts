import fs from 'node:fs/promises';
import path from 'node:path';

const root = import.meta.dir;
const outDir = path.join(root, '..', 'dist');

await fs.rm(outDir, {recursive: true, force: true});
await fs.mkdir(path.join(outDir, 'assets'), {recursive: true});

const result = await Bun.build({
  entrypoints: [path.join(root, 'client.tsx')],
  outdir: path.join(outDir, 'assets'),
  target: 'browser',
  format: 'esm',
  naming: 'app.js',
});

if (!result.success) {
  const details = result.logs.map((log: {message: string}) => log.message).join('\n');
  throw new Error(`Client build failed:\n${details}`);
}

await fs.copyFile(path.join(root, 'styles.css'), path.join(outDir, 'assets', 'app.css'));
await fs.writeFile(
  path.join(outDir, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>sqlfu/ui</title>
    <link rel="stylesheet" href="./assets/app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/app.js"></script>
  </body>
</html>\n`,
);
