#!/usr/bin/env node
// Generates the root social preview image used by Open Graph and Twitter cards.

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const websiteRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(websiteRoot, '..');
const logoPath = path.join(repoRoot, 'docs', 'logo.png');
const outputPath = path.join(websiteRoot, 'public', 'social-card.png');

const logo = await fs.readFile(logoPath);
const logoDataUrl = `data:image/png;base64,${logo.toString('base64')}`;

const serif = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif`;
const mono = `'SF Mono', Menlo, Consolas, 'Roboto Mono', monospace`;
const sans = `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;

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
    <text x="74" y="42" font-family="${serif}" font-size="40" font-weight="700" fill="#201710" letter-spacing="-1">sqlfu</text>
  </g>
  <text x="1128" y="100" text-anchor="end" font-family="${mono}" font-size="20" fill="#6f5947">sqlfu.dev</text>

  <line x1="72" y1="148" x2="1128" y2="148" stroke="#553418" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Eyebrow -->
  <text x="72" y="222" font-family="${sans}" font-size="20" font-weight="700" fill="#9d4d12" letter-spacing="4">SQL FIRST · TYPESCRIPT SECOND</text>

  <!-- Headline -->
  <text x="68" y="346" font-family="${serif}" font-size="116" font-weight="700" fill="#201710" letter-spacing="-3">all you need is sql.</text>

  <!-- Subtitle -->
  <text x="72" y="418" font-family="${serif}" font-size="32" font-weight="400" font-style="italic" fill="#3a2c1f">schema, migrations, and typed queries from plain SQL files.</text>

  <line x1="72" y1="498" x2="1128" y2="498" stroke="#553418" stroke-opacity="0.18" stroke-width="1"/>

  <!-- File manifest: the canonical sqlfu project layout, the project's signature -->
  <g transform="translate(72 562)" font-family="${mono}" font-size="22" fill="#201710">
    <g>
      <rect x="0" y="-22" width="4" height="32" rx="2" fill="#9d4d12"/>
      <text x="18" y="0">definitions.sql</text>
      <text x="18" y="26" font-family="${sans}" font-size="14" font-weight="500" fill="#6f5947" letter-spacing="1.5">SCHEMA</text>
    </g>
    <g transform="translate(360 0)">
      <rect x="0" y="-22" width="4" height="32" rx="2" fill="#9d4d12"/>
      <text x="18" y="0">migrations/*.sql</text>
      <text x="18" y="26" font-family="${sans}" font-size="14" font-weight="500" fill="#6f5947" letter-spacing="1.5">HISTORY</text>
    </g>
    <g transform="translate(740 0)">
      <rect x="0" y="-22" width="4" height="32" rx="2" fill="#9d4d12"/>
      <text x="18" y="0">sql/*.sql</text>
      <text x="18" y="26" font-family="${sans}" font-size="14" font-weight="500" fill="#6f5947" letter-spacing="1.5">QUERIES → TYPED CODE</text>
    </g>
  </g>
</svg>`;

await fs.mkdir(path.dirname(outputPath), {recursive: true});
await sharp(Buffer.from(svg)).png().toFile(outputPath);
console.log(`wrote ${path.relative(websiteRoot, outputPath)} (1200x630)`);
