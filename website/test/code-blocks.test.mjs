import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(testDir, '..');
const distDir = path.join(websiteRoot, 'dist');

test('docs code blocks keep dark-code contrast without terminal window chrome', async () => {
  const css = await readBuiltCss();

  assert.match(
    css,
    /\.expressive-code \.ec-line :where\(span\[style\^=(?:'--'|--)\]:not\(\[class\]\)\)\{[^}]*color:var\(--0, inherit\)/,
    'syntax tokens should use the high-contrast dark palette because docs code blocks are dark in both themes',
  );

  const defaultTerminalHeaderRule = css.indexOf('.expressive-code .frame.is-terminal .header{display:flex');
  const hiddenTerminalHeaderRule = css.indexOf('.expressive-code .frame.is-terminal .header{display:none');

  assert.notEqual(defaultTerminalHeaderRule, -1, 'expected Starlight to emit the default terminal frame header');
  assert.ok(
    hiddenTerminalHeaderRule > defaultTerminalHeaderRule,
    'terminal command blocks should not render the macOS-style title bar',
  );
});

async function readBuiltCss() {
  const cssFiles = await findCssFiles(distDir);
  const contents = await Promise.all(cssFiles.map((file) => readFile(file, 'utf8')));
  return contents.join('\n');
}

async function findCssFiles(root) {
  const matches = [];
  const entries = await readdir(root, {withFileTypes: true});

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      matches.push(...(await findCssFiles(entryPath)));
      continue;
    }

    if (entry.name.endsWith('.css')) {
      matches.push(entryPath);
    }
  }

  return matches;
}
