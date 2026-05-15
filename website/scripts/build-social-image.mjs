#!/usr/bin/env node
// Generates the root social preview image used by Open Graph and Twitter cards.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const websiteRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(websiteRoot, '..');
const logoPath = path.join(repoRoot, 'docs', 'logo.png');
const outputPath = path.join(websiteRoot, 'public', 'social-card.png');

const logo = await fs.readFile(logoPath);
const logoDataUrl = `data:image/png;base64,${logo.toString('base64')}`;

const mono = `'SF Mono', Menlo, Consolas, 'Roboto Mono', monospace`;

const ubuntuFontUrls = {
  italic: 'https://fonts.gstatic.com/s/ubuntu/v21/4iCu6KVjbNBYlgoKeg7z.ttf',
  medium: 'https://fonts.gstatic.com/s/ubuntu/v21/4iCv6KVjbNBYlgoCjC3Ttw.ttf',
  bold: 'https://fonts.gstatic.com/s/ubuntu/v21/4iCv6KVjbNBYlgoCxCvTtw.ttf',
};

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#efe1c6"/>
      <stop offset="0.55" stop-color="#f6efe2"/>
      <stop offset="1" stop-color="#fdf8ee"/>
    </linearGradient>
    <radialGradient id="warm" cx="0.85" cy="0.08" r="0.6">
      <stop offset="0" stop-color="#ffd699" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#ffd699" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#paper)"/>
  <rect width="1200" height="630" fill="url(#warm)"/>

  <!-- Brand row: logo + wordmark on the left, site URL on the right -->
  <g transform="translate(72 60)">
    <image x="0" y="0" width="56" height="56" href="${logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <line x1="72" y1="148" x2="1128" y2="148" stroke="#553418" stroke-opacity="0.18" stroke-width="1"/>

  <line x1="72" y1="498" x2="1128" y2="498" stroke="#553418" stroke-opacity="0.18" stroke-width="1"/>

  <!-- File manifest dividers: the canonical sqlfu project layout, the project's signature -->
  <g transform="translate(72 562)">
    <g>
      <rect x="0" y="-22" width="4" height="32" rx="2" fill="#9d4d12"/>
    </g>
    <g transform="translate(360 0)">
      <rect x="0" y="-22" width="4" height="32" rx="2" fill="#9d4d12"/>
    </g>
    <g transform="translate(740 0)">
      <rect x="0" y="-22" width="4" height="32" rx="2" fill="#9d4d12"/>
    </g>
  </g>
</svg>`;

await fs.mkdir(path.dirname(outputPath), {recursive: true});
const fontDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'sqlfu-social-fonts-'));

try {
  const fonts = await downloadUbuntuFonts(fontDirectory);
  await configureFontconfig(fontDirectory);
  const layers = await Promise.all([
    textLayer({text: 'sqlfu', left: 146, top: 64, fontSize: 42, fontFile: fonts.bold, color: '#201710'}),
    textLayer({text: 'sqlfu.dev', right: 1128, top: 82, fontSize: 20, fontFamily: mono, color: '#6f5947'}),
    textLayer({
      text: 'SQL FIRST · TYPESCRIPT SECOND',
      left: 72,
      top: 199,
      fontSize: 20,
      fontFile: fonts.bold,
      color: '#9d4d12',
      letterSpacing: 4096,
    }),
    textLayer({
      text: 'all you need is sql.',
      left: 68,
      top: 248,
      fontSize: 124,
      fontFile: fonts.bold,
      color: '#201710',
    }),
    textLayer({
      text: 'schema, migrations, and typed queries from plain SQL files.',
      left: 72,
      top: 388,
      fontSize: 34,
      fontFile: fonts.italic,
      fontFamily: 'Ubuntu Italic',
      color: '#3a2c1f',
    }),
    textLayer({text: 'definitions.sql', left: 90, top: 538, fontSize: 22, fontFamily: mono, color: '#201710'}),
    textLayer({
      text: 'SCHEMA',
      left: 90,
      top: 573,
      fontSize: 14,
      fontFile: fonts.medium,
      color: '#6f5947',
      letterSpacing: 1536,
    }),
    textLayer({text: 'migrations/*.sql', left: 450, top: 538, fontSize: 22, fontFamily: mono, color: '#201710'}),
    textLayer({
      text: 'HISTORY',
      left: 450,
      top: 573,
      fontSize: 14,
      fontFile: fonts.medium,
      color: '#6f5947',
      letterSpacing: 1536,
    }),
    textLayer({text: 'sql/*.sql', left: 830, top: 538, fontSize: 22, fontFamily: mono, color: '#201710'}),
    textLayer({
      text: 'QUERIES → TYPED CODE',
      left: 830,
      top: 573,
      fontSize: 14,
      fontFile: fonts.medium,
      color: '#6f5947',
      letterSpacing: 1536,
    }),
  ]);

  await sharp(Buffer.from(svg)).composite(layers).png().toFile(outputPath);
} finally {
  await fs.rm(fontDirectory, {recursive: true, force: true});
}

console.log(`wrote ${path.relative(websiteRoot, outputPath)} (1200x630)`);

async function downloadUbuntuFonts(fontDirectory) {
  const entries = await Promise.all(
    Object.entries(ubuntuFontUrls).map(async ([name, url]) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download Ubuntu ${name} font: ${response.status} ${response.statusText}`);
      }

      const fontPath = path.join(fontDirectory, `${name}.ttf`);
      await fs.writeFile(fontPath, Buffer.from(await response.arrayBuffer()));
      return [name, fontPath];
    }),
  );

  return Object.fromEntries(entries);
}

async function configureFontconfig(fontDirectory) {
  const fontConfigPath = path.join(fontDirectory, 'fonts.conf');
  const escapedDirectory = fontDirectory.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  await fs.writeFile(
    fontConfigPath,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>${escapedDirectory}</dir>
</fontconfig>
`,
  );
  process.env.FONTCONFIG_FILE = fontConfigPath;
}

async function textLayer(options) {
  const fontFamily = options.fontFamily || 'Ubuntu';
  const font = `${fontFamily} ${options.fontSize}`;
  const text = `<span foreground="${options.color}" letter_spacing="${options.letterSpacing || 0}">${escapePango(options.text)}</span>`;
  const textOptions = {text, font, rgba: true};
  if (options.fontFile) {
    textOptions.fontfile = options.fontFile;
  }

  const image = sharp({text: textOptions});
  const input = await image.png().toBuffer();
  const metadata = await sharp(input).metadata();
  const left = 'left' in options ? options.left : options.right - metadata.width;

  return {
    input,
    left,
    top: options.top,
  };
}

function escapePango(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
