// Node module hooks behind `sqlfu/register`. A `.sql` file loads as the TypeScript module the content mapper
// gives `tsc`, and Node strips its types (`module-typescript`).
import fs from 'node:fs/promises';
import type {LoadHook} from 'node:module';
import {fileURLToPath} from 'node:url';

import {createQueryModules} from './query-modules.js';

const queryModules = createQueryModules();

export const load: LoadHook = async (url, context, nextLoad) => {
  if (!url.startsWith('file:') || !url.endsWith('.sql')) return nextLoad(url, context);

  const sqlPath = fileURLToPath(url);
  const rendered = await queryModules.render(sqlPath, await fs.readFile(sqlPath, 'utf8'));
  if (!rendered) {
    throw new Error(
      `${sqlPath} is not a sqlfu query file: it isn't under the queries folder of the nearest sqlfu config.`,
    );
  }
  if (rendered.diagnostics.length > 0) {
    throw new Error(`${sqlPath}:\n${rendered.diagnostics.map((diagnostic) => `  ${diagnostic.message}`).join('\n')}`);
  }
  return {format: 'module-typescript', source: rendered.text, shortCircuit: true};
};
