// `node --import sqlfu/register main.ts`: lets Node import `.sql` query files, built as they load, with the
// same module the TypeScript content mapper types them with. The hooks run on Node's loader thread, so they
// can wait on the analysis.
import {register} from 'node:module';

register('./register-hooks.js', import.meta.url);
