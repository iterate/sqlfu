import fs from 'node:fs/promises';
import path from 'node:path';

import {formatSqlFileContents, type SqlFormatLanguage} from '../formatter.js';

export interface FormatSqlFilesResult {
  formatted: string[];
  unchanged: string[];
}

export async function formatSqlFiles(
  patterns: string[],
  cwd: string,
  options: {language?: SqlFormatLanguage} = {},
): Promise<FormatSqlFilesResult> {
  const files = await resolveSqlFiles(patterns, cwd);
  const formatted: string[] = [];
  const unchanged: string[] = [];

  for (const filePath of files) {
    const original = await fs.readFile(filePath, 'utf8');
    const next = formatSqlFileContents(original, {language: options.language});
    const displayPath = toPosix(path.relative(cwd, filePath) || path.basename(filePath));
    if (next === original) {
      unchanged.push(displayPath);
      continue;
    }
    await fs.writeFile(filePath, next);
    formatted.push(displayPath);
  }

  return {formatted, unchanged};
}

async function resolveSqlFiles(patterns: string[], cwd: string): Promise<string[]> {
  const files = new Set<string>();

  for (const pattern of patterns) {
    const matches = hasGlobSyntax(pattern) ? await resolveGlob(pattern, cwd) : [path.resolve(cwd, pattern)];
    if (matches.length === 0) {
      throw new Error(`No files matched ${pattern}`);
    }

    for (const match of matches) {
      const stat = await fs.stat(match).catch((error: NodeJS.ErrnoException) => {
        if (error && error.code === 'ENOENT') {
          throw new Error(`No files matched ${pattern}`);
        }
        throw error;
      });
      if (!stat.isFile()) {
        throw new Error(`Not a file: ${path.relative(cwd, match) || match}`);
      }
      if (path.extname(match) !== '.sql') {
        throw new Error(`Not a .sql file: ${path.relative(cwd, match) || match}`);
      }
      files.add(match);
    }
  }

  return [...files].sort((left, right) => left.localeCompare(right));
}

async function resolveGlob(pattern: string, cwd: string): Promise<string[]> {
  const absolutePattern = path.isAbsolute(pattern) ? toPosix(path.normalize(pattern)) : toPosix(pattern);
  const matchTarget = path.isAbsolute(pattern)
    ? (filePath: string) => toPosix(filePath)
    : (filePath: string) => toPosix(path.relative(cwd, filePath));
  const matcher = globToRegExp(absolutePattern);
  const root = resolveGlobRoot(pattern, cwd);
  const matches: string[] = [];

  for (const filePath of await walkFiles(root)) {
    if (matcher.test(matchTarget(filePath))) {
      matches.push(filePath);
    }
  }

  return matches;
}

function resolveGlobRoot(pattern: string, cwd: string): string {
  const normalized = toPosix(pattern);
  const segments = normalized.split('/');
  const fixedSegments: string[] = [];

  for (const segment of segments) {
    if (hasGlobSyntax(segment)) break;
    fixedSegments.push(segment);
  }

  if (path.isAbsolute(pattern)) {
    const root = path.parse(pattern).root;
    return fixedSegments.length === 0 ? root : path.join(root, ...fixedSegments.slice(1));
  }

  return path.resolve(cwd, ...fixedSegments);
}

async function walkFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, {withFileTypes: true}).catch((error: NodeJS.ErrnoException) => {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'coverage') {
      continue;
    }

    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function globToRegExp(pattern: string): RegExp {
  let source = '^';

  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    const next = pattern[index + 1];

    if (character === '*' && next === '*') {
      index += 1;
      if (pattern[index + 1] === '/') {
        index += 1;
        source += '(?:.*\\/)?';
      } else {
        source += '.*';
      }
      continue;
    }

    if (character === '*') {
      source += '[^/]*';
      continue;
    }

    if (character === '?') {
      source += '[^/]';
      continue;
    }

    source += escapeRegExp(character);
  }

  source += '$';
  return new RegExp(source, 'u');
}

function hasGlobSyntax(value: string): boolean {
  return /[*?]/u.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}
