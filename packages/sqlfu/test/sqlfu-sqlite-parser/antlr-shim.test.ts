// Tests for the ANTLR-compatibility shim. These assert that shim instances:
//   1. Pass `instanceof` checks against the real ANTLR Context classes.
//   2. Expose accessor methods the analyzer calls, with the same semantics
//      (presence checks, sub-node types, terminal offsets).
//   3. Match the real ANTLR parser's output for the same input SQL on a
//      handful of representative queries.

import {test, expect} from 'vitest';
// Use non-literal import specifiers so TypeScript doesn't descend into the
// vendored typesql-parser tree (which has upstream type errors — the parser
// tree is normally compiled under a separate tsconfig with `noCheck: true`,
// see packages/sqlfu/CLAUDE.md).
const sqliteModSpec = new URL('../../src/vendor/typesql-parser/sqlite/index.js', import.meta.url).href;
const baseModSpec = new URL('../../src/vendor/typesql-parser/index.js', import.meta.url).href;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const antlrSqlite: any = await import(sqliteModSpec);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const antlrBase: any = await import(baseModSpec);
const ExprContext = antlrSqlite.ExprContext;
const Select_stmtContext = antlrSqlite.Select_stmtContext;
const Sql_stmtContext = antlrSqlite.Sql_stmtContext;
const Select_coreContext = antlrSqlite.Select_coreContext;
const Result_columnContext = antlrSqlite.Result_columnContext;
const Table_or_subqueryContext = antlrSqlite.Table_or_subqueryContext;
const parseSqliteAntlr = antlrSqlite.parseSql;
const ParserRuleContext = antlrBase.ParserRuleContext;

import {parseSelectStmt} from '../../src/vendor/sqlfu-sqlite-parser/select_stmt.js';
import {parseInsertStmt, parseUpdateStmt, parseDeleteStmt} from '../../src/vendor/sqlfu-sqlite-parser/dml_stmt.js';
// Shim lives under vendor/typesql/ (excluded from main typecheck) and imports
// the ANTLR parser classes directly — load it via non-literal specifier too.
const shimModSpec = new URL('../../src/vendor/typesql/sqlite-query-analyzer/antlr-shim.js', import.meta.url).href;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shimMod: any = await import(shimModSpec);
const wrapSqlStmt = shimMod.wrapSqlStmt;
const shimParseResult = shimMod.shimParseResult;

// -----------------------------------------------------------------------------
// instanceof compatibility
// -----------------------------------------------------------------------------

test('shim select statement passes instanceof Sql_stmtContext and Select_stmtContext', () => {
	const sql = 'select id from users';
	const parsed = parseSelectStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'select', stmt: parsed});

	expect(wrapped).toBeInstanceOf(Sql_stmtContext);
	expect(wrapped).toBeInstanceOf(ParserRuleContext);

	const selectStmt = wrapped.select_stmt();
	expect(selectStmt).toBeInstanceOf(Select_stmtContext);
	expect(selectStmt).toBeInstanceOf(ParserRuleContext);
	expect(wrapped.insert_stmt()).toBeNull();
	expect(wrapped.update_stmt()).toBeNull();
	expect(wrapped.delete_stmt()).toBeNull();
});

test('shim nodes expose core parser surface (result_column, table, literal, expr)', () => {
	const sql = 'select id, name from users';
	const parsed = parseSelectStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'select', stmt: parsed}).select_stmt();

	const cores = wrapped.select_core_list();
	expect(cores.length).toBe(1);
	expect(cores[0]).toBeInstanceOf(Select_coreContext);

	const rcs = cores[0].result_column_list();
	expect(rcs).toHaveLength(2);
	expect(rcs[0]).toBeInstanceOf(Result_columnContext);
	expect(rcs[0].STAR()).toBeNull();
	expect(rcs[0].expr()).toBeInstanceOf(ExprContext);

	const tables = cores[0].table_or_subquery_list();
	expect(tables).toHaveLength(1);
	expect(tables[0]).toBeInstanceOf(Table_or_subqueryContext);
	expect(tables[0].table_name()?.getText()).toBe('users');
});

test('getText returns exact source substring', () => {
	const sql = 'select id from users where id = 1';
	const parsed = parseSelectStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'select', stmt: parsed}).select_stmt();

	expect(wrapped.getText()).toContain('select id from users where id = 1');
	const where = wrapped.select_core_list()[0]._whereExpr;
	expect(where).toBeDefined();
	expect(where!.getText()).toBe('id = 1');
});

test('extractOriginalSql-style offsets work via start/stop + getInputStream', () => {
	// This mirrors `extractOriginalSql` from traverse.ts:1759.
	const sql = 'select name from users where id = 42';
	const parsed = parseSelectStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'select', stmt: parsed}).select_stmt();
	const selectCore = wrapped.select_core_list()[0];
	const whereExpr = selectCore._whereExpr!;

	const startIndex = whereExpr.start.start;
	const stopIndex = whereExpr.stop?.stop || startIndex;
	const sliced = whereExpr.start.getInputStream()?.getText(startIndex, stopIndex);
	expect(sliced).toBe('id = 42');
});

// -----------------------------------------------------------------------------
// Parity with real ANTLR parser on representative queries
// -----------------------------------------------------------------------------

test('shim produces same basic shape as ANTLR for a simple SELECT', () => {
	const sql = 'select id, name from users where id > 1';
	const antlrResult = parseSqliteAntlr(sql).sql_stmt();
	const shimResult = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)});

	const antlrSel = antlrResult.select_stmt()!;
	const shimSel = shimResult.select_stmt()!;

	expect(shimSel.select_core_list().length).toBe(antlrSel.select_core_list().length);

	const antlrRcs = antlrSel.select_core_list()[0].result_column_list();
	const shimRcs = shimSel.select_core_list()[0].result_column_list();
	expect(shimRcs.length).toBe(antlrRcs.length);

	expect(shimSel.select_core_list()[0].FROM_()).not.toBeNull();
	expect(antlrSel.select_core_list()[0].FROM_()).not.toBeNull();
});

test('shim ExprContext exposes column_name + operator terminals like ANTLR', () => {
	const sql = 'select id from users where status = 1';
	const antlr = parseSqliteAntlr(sql).sql_stmt().select_stmt()!;
	const shim = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)}).select_stmt()!;

	const antlrWhere = antlr.select_core_list()[0]._whereExpr;
	const shimWhere = shim.select_core_list()[0]._whereExpr;
	expect(antlrWhere).toBeDefined();
	expect(shimWhere).toBeDefined();

	// Both should expose ASSIGN() truthy for `=`.
	expect(antlrWhere!.ASSIGN()).not.toBeNull();
	expect(shimWhere!.ASSIGN()).not.toBeNull();

	// expr_list length.
	expect(shimWhere!.expr_list().length).toBe(antlrWhere!.expr_list().length);

	// column_name on LHS.
	const shimLhs = shimWhere!.expr(0);
	const antlrLhs = antlrWhere!.expr(0);
	expect(shimLhs.column_name()?.getText()).toBe(antlrLhs.column_name()?.getText());
});

test('shim IS NULL / IS NOT NULL presence checks match ANTLR', () => {
	const sqls = [
		'select id from users where name is null',
		'select id from users where name is not null',
	];
	for (const sql of sqls) {
		const antlr = parseSqliteAntlr(sql).sql_stmt().select_stmt()!;
		const shim = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)}).select_stmt()!;
		const a = antlr.select_core_list()[0]._whereExpr!;
		const s = shim.select_core_list()[0]._whereExpr!;
		expect(!!s.IS_()).toBe(!!a.IS_());
		expect(!!s.NOT_()).toBe(!!a.NOT_());
	}
});

test('shim IN list matches ANTLR shape (expr_list[1].expr_list yields items)', () => {
	// The enum-parser relies on this specific nested shape.
	const sql = "select id from users where status in ('a', 'b', 'c')";
	const shim = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)}).select_stmt()!;
	const whereExpr = shim.select_core_list()[0]._whereExpr!;

	expect(whereExpr.IN_()).not.toBeNull();
	const outer = whereExpr.expr_list();
	expect(outer.length).toBe(2);
	const items = outer[1].expr_list();
	expect(items.length).toBe(3);
	for (const item of items) {
		expect(item.literal_value()?.STRING_LITERAL()).not.toBeNull();
	}
});

test('shim BETWEEN exposes BETWEEN_ terminal and three sub-exprs', () => {
	const sql = 'select id from users where age between 18 and 65';
	const shim = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)}).select_stmt()!;
	const w = shim.select_core_list()[0]._whereExpr!;
	expect(w.BETWEEN_()).not.toBeNull();
	expect(w.expr_list().length).toBe(3);
});

test('shim function call exposes function_name and expr_list args', () => {
	const sql = 'select count(id) from users';
	const shim = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)}).select_stmt()!;
	const rcExpr = shim.select_core_list()[0].result_column_list()[0].expr()!;
	expect(rcExpr.function_name()?.getText().toLowerCase()).toBe('count');
	expect(rcExpr.expr_list().length).toBe(1);
});

test('shim INSERT statement passes instanceof and exposes values_clause', () => {
	const sql = "insert into users (id, name) values (1, 'x')";
	const parsed = parseInsertStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'insert', stmt: parsed});
	const insertStmt = wrapped.insert_stmt()!;
	expect(insertStmt).toBeInstanceOf(ParserRuleContext);
	expect(insertStmt.table_name().getText()).toBe('users');
	expect(insertStmt.column_name_list().length).toBe(2);
	const values = insertStmt.values_clause();
	expect(values).not.toBeNull();
	const rows = values!.value_row_list();
	expect(rows.length).toBe(1);
	expect(rows[0].expr_list().length).toBe(2);
});

test('shim UPDATE statement exposes WHERE_ terminal offset before WHERE-clause params', () => {
	// This mirrors traverse.ts:2119's use: split params by position of WHERE.
	const sql = "update users set name = ? where id = ?";
	const parsed = parseUpdateStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'update', stmt: parsed}).update_stmt()!;
	const whereTok = wrapped.WHERE_();
	expect(whereTok).not.toBeNull();
	// The WHERE keyword starts at position 21 in that SQL (0-indexed).
	expect(whereTok!.symbol.start).toBe(sql.indexOf('where'));
});

test('shim DELETE without WHERE has null expr (the guarded case)', () => {
	const sql = 'delete from users';
	const parsed = parseDeleteStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'delete', stmt: parsed}).delete_stmt()!;
	expect(wrapped.expr()).toBeNull();
});

test('shim DELETE with WHERE exposes expr via .expr()', () => {
	const sql = 'delete from users where id = 1';
	const parsed = parseDeleteStmt(sql);
	const wrapped = wrapSqlStmt(sql, {kind: 'delete', stmt: parsed}).delete_stmt()!;
	const expr = wrapped.expr();
	expect(expr).not.toBeNull();
	expect(expr!.ASSIGN()).not.toBeNull();
});

// -----------------------------------------------------------------------------
// getChildCount / getChild — for getExpressions walker
// -----------------------------------------------------------------------------

test('shim select-core children include result_columns and where expr so getExpressions walks them', () => {
	const sql = 'select a, b from t where c = 1';
	const shim = wrapSqlStmt(sql, {kind: 'select', stmt: parseSelectStmt(sql)}).select_stmt()!;
	const core = shim.select_core_list()[0];
	expect(core.getChildCount()).toBeGreaterThan(0);
	// walk and count ExprContext descendants — should include both result column exprs and the where expr.
	const exprs: any[] = [];
	const walk = (n: any) => {
		if (n instanceof ExprContext) exprs.push(n);
		const count = typeof n.getChildCount === 'function' ? n.getChildCount() : 0;
		for (let i = 0; i < count; i++) {
			const c = n.getChild(i);
			if (c instanceof ParserRuleContext) walk(c);
		}
	};
	walk(core);
	// Expect at least: result_column `a`, `b`, where `c = 1`, + its LHS/RHS children.
	expect(exprs.length).toBeGreaterThanOrEqual(3);
});

// -----------------------------------------------------------------------------
// sql_stmt_list — used by enum-parser
// -----------------------------------------------------------------------------

test('shimParseResult exposes sql_stmt_list.children for enum-parser', () => {
	const sql = 'select 1; select 2';
	const shim = shimParseResult(sql, [
		{kind: 'select', stmt: parseSelectStmt('select 1')},
		{kind: 'select', stmt: parseSelectStmt('select 2')},
	]);
	const list = shim.sql_stmt_list();
	expect(list.children).toHaveLength(2);
	for (const child of list.children) {
		expect(child).toBeInstanceOf(Sql_stmtContext);
	}
});
