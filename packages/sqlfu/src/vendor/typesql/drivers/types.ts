// sqlite-only for now; this upstream TaskEither-based driver abstraction is unused here.
import { PostgresSimpleType } from '../sqlite-query-analyzer/types.js';
import { PostgresSchemaInfo } from '../schema-info.js';
import { NamedParamInfo } from '../types.js';

export type PostgresColumnSchema = {
	schema: string;
	table: string;
	column_name: string;
	type: PostgresSimpleType;
	is_nullable: boolean;
	column_key: 'PRI' | 'UNI' | '';
	autoincrement?: boolean;
	column_default?: true;
};

export type DescribeQueryColumn = {
	name: string;
	tableId: number;
	typeId: number;

}

export type DescribeParameters = {
	sql: string;
	postgresDescribeResult: PostgresDescribe;
	schemaInfo: PostgresSchemaInfo;
	namedParameters: NamedParamInfo[];
	hasOrderBy: boolean;
}

export type PostgresDescribe = {
	parameters: number[];
	columns: DescribeQueryColumn[];
}
export type DescribeQueryResult = PostgresDescribe & {
	multipleRowsResult: boolean;
}

export type PostgresTypeHash = { [key: number]: PostgresSimpleType | undefined }

export type Driver<Connection> = {
	loadDbSchema: (conn: Connection) => unknown;
}
