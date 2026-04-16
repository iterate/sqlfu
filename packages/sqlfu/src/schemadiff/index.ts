import {diffBaselineSqlToDesiredSqlNative} from './sqlite/index.js';

export async function diffSchemaSql(input: {
  projectRoot: string;
  baselineSql: string;
  desiredSql: string;
  allowDestructive: boolean;
}): Promise<string[]> {
  return diffBaselineSqlToDesiredSqlNative(projectConfigForRoot(input.projectRoot), {
    baselineSql: input.baselineSql,
    desiredSql: input.desiredSql,
    allowDestructive: input.allowDestructive,
  });
}

function projectConfigForRoot(projectRoot: string) {
  return {
    projectRoot,
  };
}
