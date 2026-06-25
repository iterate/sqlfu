import {joinPath} from './paths.js';

const defaultSqlfuConfigFileName = 'sqlfu.config.ts';
export type InitPreviewFormat = 'inline' | 'file-backed';

export function createDefaultInitPreview(
  projectRoot: string,
  input: {configPath?: string; format?: InitPreviewFormat} = {},
) {
  const format = input.format || 'inline';
  return {
    projectRoot,
    configPath: input.configPath || joinPath(projectRoot, defaultSqlfuConfigFileName),
    format,
    configContents: format === 'file-backed' ? fileBackedConfigContents() : inlineConfigContents(),
  };
}

function inlineConfigContents() {
  return [
    "import {defineConfig, sql} from 'sqlfu';",
    '',
    'export default defineConfig({',
    '  definitions: sql`',
    '    create table posts (',
    '      id integer primary key autoincrement,',
    '      title text not null,',
    '      body text not null',
    '    );',
    '  `,',
    '  queries: {',
    '    listPosts: sql`',
    '      select id, title, body',
    '      from posts',
    '      order by id desc',
    '    `,',
    '  },',
    '});',
    '',
  ].join('\n');
}

function fileBackedConfigContents() {
  return [
    'export default {',
    `  migrations: './migrations',`,
    `  definitions: './definitions.sql',`,
    `  queries: './sql',`,
    '};',
    '',
  ].join('\n');
}
