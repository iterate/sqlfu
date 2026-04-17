/*
 * sqlfu schema diff entrypoint.
 *
 * The sqlfu schemadiff engine is inspired by @pgkit/schemainspect and @pgkit/migra
 * (https://github.com/mmkal/pgkit), which are themselves TypeScript ports of djrobstep's
 * Python `schemainspect` and `migra` (https://github.com/djrobstep/schemainspect and
 * https://github.com/djrobstep/migra). The SQLite implementation under ./sqlite is sqlfu-specific
 * and does not copy code from those projects. See ./AGENTS.md for the broader inspiration notes.
 */
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
