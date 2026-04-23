// Strict-tier import check. Bundles each strict-tier entry with
// esbuild's browser platform target: any node:* or un-allowlisted bare
// specifier in the runtime graph becomes an "unresolved" error.
//
// Static imports only. Dynamic import() calls bypass this check — avoid
// them on the strict-tier paths.
//
// Run via the vitest suite test/import-surface.test.ts, not standalone.

import path from 'node:path';
import {build, type Message} from 'esbuild';

const packageRoot = path.resolve(path.dirname(import.meta.filename), '..');

// The bring-your-own-client adapter packages. Consumers install whichever
// of these they run against and pass in instances; sqlfu itself does not
// import them at runtime — adapters only use the `XyzDatabaseLike` types.
// For bundling checks, marking them external mirrors what the publish
// reality looks like when a consumer's bundler resolves them.
const adapterExternals = [
  'bun:sqlite',
  'better-sqlite3',
  'libsql',
  '@libsql/client',
  '@sqlite.org/sqlite-wasm',
  '@tursodatabase/database',
  '@tursodatabase/serverless',
];

// Strict tier: no node:*, no non-adapter bare specifiers. Entries are
// the dist/ JS files — esbuild runs over the built artifact, not source,
// so `import type` erasure is handled for free.
interface StrictEntry {
  name: string;
  entry: string;
  /**
   * Bare specifiers allowed in the runtime graph of this entry. Adapter
   * externals are bring-your-own dependencies — the consumer installs
   * them and the bundler resolves them in their context. Other bare
   * specifiers are disallowed.
   */
  external: string[];
}

const strictEntries: StrictEntry[] = [
  {name: 'sqlfu', entry: 'dist/index.js', external: adapterExternals},
  {name: 'sqlfu/analyze', entry: 'dist/analyze.js', external: adapterExternals},
  {name: 'sqlfu/outbox', entry: 'dist/outbox/index.js', external: []},
  // TODO: sqlfu/ui/browser transitively pulls api.ts via ui/router.ts,
  // which imports schemadiff + typegen + node-using helpers. The uiRouter
  // value is used at runtime in the browser (demo mode), so splitting
  // handlers from router shape is a real refactor — not blocking on it
  // for this PR. Re-enable once the router's browser-safe surface is
  // extracted.
  // {name: 'sqlfu/ui/browser', entry: 'dist/ui/browser.js', external: []},
];

export interface StrictImportViolation {
  entry: string;
  messages: Message[];
}

export async function checkStrictImports(): Promise<StrictImportViolation[]> {
  const violations: StrictImportViolation[] = [];

  for (const {name, entry, external} of strictEntries) {
    const entryPath = path.join(packageRoot, entry);
    try {
      await build({
        entryPoints: [entryPath],
        bundle: true,
        platform: 'browser',
        format: 'esm',
        write: false,
        metafile: false,
        logLevel: 'silent',
        external,
      });
    } catch (error) {
      const buildError = error as {errors?: Message[]};
      if (buildError.errors && buildError.errors.length > 0) {
        violations.push({entry: name, messages: buildError.errors});
      } else {
        throw error;
      }
    }
  }

  return violations;
}

export function formatViolations(violations: StrictImportViolation[]): string {
  const lines: string[] = [];
  for (const violation of violations) {
    lines.push(`Strict-tier entry "${violation.entry}" has disallowed imports:`);
    for (const message of violation.messages) {
      const note = message.notes?.map((n) => n.text).join(' ') ?? '';
      lines.push(`  - ${message.text}${note ? ` (${note})` : ''}`);
      if (message.location) {
        lines.push(`    at ${message.location.file}:${message.location.line}:${message.location.column}`);
      }
    }
    lines.push('');
  }
  lines.push(
    "Strict-tier entries cannot import node:* or bare specifiers (outside the bring-your-own-client adapter list). If this is intentional, the entry's tier needs to change — discuss in a PR before loosening.",
  );
  lines.push(
    'To add a dep to a strict-tier path, update the allowlist in scripts/check-strict-imports.ts and explain why in the PR.',
  );
  lines.push('Static imports only. Dynamic import() calls bypass this check — avoid them on the strict-tier paths.');
  return lines.join('\n');
}

async function main() {
  const violations = await checkStrictImports();
  if (violations.length > 0) {
    console.error(formatViolations(violations));
    process.exit(1);
  }
  console.log('strict-tier import check passed for:', strictEntries.map((e) => e.name).join(', '));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
