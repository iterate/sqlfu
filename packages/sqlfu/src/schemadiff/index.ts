import {createDefaultSqlite3defConfig, diffBaselineSqlToDesiredSql} from './sqlite3def.js';

export async function diffSchemaSql(input: {
  projectRoot: string;
  baselineSql: string;
  desiredSql: string;
  enableDrop: boolean;
}): Promise<string[]> {
  return diffBaselineSqlToDesiredSql(projectConfigForRoot(input.projectRoot), {
    baselineSql: input.baselineSql,
    desiredSql: input.desiredSql,
    enableDrop: input.enableDrop,
  });
}

function projectConfigForRoot(projectRoot: string) {
  return {
    ...createDefaultSqlite3defConfig('project'),
    projectRoot,
  };
}
