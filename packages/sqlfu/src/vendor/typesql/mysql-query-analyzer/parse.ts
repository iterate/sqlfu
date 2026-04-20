// sqlfu: the upstream parse.ts eagerly instantiates `new MySQLParser(...)`
// at module top level, which forces the 2+ MB of MySQL parse tables into any
// bundle that imports this file. The sqlite path imports AST-walking helpers
// (extractOrderByParameters, getLimitOptions, etc.) from here but never parses
// MySQL, so we've dropped the mysql-parse functions entirely. If/when upstream
// typesql's MySQL codegen is used in sqlfu again, restore the removed exports
// (`parse`, `parseAndInfer`, `parseAndInferParamNullability`, `extractQueryInfo`,
// `isMultipleRowResult`) from the commit that matches this vendor tree's pin.
import { TerminalNode, ParseTree, ParserRuleContext } from '../../typesql-parser/index.js';
import {
	type QueryExpressionBodyContext,
	type InsertQueryExpressionContext,
	type SelectItemContext,
	type SelectStatementContext,
	type SubqueryContext,
	FunctionCallContext,
	QuerySpecificationContext,
	SimpleExprWindowingFunctionContext,
	SumExprContext,
	WindowingClauseContext,
} from '../../typesql-parser/mysql/MySQLParser.js';
import type { ParameterInfo } from './types.js';

export function extractOrderByParameters(selectStatement: SelectStatementContext) {
	return (
		selectStatement
			.queryExpression()
			?.orderClause()
			?.orderList()
			.orderExpression_list()
			.filter((orderExpr) => orderExpr.getText() === '?')
			.map((orderExpr) => orderExpr.getText()) || []
	);
}

export function extractLimitParameters(selectStatement: SelectStatementContext): ParameterInfo[] {
	return (
		getLimitOptions(selectStatement)
			.filter((limit) => limit.PARAM_MARKER())
			.map(() => {
				const paramInfo: ParameterInfo = {
					type: 'bigint',
					notNull: true
				};
				return paramInfo;
			}) || []
	);
}

export function isSumExpressContext(selectItem: ParseTree) {
	if (selectItem instanceof SimpleExprWindowingFunctionContext || selectItem instanceof TerminalNode) {
		return false;
	}

	if (selectItem instanceof SumExprContext) {
		if (selectItem.children) {
			for (const child of selectItem.children) {
				if (child instanceof WindowingClauseContext) {
					return false;
				}
			}
		}
		return true;
	}
	if (selectItem instanceof FunctionCallContext) {
		if (selectItem.qualifiedIdentifier()?.getText().toLowerCase() === 'avg') {
			return true;
		}
	}
	if (selectItem instanceof ParserRuleContext && selectItem.getChildCount() === 1) {
		return isSumExpressContext(selectItem.getChild(0));
	}
	return false;
}

export function getLimitOptions(selectStatement: SelectStatementContext) {
	return selectStatement.queryExpression()?.limitClause()?.limitOptions().limitOption_list() || [];
}

export function getAllQuerySpecificationsFromSelectStatement(
	selectStatement: SelectStatementContext | QueryExpressionBodyContext | InsertQueryExpressionContext | SubqueryContext
) {
	const result: QuerySpecificationContext[] = [];
	collectAllQuerySpecifications(selectStatement, result);
	return result;
}

function collectAllQuerySpecifications(tree: ParserRuleContext, result: QuerySpecificationContext[]) {
	for (let i = 0; i < tree.getChildCount(); i++) {
		const child = tree.getChild(i);
		if (child instanceof QuerySpecificationContext) {
			result.push(child);
		} else if (child instanceof ParserRuleContext) {
			collectAllQuerySpecifications(child, result);
		}
	}
}

// SelectItemContext kept in the import list above so type-only usages elsewhere
// (if any resync brings them back) continue to resolve without touching MySQLParser.
type _KeepSelectItemContext = SelectItemContext;
void ({} as _KeepSelectItemContext);
