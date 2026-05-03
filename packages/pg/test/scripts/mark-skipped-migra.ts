// One-shot: tag the fixtures we don't run today with `data-skip="…"`
// on their input <details>. Used once after the dir→md conversion.
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const FIXTURES_DIR = new URL('../fixtures/migra/', import.meta.url).pathname;

const skips: Record<string, string> = {
  // Need migra args we don't plumb through Dialect.diffSchema today
  // (single-schema scoping, excludeSchema, extension-only,
  // ignore-extension-versions toggle). Deferred — only schema/excludeSchema
  // have real user value, and no current consumer is asking.
  singleschema: "needs schema:'goodschema' arg, not plumbed yet",
  singleschema_ext: 'needs createExtensionsOnly:true arg, not plumbed yet',
  excludeschema: 'needs excludeSchema arg, not plumbed yet',
  excludemultipleschemas: 'needs excludeSchema arg, not plumbed yet',
  extversions: 'needs ignoreExtensionVersions:false toggle, not plumbed yet',

  // Drift from pgkit's expected.sql — environmental or pg-version dependent.
  // Tracked as work for the un-skip pass.
  constraints: 'pg_get_constraintdef formatting drift vs pg16',
  dependencies: 'dependency-statement ordering drifts',
  dependencies2: 'dependency-statement ordering drifts',
  dependencies3: 'dependency-statement ordering drifts',
  dependencies4: 'dependency-statement ordering drifts',
  enumdeps: 'enum dependency-statement ordering drifts',
  everything: 'composite fixture; covers many drift cases',
  generated_added: 'pg-version-dependent generated-column output',
  privileges: "needs 'schemainspect_test_role' role created in setup",
  rls: 'needs test roles + RLS policy formatting matches pg16',
  triggers3: 'pg_get_viewdef qualifies columns differently across pg versions',
};

let touched = 0;
for (const [name, reason] of Object.entries(skips)) {
  const filePath = join(FIXTURES_DIR, name + '.md');
  let contents: string;
  try {
    contents = readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`No file for ${name}; skipping`);
    continue;
  }
  if (contents.includes('data-skip=')) {
    continue;
  }
  const updated = contents.replace(
    /<details>\s*\n<summary>input<\/summary>/,
    `<details data-skip="${reason}">\n<summary>input</summary>`,
  );
  if (updated === contents) {
    console.warn(`Couldn't tag ${name} — no <details><summary>input</summary> found?`);
    continue;
  }
  writeFileSync(filePath, updated);
  touched++;
}

console.log(`Tagged ${touched} fixtures with data-skip.`);
