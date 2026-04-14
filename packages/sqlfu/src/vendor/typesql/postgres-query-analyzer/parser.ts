import { parseSql as _parseSql } from '../../typesql-parser/postgres/index.js';
import { defaultOptions, PostgresTraverseResult, traverseSmt } from './traverse.js';
import { PostgresColumnSchema } from '../drivers/types.js';
import { Result, err, ok } from 'neverthrow';
import { CheckConstraintResult } from '../drivers/postgres.js';
import { UserFunctionSchema } from './types.js';

export function parseSql(sql: string, dbSchema: PostgresColumnSchema[], checkConstraints: CheckConstraintResult, userFunctions: UserFunctionSchema[], options = defaultOptions()): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt(), dbSchema, checkConstraints, userFunctions, options);

	return {
		...traverseResult,
		columns: traverseResult.columns.map(({ column_key: _, ...rest }) => rest)
	};
}

export function safeParseSql(sql: string, dbSchema: PostgresColumnSchema[], checkConstraints: CheckConstraintResult, userFunctions: UserFunctionSchema[], options = defaultOptions()): Result<PostgresTraverseResult, string> {
	try {
		const result = parseSql(sql, dbSchema, checkConstraints, userFunctions, options);
		return ok(result);
	}
	catch (e) {
		const error = e as Error;
		return err(error.message);
	}
}
