import {joinPath} from './paths.js';

const defaultSqlfuConfigFileName = 'sqlfu.config.ts';

export function createDefaultInitPreview(projectRoot: string, input: {configPath?: string} = {}) {
  return {
    projectRoot,
    configPath: input.configPath || joinPath(projectRoot, defaultSqlfuConfigFileName),
    configContents: [
      'export default {',
      `  migrations: './migrations',`,
      `  definitions: './definitions.sql',`,
      `  queries: './sql',`,
      '};',
      '',
    ].join('\n'),
  };
}
