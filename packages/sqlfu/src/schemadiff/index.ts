import {createDefaultSqlite3defConfig, diffSnapshotSqlToDesiredSql} from './sqlite3def.js';

export async function diffSchemaSql(input: {
  projectRoot: string;
  baselineSql: string;
  desiredSql: string;
}): Promise<string[]> {
  return diffSnapshotSqlToDesiredSql(projectConfigForRoot(input.projectRoot), {
    snapshotSql: input.baselineSql,
    desiredSql: input.desiredSql,
  });
}

function projectConfigForRoot(projectRoot: string) {
  return {
    ...createDefaultSqlite3defConfig('project'),
    projectRoot,
  };
}
