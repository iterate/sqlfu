import {expect, test} from 'vitest';
import {parseSelectStmt} from '../../src/vendor/sqlfu-sqlite-parser/select_stmt.js';
import {parseInsertStmt, parseUpdateStmt} from '../../src/vendor/sqlfu-sqlite-parser/dml_stmt.js';

// SQLite's grammar lets non-reserved keywords (per
// https://www.sqlite.org/lang_keywords.html) be used as bare identifiers in
// identifier position. The user-facing motivator is event-log schemas with a
// column named `offset`, which is a non-reserved keyword in SQLite — `select
// offset from t` should work without quoting.

test('OFFSET as a bare column name in SELECT', () => {
	const stmt = parseSelectStmt(`select offset from events`);
	expect(stmt.select_cores[0].result_columns).toMatchObject([
		{kind: 'Expr', expr: {kind: 'ColumnRef', column: 'offset'}},
	]);
});

test('OFFSET alongside other columns', () => {
	const stmt = parseSelectStmt(`select id, offset, payload from events order by offset`);
	expect(stmt.select_cores[0].result_columns).toMatchObject([
		{expr: {column: 'id'}},
		{expr: {column: 'offset'}},
		{expr: {column: 'payload'}},
	]);
	expect(stmt.order_by).toMatchObject({
		terms: [{expr: {column: 'offset'}}],
	});
});

test('qualified OFFSET column reference', () => {
	const stmt = parseSelectStmt(`select e.offset from events e where e.offset > ?`);
	expect(stmt.select_cores[0].result_columns).toMatchObject([
		{expr: {kind: 'ColumnRef', table: 'e', column: 'offset'}},
	]);
});

test('OFFSET in INSERT column list', () => {
	const stmt = parseInsertStmt(`insert into events (id, offset, payload) values (?, ?, ?)`);
	expect(stmt.columns).toEqual(['id', 'offset', 'payload']);
});

test('OFFSET in UPDATE SET', () => {
	const stmt = parseUpdateStmt(`update events set offset = ? where id = ?`);
	expect(stmt.assignments).toMatchObject([{columns: ['offset']}]);
});

test('LIMIT … OFFSET still parses as the clause, not an identifier', () => {
	const stmt = parseSelectStmt(`select * from events limit 10 offset 20`);
	expect(stmt.limit).toMatchObject({
		expr: {value: '10'},
		offset: {value: '20'},
	});
});

test('OFFSET as a column with explicit LIMIT … OFFSET clause', () => {
	const stmt = parseSelectStmt(`select offset from events order by offset limit 10 offset 5`);
	expect(stmt.select_cores[0].result_columns).toMatchObject([
		{expr: {column: 'offset'}},
	]);
	expect(stmt.limit).toMatchObject({expr: {value: '10'}, offset: {value: '5'}});
});
