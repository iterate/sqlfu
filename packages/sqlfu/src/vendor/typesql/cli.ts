/*
 * Vendored from https://github.com/wsporto/typesql at
 * f0356201d41f3f317824968a3f1c7a90fbafdc99 (MIT).
 *
 * Local modifications:
 * - add ESM-compatible relative imports
 * - expose config loading and compile for sqlfu's in-process adapter
 * - remove the upstream CLI layer; sqlfu calls compile() directly
 * - disable upstream watch mode; sqlfu currently only calls compile(false, ...)
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateTsFile, writeFile } from './codegen/code-generator.js';
import type { ColumnSchema, Table } from './mysql-query-analyzer/types.js';
import type { TypeSqlConfig, DatabaseClient, TypeSqlDialect, SQLiteClient, CrudQueryType } from './types.js';
import {glob, type Either, isLeft, left, uniqBy} from '../small-utils.js';
import { closeClient, createClient, loadSchemaInfo, SchemaInfo, selectTables } from './schema-info.js';
import { buildExportList, buildExportMap, loadConfig, resolveTsFilePath } from './load-config.js';
import { createCodeBlockWriter } from './codegen/shared/codegen-util.js';
import { generateCrud } from './codegen/sqlite.js';

const CRUD_FOLDER = 'crud';

export function loadVendoredConfig(configPath: string): TypeSqlConfig {
	return loadConfig(configPath);
}

function validateDirectories(dir: string) {
	if (!fs.statSync(dir).isDirectory()) {
		console.log(`The argument is not a directory: ${dir}`);
	}
}

async function rewiteFiles(client: DatabaseClient, sqlPath: string, sqlDir: string, outDir: string, schemaInfo: SchemaInfo, isCrudFile: boolean, config: TypeSqlConfig) {
	const tsFilePath = resolveTsFilePath(sqlPath, sqlDir, outDir);
	await generateTsFile(client, sqlPath, tsFilePath, schemaInfo, isCrudFile);
	const tsDir = path.dirname(tsFilePath);
	writeIndexFileFor(tsDir, config);
}

export async function compile(watch: boolean, config: TypeSqlConfig) {
	const { sqlDir, outDir = sqlDir, databaseUri, client: dialect, attach, loadExtensions } = config;
	validateDirectories(sqlDir);

	const databaseClientResult = await createClient(databaseUri, dialect, attach, loadExtensions);
	if (databaseClientResult.isErr()) {
		console.error(`Error: ${databaseClientResult.error.description}.`);
		return;
	}

	const includeCrudTables = config.includeCrudTables || [];
	const databaseClient = databaseClientResult.value;

	const dbSchema = await loadSchemaInfo(databaseClient, config.schemas);
	if (dbSchema.isErr()) {
		console.error(`Error: ${dbSchema.error.description}.`);
		return;
	}

	await generateCrudTables(outDir, dbSchema.value, includeCrudTables);
	const dirGlob = `${sqlDir}/**/*.sql`;

	const sqlFiles = await glob(dirGlob);

	const filesGeneration = sqlFiles.map((sqlPath) => generateTsFile(databaseClient, sqlPath, resolveTsFilePath(sqlPath, sqlDir, outDir), dbSchema.value, isCrudFile(sqlDir, sqlPath)));
	await Promise.all(filesGeneration);

	writeIndexFile(outDir, config);

	if (watch) {
		closeClient(databaseClient);
		throw new Error('Vendored TypeSQL watch mode is disabled in sqlfu.');
	}

	closeClient(databaseClient);
}

function writeIndexFile(outDir: string, config: TypeSqlConfig) {
	const exportMap = buildExportMap(outDir);
	for (const [dir, files] of exportMap.entries()) {
		const indexContent = generateIndexContent(files, config.moduleExtension);
		const indexPath = path.join(dir, 'index.ts');
		writeFile(indexPath, indexContent);
	}
}

function writeIndexFileFor(tsDir: string, config: TypeSqlConfig) {
	if (fs.existsSync(tsDir)) {
		const tsFiles = buildExportList(tsDir);
		const indexContent = generateIndexContent(tsFiles, config.moduleExtension);
		const tsPath = path.join(tsDir, 'index.ts');
		writeFile(tsPath, indexContent);
	}
}

//Move to code-generator
function generateIndexContent(tsFiles: string[], moduleExtension: TypeSqlConfig['moduleExtension']) {
	const writer = createCodeBlockWriter();
	for (const filePath of tsFiles) {
		const fileName = path.basename(filePath, '.ts'); //remove the ts extension
		const suffix = moduleExtension ? `.${moduleExtension}` : '.js';
		writer.writeLine(`export * from "./${fileName}${suffix}";`);
	}
	return writer.toString();
}

function _filterTables(schemaInfo: SchemaInfo, includeCrudTables: string[]) {
	const allTables = schemaInfo.columns.map(col => ({ schema: col.schema, table: col.table } satisfies Table));
	const uniqueTables = uniqBy(allTables, (item) => `${item.schema}:${item.table}`);
	const filteredTables = filterTables(uniqueTables, includeCrudTables);
	return filteredTables;
}

async function generateCrudTables(sqlFolderPath: string, schemaInfo: SchemaInfo, includeCrudTables: string[]) {

	const filteredTables = _filterTables(schemaInfo, includeCrudTables);
	for (const tableInfo of filteredTables) {
		const tableName = tableInfo.table;
		const filePath = `${sqlFolderPath}/${CRUD_FOLDER}/${tableName}/`;
		if (schemaInfo.kind === 'mysql2') {
			const columns = schemaInfo.columns.filter((col) => col.table === tableName);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}select-from-${tableName}.sql`, 'select', tableName, columns);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}insert-into-${tableName}.sql`, 'insert', tableName, columns);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}update-${tableName}.sql`, 'update', tableName, columns);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}delete-from-${tableName}.sql`, 'delete', tableName, columns);
		} else {
			generateAndWriteCrud(schemaInfo.kind, `${filePath}select-from-${tableName}.ts`, 'Select', tableName, schemaInfo.columns);
			generateAndWriteCrud(schemaInfo.kind, `${filePath}insert-into-${tableName}.ts`, 'Insert', tableName, schemaInfo.columns);
			generateAndWriteCrud(schemaInfo.kind, `${filePath}update-${tableName}.ts`, 'Update', tableName, schemaInfo.columns);
			generateAndWriteCrud(schemaInfo.kind, `${filePath}delete-from-${tableName}.ts`, 'Delete', tableName, schemaInfo.columns);
		}
	}
}

function generateAndWriteCrud(client: SQLiteClient, filePath: string, queryType: CrudQueryType, tableName: string, columns: ColumnSchema[]) {
	const content = generateCrud(client, queryType, tableName, columns);
	writeFile(filePath, content);
	console.log('Generated file:', filePath);
}

function filterTables(allTables: Table[], includeCrudTables: string[]) {
	const selectAll = includeCrudTables.find((filter) => filter === '*');
	return selectAll ? allTables : allTables.filter((t) => includeCrudTables.find((t2) => t.table === t2) != null);
}

async function selectAllTables(client: DatabaseClient): Promise<Either<string, Table[]>> {
	const selectTablesResult = await selectTables(client);
	if (isLeft(selectTablesResult)) {
		return left(`Error selecting table names: ${selectTablesResult.left.description}`);
	}
	return selectTablesResult;
}

//https://stackoverflow.com/a/45242825
function isCrudFile(sqlDir: string, sqlFile: string): boolean {
	const relative = path.relative(`${sqlDir}/${CRUD_FOLDER}`, sqlFile);
	const result = relative != null && !relative.startsWith('..') && !path.isAbsolute(relative);
	return result;
}
