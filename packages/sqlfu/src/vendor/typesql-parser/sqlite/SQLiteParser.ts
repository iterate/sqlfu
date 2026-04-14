// Generated from ./src/grammar/sqlite/SQLiteParser.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
	ATN,
	ATNDeserializer, DecisionState, DFA, FailedPredicateException,
	RecognitionException, NoViableAltException, BailErrorStrategy,
	Parser, ParserATNSimulator,
	RuleContext, ParserRuleContext, PredictionMode, PredictionContextCache,
	TerminalNode, RuleNode,
	Token, TokenStream,
	Interval, IntervalSet
} from '../../antlr4/index.js';
// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class SQLiteParser extends Parser {
	public static readonly SCOL = 1;
	public static readonly DOT = 2;
	public static readonly OPEN_PAR = 3;
	public static readonly CLOSE_PAR = 4;
	public static readonly COMMA = 5;
	public static readonly ASSIGN = 6;
	public static readonly STAR = 7;
	public static readonly PLUS = 8;
	public static readonly MINUS = 9;
	public static readonly TILDE = 10;
	public static readonly PIPE2 = 11;
	public static readonly DIV = 12;
	public static readonly MOD = 13;
	public static readonly LT2 = 14;
	public static readonly GT2 = 15;
	public static readonly AMP = 16;
	public static readonly PIPE = 17;
	public static readonly LT = 18;
	public static readonly LT_EQ = 19;
	public static readonly GT = 20;
	public static readonly GT_EQ = 21;
	public static readonly EQ = 22;
	public static readonly NOT_EQ1 = 23;
	public static readonly NOT_EQ2 = 24;
	public static readonly ABORT_ = 25;
	public static readonly ACTION_ = 26;
	public static readonly ADD_ = 27;
	public static readonly AFTER_ = 28;
	public static readonly ALL_ = 29;
	public static readonly ALTER_ = 30;
	public static readonly ANALYZE_ = 31;
	public static readonly AND_ = 32;
	public static readonly AS_ = 33;
	public static readonly ASC_ = 34;
	public static readonly ATTACH_ = 35;
	public static readonly AUTOINCREMENT_ = 36;
	public static readonly BEFORE_ = 37;
	public static readonly BEGIN_ = 38;
	public static readonly BETWEEN_ = 39;
	public static readonly BY_ = 40;
	public static readonly CASCADE_ = 41;
	public static readonly CASE_ = 42;
	public static readonly CAST_ = 43;
	public static readonly CHECK_ = 44;
	public static readonly COLLATE_ = 45;
	public static readonly COLUMN_ = 46;
	public static readonly COMMIT_ = 47;
	public static readonly CONFLICT_ = 48;
	public static readonly CONSTRAINT_ = 49;
	public static readonly CREATE_ = 50;
	public static readonly CROSS_ = 51;
	public static readonly CURRENT_DATE_ = 52;
	public static readonly CURRENT_TIME_ = 53;
	public static readonly CURRENT_TIMESTAMP_ = 54;
	public static readonly DATABASE_ = 55;
	public static readonly DEFAULT_ = 56;
	public static readonly DEFERRABLE_ = 57;
	public static readonly DEFERRED_ = 58;
	public static readonly DELETE_ = 59;
	public static readonly DESC_ = 60;
	public static readonly DETACH_ = 61;
	public static readonly DISTINCT_ = 62;
	public static readonly DROP_ = 63;
	public static readonly EACH_ = 64;
	public static readonly ELSE_ = 65;
	public static readonly END_ = 66;
	public static readonly ESCAPE_ = 67;
	public static readonly EXCEPT_ = 68;
	public static readonly EXCLUSIVE_ = 69;
	public static readonly EXISTS_ = 70;
	public static readonly EXPLAIN_ = 71;
	public static readonly FAIL_ = 72;
	public static readonly FOR_ = 73;
	public static readonly FOREIGN_ = 74;
	public static readonly FROM_ = 75;
	public static readonly FULL_ = 76;
	public static readonly GLOB_ = 77;
	public static readonly GROUP_ = 78;
	public static readonly HAVING_ = 79;
	public static readonly IF_ = 80;
	public static readonly IGNORE_ = 81;
	public static readonly IMMEDIATE_ = 82;
	public static readonly IN_ = 83;
	public static readonly INDEX_ = 84;
	public static readonly INDEXED_ = 85;
	public static readonly INITIALLY_ = 86;
	public static readonly INNER_ = 87;
	public static readonly INSERT_ = 88;
	public static readonly INSTEAD_ = 89;
	public static readonly INTERSECT_ = 90;
	public static readonly INTO_ = 91;
	public static readonly IS_ = 92;
	public static readonly ISNULL_ = 93;
	public static readonly JOIN_ = 94;
	public static readonly KEY_ = 95;
	public static readonly LEFT_ = 96;
	public static readonly LIKE_ = 97;
	public static readonly LIMIT_ = 98;
	public static readonly MATCH_ = 99;
	public static readonly NATURAL_ = 100;
	public static readonly NO_ = 101;
	public static readonly NOT_ = 102;
	public static readonly NOTNULL_ = 103;
	public static readonly NULL_ = 104;
	public static readonly OF_ = 105;
	public static readonly OFFSET_ = 106;
	public static readonly ON_ = 107;
	public static readonly OR_ = 108;
	public static readonly ORDER_ = 109;
	public static readonly OUTER_ = 110;
	public static readonly PLAN_ = 111;
	public static readonly PRAGMA_ = 112;
	public static readonly PRIMARY_ = 113;
	public static readonly QUERY_ = 114;
	public static readonly RAISE_ = 115;
	public static readonly RECURSIVE_ = 116;
	public static readonly REFERENCES_ = 117;
	public static readonly REGEXP_ = 118;
	public static readonly REINDEX_ = 119;
	public static readonly RELEASE_ = 120;
	public static readonly RENAME_ = 121;
	public static readonly REPLACE_ = 122;
	public static readonly RESTRICT_ = 123;
	public static readonly RETURNING_ = 124;
	public static readonly RIGHT_ = 125;
	public static readonly ROLLBACK_ = 126;
	public static readonly ROW_ = 127;
	public static readonly ROWS_ = 128;
	public static readonly SAVEPOINT_ = 129;
	public static readonly SELECT_ = 130;
	public static readonly SET_ = 131;
	public static readonly TABLE_ = 132;
	public static readonly TEMP_ = 133;
	public static readonly TEMPORARY_ = 134;
	public static readonly THEN_ = 135;
	public static readonly TO_ = 136;
	public static readonly TRANSACTION_ = 137;
	public static readonly TRIGGER_ = 138;
	public static readonly UNION_ = 139;
	public static readonly UNIQUE_ = 140;
	public static readonly UPDATE_ = 141;
	public static readonly USING_ = 142;
	public static readonly VACUUM_ = 143;
	public static readonly VALUES_ = 144;
	public static readonly VIEW_ = 145;
	public static readonly VIRTUAL_ = 146;
	public static readonly WHEN_ = 147;
	public static readonly WHERE_ = 148;
	public static readonly WITH_ = 149;
	public static readonly WITHOUT_ = 150;
	public static readonly FIRST_VALUE_ = 151;
	public static readonly OVER_ = 152;
	public static readonly PARTITION_ = 153;
	public static readonly RANGE_ = 154;
	public static readonly PRECEDING_ = 155;
	public static readonly UNBOUNDED_ = 156;
	public static readonly CURRENT_ = 157;
	public static readonly FOLLOWING_ = 158;
	public static readonly CUME_DIST_ = 159;
	public static readonly DENSE_RANK_ = 160;
	public static readonly LAG_ = 161;
	public static readonly LAST_VALUE_ = 162;
	public static readonly LEAD_ = 163;
	public static readonly NTH_VALUE_ = 164;
	public static readonly NTILE_ = 165;
	public static readonly PERCENT_RANK_ = 166;
	public static readonly RANK_ = 167;
	public static readonly ROW_NUMBER_ = 168;
	public static readonly GENERATED_ = 169;
	public static readonly ALWAYS_ = 170;
	public static readonly STORED_ = 171;
	public static readonly TRUE_ = 172;
	public static readonly FALSE_ = 173;
	public static readonly WINDOW_ = 174;
	public static readonly NULLS_ = 175;
	public static readonly FIRST_ = 176;
	public static readonly LAST_ = 177;
	public static readonly FILTER_ = 178;
	public static readonly GROUPS_ = 179;
	public static readonly EXCLUDE_ = 180;
	public static readonly TIES_ = 181;
	public static readonly OTHERS_ = 182;
	public static readonly DO_ = 183;
	public static readonly NOTHING_ = 184;
	public static readonly IDENTIFIER = 185;
	public static readonly NUMERIC_LITERAL = 186;
	public static readonly BIND_PARAMETER = 187;
	public static readonly STRING_LITERAL = 188;
	public static readonly BLOB_LITERAL = 189;
	public static readonly SINGLE_LINE_COMMENT = 190;
	public static readonly MULTILINE_COMMENT = 191;
	public static readonly SPACES = 192;
	public static readonly UNEXPECTED_CHAR = 193;
	public static override readonly EOF = Token.EOF;
	public static readonly RULE_parse = 0;
	public static readonly RULE_sql_stmt_list = 1;
	public static readonly RULE_sql_stmt = 2;
	public static readonly RULE_alter_table_stmt = 3;
	public static readonly RULE_analyze_stmt = 4;
	public static readonly RULE_attach_stmt = 5;
	public static readonly RULE_begin_stmt = 6;
	public static readonly RULE_commit_stmt = 7;
	public static readonly RULE_rollback_stmt = 8;
	public static readonly RULE_savepoint_stmt = 9;
	public static readonly RULE_release_stmt = 10;
	public static readonly RULE_create_index_stmt = 11;
	public static readonly RULE_indexed_column = 12;
	public static readonly RULE_create_table_stmt = 13;
	public static readonly RULE_column_def = 14;
	public static readonly RULE_type_name = 15;
	public static readonly RULE_column_constraint = 16;
	public static readonly RULE_signed_number = 17;
	public static readonly RULE_table_constraint = 18;
	public static readonly RULE_foreign_key_clause = 19;
	public static readonly RULE_conflict_clause = 20;
	public static readonly RULE_create_trigger_stmt = 21;
	public static readonly RULE_create_view_stmt = 22;
	public static readonly RULE_create_virtual_table_stmt = 23;
	public static readonly RULE_with_clause = 24;
	public static readonly RULE_cte_table_name = 25;
	public static readonly RULE_recursive_cte = 26;
	public static readonly RULE_common_table_expression = 27;
	public static readonly RULE_delete_stmt = 28;
	public static readonly RULE_delete_stmt_limited = 29;
	public static readonly RULE_detach_stmt = 30;
	public static readonly RULE_drop_stmt = 31;
	public static readonly RULE_expr = 32;
	public static readonly RULE_raise_function = 33;
	public static readonly RULE_literal_value = 34;
	public static readonly RULE_value_row = 35;
	public static readonly RULE_values_clause = 36;
	public static readonly RULE_insert_stmt = 37;
	public static readonly RULE_returning_clause = 38;
	public static readonly RULE_upsert_clause = 39;
	public static readonly RULE_pragma_stmt = 40;
	public static readonly RULE_pragma_value = 41;
	public static readonly RULE_reindex_stmt = 42;
	public static readonly RULE_select_stmt = 43;
	public static readonly RULE_join_clause = 44;
	public static readonly RULE_select_core = 45;
	public static readonly RULE_factored_select_stmt = 46;
	public static readonly RULE_simple_select_stmt = 47;
	public static readonly RULE_compound_select_stmt = 48;
	public static readonly RULE_table_or_subquery = 49;
	public static readonly RULE_result_column = 50;
	public static readonly RULE_join_operator = 51;
	public static readonly RULE_join_constraint = 52;
	public static readonly RULE_compound_operator = 53;
	public static readonly RULE_update_stmt = 54;
	public static readonly RULE_column_name_list = 55;
	public static readonly RULE_update_stmt_limited = 56;
	public static readonly RULE_qualified_table_name = 57;
	public static readonly RULE_vacuum_stmt = 58;
	public static readonly RULE_filter_clause = 59;
	public static readonly RULE_window_defn = 60;
	public static readonly RULE_over_clause = 61;
	public static readonly RULE_frame_spec = 62;
	public static readonly RULE_frame_clause = 63;
	public static readonly RULE_simple_function_invocation = 64;
	public static readonly RULE_aggregate_function_invocation = 65;
	public static readonly RULE_window_function_invocation = 66;
	public static readonly RULE_common_table_stmt = 67;
	public static readonly RULE_order_by_stmt = 68;
	public static readonly RULE_limit_stmt = 69;
	public static readonly RULE_ordering_term = 70;
	public static readonly RULE_asc_desc = 71;
	public static readonly RULE_frame_left = 72;
	public static readonly RULE_frame_right = 73;
	public static readonly RULE_frame_single = 74;
	public static readonly RULE_window_function = 75;
	public static readonly RULE_offset = 76;
	public static readonly RULE_default_value = 77;
	public static readonly RULE_partition_by = 78;
	public static readonly RULE_order_by_expr = 79;
	public static readonly RULE_order_by_expr_asc_desc = 80;
	public static readonly RULE_expr_asc_desc = 81;
	public static readonly RULE_initial_select = 82;
	public static readonly RULE_recursive_select = 83;
	public static readonly RULE_unary_operator = 84;
	public static readonly RULE_error_message = 85;
	public static readonly RULE_module_argument = 86;
	public static readonly RULE_column_alias = 87;
	public static readonly RULE_keyword = 88;
	public static readonly RULE_name = 89;
	public static readonly RULE_function_name = 90;
	public static readonly RULE_schema_name = 91;
	public static readonly RULE_table_name = 92;
	public static readonly RULE_table_or_index_name = 93;
	public static readonly RULE_column_name = 94;
	public static readonly RULE_collation_name = 95;
	public static readonly RULE_foreign_table = 96;
	public static readonly RULE_index_name = 97;
	public static readonly RULE_trigger_name = 98;
	public static readonly RULE_view_name = 99;
	public static readonly RULE_module_name = 100;
	public static readonly RULE_pragma_name = 101;
	public static readonly RULE_savepoint_name = 102;
	public static readonly RULE_table_alias = 103;
	public static readonly RULE_transaction_name = 104;
	public static readonly RULE_window_name = 105;
	public static readonly RULE_alias = 106;
	public static readonly RULE_filename = 107;
	public static readonly RULE_base_window_name = 108;
	public static readonly RULE_simple_func = 109;
	public static readonly RULE_aggregate_func = 110;
	public static readonly RULE_table_function_name = 111;
	public static readonly RULE_any_name = 112;
	public static readonly literalNames: (string | null)[] = [null, "';'",
		"'.'", "'('",
		"')'", "','",
		"'='", "'*'",
		"'+'", "'-'",
		"'~'", "'||'",
		"'/'", "'%'",
		"'<<'", "'>>'",
		"'&'", "'|'",
		"'<'", "'<='",
		"'>'", "'>='",
		"'=='", "'!='",
		"'<>'", "'ABORT'",
		"'ACTION'",
		"'ADD'", "'AFTER'",
		"'ALL'", "'ALTER'",
		"'ANALYZE'",
		"'AND'", "'AS'",
		"'ASC'", "'ATTACH'",
		"'AUTOINCREMENT'",
		"'BEFORE'",
		"'BEGIN'", "'BETWEEN'",
		"'BY'", "'CASCADE'",
		"'CASE'", "'CAST'",
		"'CHECK'", "'COLLATE'",
		"'COLUMN'",
		"'COMMIT'",
		"'CONFLICT'",
		"'CONSTRAINT'",
		"'CREATE'",
		"'CROSS'", "'CURRENT_DATE'",
		"'CURRENT_TIME'",
		"'CURRENT_TIMESTAMP'",
		"'DATABASE'",
		"'DEFAULT'",
		"'DEFERRABLE'",
		"'DEFERRED'",
		"'DELETE'",
		"'DESC'", "'DETACH'",
		"'DISTINCT'",
		"'DROP'", "'EACH'",
		"'ELSE'", "'END'",
		"'ESCAPE'",
		"'EXCEPT'",
		"'EXCLUSIVE'",
		"'EXISTS'",
		"'EXPLAIN'",
		"'FAIL'", "'FOR'",
		"'FOREIGN'",
		"'FROM'", "'FULL'",
		"'GLOB'", "'GROUP'",
		"'HAVING'",
		"'IF'", "'IGNORE'",
		"'IMMEDIATE'",
		"'IN'", "'INDEX'",
		"'INDEXED'",
		"'INITIALLY'",
		"'INNER'", "'INSERT'",
		"'INSTEAD'",
		"'INTERSECT'",
		"'INTO'", "'IS'",
		"'ISNULL'",
		"'JOIN'", "'KEY'",
		"'LEFT'", "'LIKE'",
		"'LIMIT'", "'MATCH'",
		"'NATURAL'",
		"'NO'", "'NOT'",
		"'NOTNULL'",
		"'NULL'", "'OF'",
		"'OFFSET'",
		"'ON'", "'OR'",
		"'ORDER'", "'OUTER'",
		"'PLAN'", "'PRAGMA'",
		"'PRIMARY'",
		"'QUERY'", "'RAISE'",
		"'RECURSIVE'",
		"'REFERENCES'",
		"'REGEXP'",
		"'REINDEX'",
		"'RELEASE'",
		"'RENAME'",
		"'REPLACE'",
		"'RESTRICT'",
		"'RETURNING'",
		"'RIGHT'", "'ROLLBACK'",
		"'ROW'", "'ROWS'",
		"'SAVEPOINT'",
		"'SELECT'",
		"'SET'", "'TABLE'",
		"'TEMP'", "'TEMPORARY'",
		"'THEN'", "'TO'",
		"'TRANSACTION'",
		"'TRIGGER'",
		"'UNION'", "'UNIQUE'",
		"'UPDATE'",
		"'USING'", "'VACUUM'",
		"'VALUES'",
		"'VIEW'", "'VIRTUAL'",
		"'WHEN'", "'WHERE'",
		"'WITH'", "'WITHOUT'",
		"'FIRST_VALUE'",
		"'OVER'", "'PARTITION'",
		"'RANGE'", "'PRECEDING'",
		"'UNBOUNDED'",
		"'CURRENT'",
		"'FOLLOWING'",
		"'CUME_DIST'",
		"'DENSE_RANK'",
		"'LAG'", "'LAST_VALUE'",
		"'LEAD'", "'NTH_VALUE'",
		"'NTILE'", "'PERCENT_RANK'",
		"'RANK'", "'ROW_NUMBER'",
		"'GENERATED'",
		"'ALWAYS'",
		"'STORED'",
		"'TRUE'", "'FALSE'",
		"'WINDOW'",
		"'NULLS'", "'FIRST'",
		"'LAST'", "'FILTER'",
		"'GROUPS'",
		"'EXCLUDE'",
		"'TIES'", "'OTHERS'",
		"'DO'", "'NOTHING'"];
	public static readonly symbolicNames: (string | null)[] = [null, "SCOL",
		"DOT", "OPEN_PAR",
		"CLOSE_PAR",
		"COMMA", "ASSIGN",
		"STAR", "PLUS",
		"MINUS", "TILDE",
		"PIPE2", "DIV",
		"MOD", "LT2",
		"GT2", "AMP",
		"PIPE", "LT",
		"LT_EQ", "GT",
		"GT_EQ", "EQ",
		"NOT_EQ1",
		"NOT_EQ2",
		"ABORT_", "ACTION_",
		"ADD_", "AFTER_",
		"ALL_", "ALTER_",
		"ANALYZE_",
		"AND_", "AS_",
		"ASC_", "ATTACH_",
		"AUTOINCREMENT_",
		"BEFORE_",
		"BEGIN_", "BETWEEN_",
		"BY_", "CASCADE_",
		"CASE_", "CAST_",
		"CHECK_", "COLLATE_",
		"COLUMN_",
		"COMMIT_",
		"CONFLICT_",
		"CONSTRAINT_",
		"CREATE_",
		"CROSS_", "CURRENT_DATE_",
		"CURRENT_TIME_",
		"CURRENT_TIMESTAMP_",
		"DATABASE_",
		"DEFAULT_",
		"DEFERRABLE_",
		"DEFERRED_",
		"DELETE_",
		"DESC_", "DETACH_",
		"DISTINCT_",
		"DROP_", "EACH_",
		"ELSE_", "END_",
		"ESCAPE_",
		"EXCEPT_",
		"EXCLUSIVE_",
		"EXISTS_",
		"EXPLAIN_",
		"FAIL_", "FOR_",
		"FOREIGN_",
		"FROM_", "FULL_",
		"GLOB_", "GROUP_",
		"HAVING_",
		"IF_", "IGNORE_",
		"IMMEDIATE_",
		"IN_", "INDEX_",
		"INDEXED_",
		"INITIALLY_",
		"INNER_", "INSERT_",
		"INSTEAD_",
		"INTERSECT_",
		"INTO_", "IS_",
		"ISNULL_",
		"JOIN_", "KEY_",
		"LEFT_", "LIKE_",
		"LIMIT_", "MATCH_",
		"NATURAL_",
		"NO_", "NOT_",
		"NOTNULL_",
		"NULL_", "OF_",
		"OFFSET_",
		"ON_", "OR_",
		"ORDER_", "OUTER_",
		"PLAN_", "PRAGMA_",
		"PRIMARY_",
		"QUERY_", "RAISE_",
		"RECURSIVE_",
		"REFERENCES_",
		"REGEXP_",
		"REINDEX_",
		"RELEASE_",
		"RENAME_",
		"REPLACE_",
		"RESTRICT_",
		"RETURNING_",
		"RIGHT_", "ROLLBACK_",
		"ROW_", "ROWS_",
		"SAVEPOINT_",
		"SELECT_",
		"SET_", "TABLE_",
		"TEMP_", "TEMPORARY_",
		"THEN_", "TO_",
		"TRANSACTION_",
		"TRIGGER_",
		"UNION_", "UNIQUE_",
		"UPDATE_",
		"USING_", "VACUUM_",
		"VALUES_",
		"VIEW_", "VIRTUAL_",
		"WHEN_", "WHERE_",
		"WITH_", "WITHOUT_",
		"FIRST_VALUE_",
		"OVER_", "PARTITION_",
		"RANGE_", "PRECEDING_",
		"UNBOUNDED_",
		"CURRENT_",
		"FOLLOWING_",
		"CUME_DIST_",
		"DENSE_RANK_",
		"LAG_", "LAST_VALUE_",
		"LEAD_", "NTH_VALUE_",
		"NTILE_", "PERCENT_RANK_",
		"RANK_", "ROW_NUMBER_",
		"GENERATED_",
		"ALWAYS_",
		"STORED_",
		"TRUE_", "FALSE_",
		"WINDOW_",
		"NULLS_", "FIRST_",
		"LAST_", "FILTER_",
		"GROUPS_",
		"EXCLUDE_",
		"TIES_", "OTHERS_",
		"DO_", "NOTHING_",
		"IDENTIFIER",
		"NUMERIC_LITERAL",
		"BIND_PARAMETER",
		"STRING_LITERAL",
		"BLOB_LITERAL",
		"SINGLE_LINE_COMMENT",
		"MULTILINE_COMMENT",
		"SPACES", "UNEXPECTED_CHAR"];
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"parse", "sql_stmt_list", "sql_stmt", "alter_table_stmt", "analyze_stmt",
		"attach_stmt", "begin_stmt", "commit_stmt", "rollback_stmt", "savepoint_stmt",
		"release_stmt", "create_index_stmt", "indexed_column", "create_table_stmt",
		"column_def", "type_name", "column_constraint", "signed_number", "table_constraint",
		"foreign_key_clause", "conflict_clause", "create_trigger_stmt", "create_view_stmt",
		"create_virtual_table_stmt", "with_clause", "cte_table_name", "recursive_cte",
		"common_table_expression", "delete_stmt", "delete_stmt_limited", "detach_stmt",
		"drop_stmt", "expr", "raise_function", "literal_value", "value_row", "values_clause",
		"insert_stmt", "returning_clause", "upsert_clause", "pragma_stmt", "pragma_value",
		"reindex_stmt", "select_stmt", "join_clause", "select_core", "factored_select_stmt",
		"simple_select_stmt", "compound_select_stmt", "table_or_subquery", "result_column",
		"join_operator", "join_constraint", "compound_operator", "update_stmt",
		"column_name_list", "update_stmt_limited", "qualified_table_name", "vacuum_stmt",
		"filter_clause", "window_defn", "over_clause", "frame_spec", "frame_clause",
		"simple_function_invocation", "aggregate_function_invocation", "window_function_invocation",
		"common_table_stmt", "order_by_stmt", "limit_stmt", "ordering_term", "asc_desc",
		"frame_left", "frame_right", "frame_single", "window_function", "offset",
		"default_value", "partition_by", "order_by_expr", "order_by_expr_asc_desc",
		"expr_asc_desc", "initial_select", "recursive_select", "unary_operator",
		"error_message", "module_argument", "column_alias", "keyword", "name",
		"function_name", "schema_name", "table_name", "table_or_index_name", "column_name",
		"collation_name", "foreign_table", "index_name", "trigger_name", "view_name",
		"module_name", "pragma_name", "savepoint_name", "table_alias", "transaction_name",
		"window_name", "alias", "filename", "base_window_name", "simple_func",
		"aggregate_func", "table_function_name", "any_name",
	];
	public get grammarFileName(): string { return "SQLiteParser.g4"; }
	public get literalNames(): (string | null)[] { return SQLiteParser.literalNames; }
	public get symbolicNames(): (string | null)[] { return SQLiteParser.symbolicNames; }
	public get ruleNames(): string[] { return SQLiteParser.ruleNames; }
	public get serializedATN(): number[] { return SQLiteParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(this, SQLiteParser._ATN, SQLiteParser.DecisionsToDFA, new PredictionContextCache());
	}
	// @RuleVersion(0)
	public parse(): ParseContext {
		let localctx: ParseContext = new ParseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 0, SQLiteParser.RULE_parse);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 229;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3221225474) !== 0) || ((((_la - 35)) & ~0x1F) === 0 && ((1 << (_la - 35)) & 2499842057) !== 0) || _la === 71 || _la === 88 || ((((_la - 112)) & ~0x1F) === 0 && ((1 << (_la - 112)) & 2684765569) !== 0) || _la === 144 || _la === 149) {
					{
						{
							this.state = 226;
							this.sql_stmt_list();
						}
					}
					this.state = 231;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 232;
				this.match(SQLiteParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public sql_stmt_list(): Sql_stmt_listContext {
		let localctx: Sql_stmt_listContext = new Sql_stmt_listContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, SQLiteParser.RULE_sql_stmt_list);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 237;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 1) {
					{
						{
							this.state = 234;
							this.match(SQLiteParser.SCOL);
						}
					}
					this.state = 239;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 240;
				this.sql_stmt();
				this.state = 249;
				this._errHandler.sync(this);
				_alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
				while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
					if (_alt === 1) {
						{
							{
								this.state = 242;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								do {
									{
										{
											this.state = 241;
											this.match(SQLiteParser.SCOL);
										}
									}
									this.state = 244;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
								} while (_la === 1);
								this.state = 246;
								this.sql_stmt();
							}
						}
					}
					this.state = 251;
					this._errHandler.sync(this);
					_alt = this._interp.adaptivePredict(this._input, 3, this._ctx);
				}
				this.state = 255;
				this._errHandler.sync(this);
				_alt = this._interp.adaptivePredict(this._input, 4, this._ctx);
				while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
					if (_alt === 1) {
						{
							{
								this.state = 252;
								this.match(SQLiteParser.SCOL);
							}
						}
					}
					this.state = 257;
					this._errHandler.sync(this);
					_alt = this._interp.adaptivePredict(this._input, 4, this._ctx);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public sql_stmt(): Sql_stmtContext {
		let localctx: Sql_stmtContext = new Sql_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 4, SQLiteParser.RULE_sql_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 263;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 71) {
					{
						this.state = 258;
						this.match(SQLiteParser.EXPLAIN_);
						this.state = 261;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 114) {
							{
								this.state = 259;
								this.match(SQLiteParser.QUERY_);
								this.state = 260;
								this.match(SQLiteParser.PLAN_);
							}
						}

					}
				}

				this.state = 289;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 7, this._ctx)) {
					case 1:
						{
							this.state = 265;
							this.alter_table_stmt();
						}
						break;
					case 2:
						{
							this.state = 266;
							this.analyze_stmt();
						}
						break;
					case 3:
						{
							this.state = 267;
							this.attach_stmt();
						}
						break;
					case 4:
						{
							this.state = 268;
							this.begin_stmt();
						}
						break;
					case 5:
						{
							this.state = 269;
							this.commit_stmt();
						}
						break;
					case 6:
						{
							this.state = 270;
							this.create_index_stmt();
						}
						break;
					case 7:
						{
							this.state = 271;
							this.create_table_stmt();
						}
						break;
					case 8:
						{
							this.state = 272;
							this.create_trigger_stmt();
						}
						break;
					case 9:
						{
							this.state = 273;
							this.create_view_stmt();
						}
						break;
					case 10:
						{
							this.state = 274;
							this.create_virtual_table_stmt();
						}
						break;
					case 11:
						{
							this.state = 275;
							this.delete_stmt();
						}
						break;
					case 12:
						{
							this.state = 276;
							this.delete_stmt_limited();
						}
						break;
					case 13:
						{
							this.state = 277;
							this.detach_stmt();
						}
						break;
					case 14:
						{
							this.state = 278;
							this.drop_stmt();
						}
						break;
					case 15:
						{
							this.state = 279;
							this.insert_stmt();
						}
						break;
					case 16:
						{
							this.state = 280;
							this.pragma_stmt();
						}
						break;
					case 17:
						{
							this.state = 281;
							this.reindex_stmt();
						}
						break;
					case 18:
						{
							this.state = 282;
							this.release_stmt();
						}
						break;
					case 19:
						{
							this.state = 283;
							this.rollback_stmt();
						}
						break;
					case 20:
						{
							this.state = 284;
							this.savepoint_stmt();
						}
						break;
					case 21:
						{
							this.state = 285;
							this.select_stmt();
						}
						break;
					case 22:
						{
							this.state = 286;
							this.update_stmt();
						}
						break;
					case 23:
						{
							this.state = 287;
							this.update_stmt_limited();
						}
						break;
					case 24:
						{
							this.state = 288;
							this.vacuum_stmt();
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public alter_table_stmt(): Alter_table_stmtContext {
		let localctx: Alter_table_stmtContext = new Alter_table_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 6, SQLiteParser.RULE_alter_table_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 291;
				this.match(SQLiteParser.ALTER_);
				this.state = 292;
				this.match(SQLiteParser.TABLE_);
				this.state = 296;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 8, this._ctx)) {
					case 1:
						{
							this.state = 293;
							this.schema_name();
							this.state = 294;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 298;
				this.table_name();
				this.state = 321;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 121:
						{
							this.state = 299;
							this.match(SQLiteParser.RENAME_);
							this.state = 309;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 10, this._ctx)) {
								case 1:
									{
										this.state = 300;
										this.match(SQLiteParser.TO_);
										this.state = 301;
										localctx._new_table_name = this.table_name();
									}
									break;
								case 2:
									{
										this.state = 303;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 9, this._ctx)) {
											case 1:
												{
													this.state = 302;
													this.match(SQLiteParser.COLUMN_);
												}
												break;
										}
										this.state = 305;
										localctx._old_column_name = this.column_name();
										this.state = 306;
										this.match(SQLiteParser.TO_);
										this.state = 307;
										localctx._new_column_name = this.column_name();
									}
									break;
							}
						}
						break;
					case 27:
						{
							this.state = 311;
							this.match(SQLiteParser.ADD_);
							this.state = 313;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 11, this._ctx)) {
								case 1:
									{
										this.state = 312;
										this.match(SQLiteParser.COLUMN_);
									}
									break;
							}
							this.state = 315;
							this.column_def();
						}
						break;
					case 63:
						{
							this.state = 316;
							this.match(SQLiteParser.DROP_);
							this.state = 318;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 12, this._ctx)) {
								case 1:
									{
										this.state = 317;
										this.match(SQLiteParser.COLUMN_);
									}
									break;
							}
							this.state = 320;
							this.column_name();
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public analyze_stmt(): Analyze_stmtContext {
		let localctx: Analyze_stmtContext = new Analyze_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 8, SQLiteParser.RULE_analyze_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 323;
				this.match(SQLiteParser.ANALYZE_);
				this.state = 331;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 15, this._ctx)) {
					case 1:
						{
							this.state = 324;
							this.schema_name();
						}
						break;
					case 2:
						{
							this.state = 328;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 14, this._ctx)) {
								case 1:
									{
										this.state = 325;
										this.schema_name();
										this.state = 326;
										this.match(SQLiteParser.DOT);
									}
									break;
							}
							this.state = 330;
							this.table_or_index_name();
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public attach_stmt(): Attach_stmtContext {
		let localctx: Attach_stmtContext = new Attach_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 10, SQLiteParser.RULE_attach_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 333;
				this.match(SQLiteParser.ATTACH_);
				this.state = 335;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 16, this._ctx)) {
					case 1:
						{
							this.state = 334;
							this.match(SQLiteParser.DATABASE_);
						}
						break;
				}
				this.state = 337;
				this.expr(0);
				this.state = 338;
				this.match(SQLiteParser.AS_);
				this.state = 339;
				this.schema_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public begin_stmt(): Begin_stmtContext {
		let localctx: Begin_stmtContext = new Begin_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 12, SQLiteParser.RULE_begin_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 341;
				this.match(SQLiteParser.BEGIN_);
				this.state = 343;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (((((_la - 58)) & ~0x1F) === 0 && ((1 << (_la - 58)) & 16779265) !== 0)) {
					{
						this.state = 342;
						_la = this._input.LA(1);
						if (!(((((_la - 58)) & ~0x1F) === 0 && ((1 << (_la - 58)) & 16779265) !== 0))) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
					}
				}

				this.state = 349;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 137) {
					{
						this.state = 345;
						this.match(SQLiteParser.TRANSACTION_);
						this.state = 347;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 18, this._ctx)) {
							case 1:
								{
									this.state = 346;
									this.transaction_name();
								}
								break;
						}
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public commit_stmt(): Commit_stmtContext {
		let localctx: Commit_stmtContext = new Commit_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 14, SQLiteParser.RULE_commit_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 351;
				_la = this._input.LA(1);
				if (!(_la === 47 || _la === 66)) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 353;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 137) {
					{
						this.state = 352;
						this.match(SQLiteParser.TRANSACTION_);
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public rollback_stmt(): Rollback_stmtContext {
		let localctx: Rollback_stmtContext = new Rollback_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 16, SQLiteParser.RULE_rollback_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 355;
				this.match(SQLiteParser.ROLLBACK_);
				this.state = 357;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 137) {
					{
						this.state = 356;
						this.match(SQLiteParser.TRANSACTION_);
					}
				}

				this.state = 364;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 136) {
					{
						this.state = 359;
						this.match(SQLiteParser.TO_);
						this.state = 361;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 22, this._ctx)) {
							case 1:
								{
									this.state = 360;
									this.match(SQLiteParser.SAVEPOINT_);
								}
								break;
						}
						this.state = 363;
						this.savepoint_name();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public savepoint_stmt(): Savepoint_stmtContext {
		let localctx: Savepoint_stmtContext = new Savepoint_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 18, SQLiteParser.RULE_savepoint_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 366;
				this.match(SQLiteParser.SAVEPOINT_);
				this.state = 367;
				this.savepoint_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public release_stmt(): Release_stmtContext {
		let localctx: Release_stmtContext = new Release_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 20, SQLiteParser.RULE_release_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 369;
				this.match(SQLiteParser.RELEASE_);
				this.state = 371;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 24, this._ctx)) {
					case 1:
						{
							this.state = 370;
							this.match(SQLiteParser.SAVEPOINT_);
						}
						break;
				}
				this.state = 373;
				this.savepoint_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public create_index_stmt(): Create_index_stmtContext {
		let localctx: Create_index_stmtContext = new Create_index_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 22, SQLiteParser.RULE_create_index_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 375;
				this.match(SQLiteParser.CREATE_);
				this.state = 377;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 140) {
					{
						this.state = 376;
						this.match(SQLiteParser.UNIQUE_);
					}
				}

				this.state = 379;
				this.match(SQLiteParser.INDEX_);
				this.state = 383;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 26, this._ctx)) {
					case 1:
						{
							this.state = 380;
							this.match(SQLiteParser.IF_);
							this.state = 381;
							this.match(SQLiteParser.NOT_);
							this.state = 382;
							this.match(SQLiteParser.EXISTS_);
						}
						break;
				}
				this.state = 388;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 27, this._ctx)) {
					case 1:
						{
							this.state = 385;
							this.schema_name();
							this.state = 386;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 390;
				this.index_name();
				this.state = 391;
				this.match(SQLiteParser.ON_);
				this.state = 392;
				this.table_name();
				this.state = 393;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 394;
				this.indexed_column();
				this.state = 399;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 395;
							this.match(SQLiteParser.COMMA);
							this.state = 396;
							this.indexed_column();
						}
					}
					this.state = 401;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 402;
				this.match(SQLiteParser.CLOSE_PAR);
				this.state = 405;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 148) {
					{
						this.state = 403;
						this.match(SQLiteParser.WHERE_);
						this.state = 404;
						this.expr(0);
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public indexed_column(): Indexed_columnContext {
		let localctx: Indexed_columnContext = new Indexed_columnContext(this, this._ctx, this.state);
		this.enterRule(localctx, 24, SQLiteParser.RULE_indexed_column);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 409;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 30, this._ctx)) {
					case 1:
						{
							this.state = 407;
							this.column_name();
						}
						break;
					case 2:
						{
							this.state = 408;
							this.expr(0);
						}
						break;
				}
				this.state = 413;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 45) {
					{
						this.state = 411;
						this.match(SQLiteParser.COLLATE_);
						this.state = 412;
						this.collation_name();
					}
				}

				this.state = 416;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 34 || _la === 60) {
					{
						this.state = 415;
						this.asc_desc();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public create_table_stmt(): Create_table_stmtContext {
		let localctx: Create_table_stmtContext = new Create_table_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 26, SQLiteParser.RULE_create_table_stmt);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 418;
				this.match(SQLiteParser.CREATE_);
				this.state = 420;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 133 || _la === 134) {
					{
						this.state = 419;
						_la = this._input.LA(1);
						if (!(_la === 133 || _la === 134)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
					}
				}

				this.state = 422;
				this.match(SQLiteParser.TABLE_);
				this.state = 426;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 34, this._ctx)) {
					case 1:
						{
							this.state = 423;
							this.match(SQLiteParser.IF_);
							this.state = 424;
							this.match(SQLiteParser.NOT_);
							this.state = 425;
							this.match(SQLiteParser.EXISTS_);
						}
						break;
				}
				this.state = 431;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 35, this._ctx)) {
					case 1:
						{
							this.state = 428;
							this.schema_name();
							this.state = 429;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 433;
				this.table_name();
				this.state = 457;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 3:
						{
							this.state = 434;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 435;
							this.column_def();
							this.state = 440;
							this._errHandler.sync(this);
							_alt = this._interp.adaptivePredict(this._input, 36, this._ctx);
							while (_alt !== 1 && _alt !== ATN.INVALID_ALT_NUMBER) {
								if (_alt === 1 + 1) {
									{
										{
											this.state = 436;
											this.match(SQLiteParser.COMMA);
											this.state = 437;
											this.column_def();
										}
									}
								}
								this.state = 442;
								this._errHandler.sync(this);
								_alt = this._interp.adaptivePredict(this._input, 36, this._ctx);
							}
							this.state = 447;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 443;
										this.match(SQLiteParser.COMMA);
										this.state = 444;
										this.table_constraint();
									}
								}
								this.state = 449;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
							this.state = 450;
							this.match(SQLiteParser.CLOSE_PAR);
							this.state = 453;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 150) {
								{
									this.state = 451;
									this.match(SQLiteParser.WITHOUT_);
									this.state = 452;
									localctx._row_ROW_ID = this.match(SQLiteParser.IDENTIFIER);
								}
							}

						}
						break;
					case 33:
						{
							this.state = 455;
							this.match(SQLiteParser.AS_);
							this.state = 456;
							this.select_stmt();
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public column_def(): Column_defContext {
		let localctx: Column_defContext = new Column_defContext(this, this._ctx, this.state);
		this.enterRule(localctx, 28, SQLiteParser.RULE_column_def);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 459;
				this.column_name();
				this.state = 461;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 40, this._ctx)) {
					case 1:
						{
							this.state = 460;
							this.type_name();
						}
						break;
				}
				this.state = 466;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (((((_la - 33)) & ~0x1F) === 0 && ((1 << (_la - 33)) & 8460289) !== 0) || ((((_la - 102)) & ~0x1F) === 0 && ((1 << (_la - 102)) & 34821) !== 0) || _la === 140 || _la === 169) {
					{
						{
							this.state = 463;
							this.column_constraint();
						}
					}
					this.state = 468;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public type_name(): Type_nameContext {
		let localctx: Type_nameContext = new Type_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 30, SQLiteParser.RULE_type_name);
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 470;
				this._errHandler.sync(this);
				_alt = 1 + 1;
				do {
					switch (_alt) {
						case 1 + 1:
							{
								{
									this.state = 469;
									this.name();
								}
							}
							break;
						default:
							throw new NoViableAltException(this);
					}
					this.state = 472;
					this._errHandler.sync(this);
					_alt = this._interp.adaptivePredict(this._input, 42, this._ctx);
				} while (_alt !== 1 && _alt !== ATN.INVALID_ALT_NUMBER);
				this.state = 484;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 43, this._ctx)) {
					case 1:
						{
							this.state = 474;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 475;
							this.signed_number();
							this.state = 476;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case 2:
						{
							this.state = 478;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 479;
							this.signed_number();
							this.state = 480;
							this.match(SQLiteParser.COMMA);
							this.state = 481;
							this.signed_number();
							this.state = 482;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public column_constraint(): Column_constraintContext {
		let localctx: Column_constraintContext = new Column_constraintContext(this, this._ctx, this.state);
		this.enterRule(localctx, 32, SQLiteParser.RULE_column_constraint);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 488;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 49) {
					{
						this.state = 486;
						this.match(SQLiteParser.CONSTRAINT_);
						this.state = 487;
						this.name();
					}
				}

				this.state = 539;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 113:
						{
							{
								this.state = 490;
								this.match(SQLiteParser.PRIMARY_);
								this.state = 491;
								this.match(SQLiteParser.KEY_);
								this.state = 493;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								if (_la === 34 || _la === 60) {
									{
										this.state = 492;
										this.asc_desc();
									}
								}

								this.state = 496;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								if (_la === 107) {
									{
										this.state = 495;
										this.conflict_clause();
									}
								}

								this.state = 499;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								if (_la === 36) {
									{
										this.state = 498;
										this.match(SQLiteParser.AUTOINCREMENT_);
									}
								}

							}
						}
						break;
					case 102:
					case 104:
					case 140:
						{
							this.state = 506;
							this._errHandler.sync(this);
							switch (this._input.LA(1)) {
								case 102:
								case 104:
									{
										this.state = 502;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
										if (_la === 102) {
											{
												this.state = 501;
												this.match(SQLiteParser.NOT_);
											}
										}

										this.state = 504;
										this.match(SQLiteParser.NULL_);
									}
									break;
								case 140:
									{
										this.state = 505;
										this.match(SQLiteParser.UNIQUE_);
									}
									break;
								default:
									throw new NoViableAltException(this);
							}
							this.state = 509;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 107) {
								{
									this.state = 508;
									this.conflict_clause();
								}
							}

						}
						break;
					case 44:
						{
							this.state = 511;
							this.match(SQLiteParser.CHECK_);
							this.state = 512;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 513;
							this.expr(0);
							this.state = 514;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case 56:
						{
							this.state = 516;
							this.match(SQLiteParser.DEFAULT_);
							this.state = 523;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 51, this._ctx)) {
								case 1:
									{
										this.state = 517;
										this.signed_number();
									}
									break;
								case 2:
									{
										this.state = 518;
										this.literal_value();
									}
									break;
								case 3:
									{
										this.state = 519;
										this.match(SQLiteParser.OPEN_PAR);
										this.state = 520;
										this.expr(0);
										this.state = 521;
										this.match(SQLiteParser.CLOSE_PAR);
									}
									break;
							}
						}
						break;
					case 45:
						{
							this.state = 525;
							this.match(SQLiteParser.COLLATE_);
							this.state = 526;
							this.collation_name();
						}
						break;
					case 117:
						{
							this.state = 527;
							this.foreign_key_clause();
						}
						break;
					case 33:
					case 169:
						{
							this.state = 530;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 169) {
								{
									this.state = 528;
									this.match(SQLiteParser.GENERATED_);
									this.state = 529;
									this.match(SQLiteParser.ALWAYS_);
								}
							}

							this.state = 532;
							this.match(SQLiteParser.AS_);
							this.state = 533;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 534;
							this.expr(0);
							this.state = 535;
							this.match(SQLiteParser.CLOSE_PAR);
							this.state = 537;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 146 || _la === 171) {
								{
									this.state = 536;
									_la = this._input.LA(1);
									if (!(_la === 146 || _la === 171)) {
										this._errHandler.recoverInline(this);
									}
									else {
										this._errHandler.reportMatch(this);
										this.consume();
									}
								}
							}

						}
						break;
					default:
						throw new NoViableAltException(this);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public signed_number(): Signed_numberContext {
		let localctx: Signed_numberContext = new Signed_numberContext(this, this._ctx, this.state);
		this.enterRule(localctx, 34, SQLiteParser.RULE_signed_number);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 542;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 8 || _la === 9) {
					{
						this.state = 541;
						_la = this._input.LA(1);
						if (!(_la === 8 || _la === 9)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
					}
				}

				this.state = 544;
				this.match(SQLiteParser.NUMERIC_LITERAL);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public table_constraint(): Table_constraintContext {
		let localctx: Table_constraintContext = new Table_constraintContext(this, this._ctx, this.state);
		this.enterRule(localctx, 36, SQLiteParser.RULE_table_constraint);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 548;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 49) {
					{
						this.state = 546;
						this.match(SQLiteParser.CONSTRAINT_);
						this.state = 547;
						this.name();
					}
				}

				this.state = 587;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 113:
					case 140:
						{
							this.state = 553;
							this._errHandler.sync(this);
							switch (this._input.LA(1)) {
								case 113:
									{
										this.state = 550;
										this.match(SQLiteParser.PRIMARY_);
										this.state = 551;
										this.match(SQLiteParser.KEY_);
									}
									break;
								case 140:
									{
										this.state = 552;
										this.match(SQLiteParser.UNIQUE_);
									}
									break;
								default:
									throw new NoViableAltException(this);
							}
							this.state = 555;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 556;
							this.indexed_column();
							this.state = 561;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 557;
										this.match(SQLiteParser.COMMA);
										this.state = 558;
										this.indexed_column();
									}
								}
								this.state = 563;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
							this.state = 564;
							this.match(SQLiteParser.CLOSE_PAR);
							this.state = 566;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 107) {
								{
									this.state = 565;
									this.conflict_clause();
								}
							}

						}
						break;
					case 44:
						{
							this.state = 568;
							this.match(SQLiteParser.CHECK_);
							this.state = 569;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 570;
							this.expr(0);
							this.state = 571;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case 74:
						{
							this.state = 573;
							this.match(SQLiteParser.FOREIGN_);
							this.state = 574;
							this.match(SQLiteParser.KEY_);
							this.state = 575;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 576;
							this.column_name();
							this.state = 581;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 577;
										this.match(SQLiteParser.COMMA);
										this.state = 578;
										this.column_name();
									}
								}
								this.state = 583;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
							this.state = 584;
							this.match(SQLiteParser.CLOSE_PAR);
							this.state = 585;
							this.foreign_key_clause();
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public foreign_key_clause(): Foreign_key_clauseContext {
		let localctx: Foreign_key_clauseContext = new Foreign_key_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 38, SQLiteParser.RULE_foreign_key_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 589;
				this.match(SQLiteParser.REFERENCES_);
				this.state = 590;
				this.foreign_table();
				this.state = 602;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 591;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 592;
						this.column_name();
						this.state = 597;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 593;
									this.match(SQLiteParser.COMMA);
									this.state = 594;
									this.column_name();
								}
							}
							this.state = 599;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 600;
						this.match(SQLiteParser.CLOSE_PAR);
					}
				}

				this.state = 618;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 99 || _la === 107) {
					{
						this.state = 616;
						this._errHandler.sync(this);
						switch (this._input.LA(1)) {
							case 107:
								{
									this.state = 604;
									this.match(SQLiteParser.ON_);
									this.state = 605;
									_la = this._input.LA(1);
									if (!(_la === 59 || _la === 141)) {
										this._errHandler.recoverInline(this);
									}
									else {
										this._errHandler.reportMatch(this);
										this.consume();
									}
									this.state = 612;
									this._errHandler.sync(this);
									switch (this._input.LA(1)) {
										case 131:
											{
												this.state = 606;
												this.match(SQLiteParser.SET_);
												this.state = 607;
												_la = this._input.LA(1);
												if (!(_la === 56 || _la === 104)) {
													this._errHandler.recoverInline(this);
												}
												else {
													this._errHandler.reportMatch(this);
													this.consume();
												}
											}
											break;
										case 41:
											{
												this.state = 608;
												this.match(SQLiteParser.CASCADE_);
											}
											break;
										case 123:
											{
												this.state = 609;
												this.match(SQLiteParser.RESTRICT_);
											}
											break;
										case 101:
											{
												this.state = 610;
												this.match(SQLiteParser.NO_);
												this.state = 611;
												this.match(SQLiteParser.ACTION_);
											}
											break;
										default:
											throw new NoViableAltException(this);
									}
								}
								break;
							case 99:
								{
									this.state = 614;
									this.match(SQLiteParser.MATCH_);
									this.state = 615;
									this.name();
								}
								break;
							default:
								throw new NoViableAltException(this);
						}
					}
					this.state = 620;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 629;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 69, this._ctx)) {
					case 1:
						{
							this.state = 622;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 102) {
								{
									this.state = 621;
									this.match(SQLiteParser.NOT_);
								}
							}

							this.state = 624;
							this.match(SQLiteParser.DEFERRABLE_);
							this.state = 627;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 86) {
								{
									this.state = 625;
									this.match(SQLiteParser.INITIALLY_);
									this.state = 626;
									_la = this._input.LA(1);
									if (!(_la === 58 || _la === 82)) {
										this._errHandler.recoverInline(this);
									}
									else {
										this._errHandler.reportMatch(this);
										this.consume();
									}
								}
							}

						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public conflict_clause(): Conflict_clauseContext {
		let localctx: Conflict_clauseContext = new Conflict_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 40, SQLiteParser.RULE_conflict_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 631;
				this.match(SQLiteParser.ON_);
				this.state = 632;
				this.match(SQLiteParser.CONFLICT_);
				this.state = 633;
				_la = this._input.LA(1);
				if (!(_la === 25 || _la === 72 || _la === 81 || _la === 122 || _la === 126)) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public create_trigger_stmt(): Create_trigger_stmtContext {
		let localctx: Create_trigger_stmtContext = new Create_trigger_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 42, SQLiteParser.RULE_create_trigger_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 635;
				this.match(SQLiteParser.CREATE_);
				this.state = 637;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 133 || _la === 134) {
					{
						this.state = 636;
						_la = this._input.LA(1);
						if (!(_la === 133 || _la === 134)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
					}
				}

				this.state = 639;
				this.match(SQLiteParser.TRIGGER_);
				this.state = 643;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 71, this._ctx)) {
					case 1:
						{
							this.state = 640;
							this.match(SQLiteParser.IF_);
							this.state = 641;
							this.match(SQLiteParser.NOT_);
							this.state = 642;
							this.match(SQLiteParser.EXISTS_);
						}
						break;
				}
				this.state = 648;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 72, this._ctx)) {
					case 1:
						{
							this.state = 645;
							this.schema_name();
							this.state = 646;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 650;
				this.trigger_name();
				this.state = 655;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 37:
						{
							this.state = 651;
							this.match(SQLiteParser.BEFORE_);
						}
						break;
					case 28:
						{
							this.state = 652;
							this.match(SQLiteParser.AFTER_);
						}
						break;
					case 89:
						{
							this.state = 653;
							this.match(SQLiteParser.INSTEAD_);
							this.state = 654;
							this.match(SQLiteParser.OF_);
						}
						break;
					case 59:
					case 88:
					case 141:
						break;
					default:
						break;
				}
				this.state = 671;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 59:
						{
							this.state = 657;
							this.match(SQLiteParser.DELETE_);
						}
						break;
					case 88:
						{
							this.state = 658;
							this.match(SQLiteParser.INSERT_);
						}
						break;
					case 141:
						{
							this.state = 659;
							this.match(SQLiteParser.UPDATE_);
							this.state = 669;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 105) {
								{
									this.state = 660;
									this.match(SQLiteParser.OF_);
									this.state = 661;
									this.column_name();
									this.state = 666;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 662;
												this.match(SQLiteParser.COMMA);
												this.state = 663;
												this.column_name();
											}
										}
										this.state = 668;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
								}
							}

						}
						break;
					default:
						throw new NoViableAltException(this);
				}
				this.state = 673;
				this.match(SQLiteParser.ON_);
				this.state = 674;
				this.table_name();
				this.state = 678;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 73) {
					{
						this.state = 675;
						this.match(SQLiteParser.FOR_);
						this.state = 676;
						this.match(SQLiteParser.EACH_);
						this.state = 677;
						this.match(SQLiteParser.ROW_);
					}
				}

				this.state = 682;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 147) {
					{
						this.state = 680;
						this.match(SQLiteParser.WHEN_);
						this.state = 681;
						this.expr(0);
					}
				}

				this.state = 684;
				this.match(SQLiteParser.BEGIN_);
				this.state = 693;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				do {
					{
						{
							this.state = 689;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 79, this._ctx)) {
								case 1:
									{
										this.state = 685;
										this.update_stmt();
									}
									break;
								case 2:
									{
										this.state = 686;
										this.insert_stmt();
									}
									break;
								case 3:
									{
										this.state = 687;
										this.delete_stmt();
									}
									break;
								case 4:
									{
										this.state = 688;
										this.select_stmt();
									}
									break;
							}
							this.state = 691;
							this.match(SQLiteParser.SCOL);
						}
					}
					this.state = 695;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				} while (_la === 59 || _la === 88 || ((((_la - 122)) & ~0x1F) === 0 && ((1 << (_la - 122)) & 138936577) !== 0));
				this.state = 697;
				this.match(SQLiteParser.END_);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public create_view_stmt(): Create_view_stmtContext {
		let localctx: Create_view_stmtContext = new Create_view_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 44, SQLiteParser.RULE_create_view_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 699;
				this.match(SQLiteParser.CREATE_);
				this.state = 701;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 133 || _la === 134) {
					{
						this.state = 700;
						_la = this._input.LA(1);
						if (!(_la === 133 || _la === 134)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
					}
				}

				this.state = 703;
				this.match(SQLiteParser.VIEW_);
				this.state = 707;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 82, this._ctx)) {
					case 1:
						{
							this.state = 704;
							this.match(SQLiteParser.IF_);
							this.state = 705;
							this.match(SQLiteParser.NOT_);
							this.state = 706;
							this.match(SQLiteParser.EXISTS_);
						}
						break;
				}
				this.state = 712;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 83, this._ctx)) {
					case 1:
						{
							this.state = 709;
							this.schema_name();
							this.state = 710;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 714;
				this.view_name();
				this.state = 726;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 715;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 716;
						this.column_name();
						this.state = 721;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 717;
									this.match(SQLiteParser.COMMA);
									this.state = 718;
									this.column_name();
								}
							}
							this.state = 723;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 724;
						this.match(SQLiteParser.CLOSE_PAR);
					}
				}

				this.state = 728;
				this.match(SQLiteParser.AS_);
				this.state = 729;
				this.select_stmt();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public create_virtual_table_stmt(): Create_virtual_table_stmtContext {
		let localctx: Create_virtual_table_stmtContext = new Create_virtual_table_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 46, SQLiteParser.RULE_create_virtual_table_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 731;
				this.match(SQLiteParser.CREATE_);
				this.state = 732;
				this.match(SQLiteParser.VIRTUAL_);
				this.state = 733;
				this.match(SQLiteParser.TABLE_);
				this.state = 737;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 86, this._ctx)) {
					case 1:
						{
							this.state = 734;
							this.match(SQLiteParser.IF_);
							this.state = 735;
							this.match(SQLiteParser.NOT_);
							this.state = 736;
							this.match(SQLiteParser.EXISTS_);
						}
						break;
				}
				this.state = 742;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 87, this._ctx)) {
					case 1:
						{
							this.state = 739;
							this.schema_name();
							this.state = 740;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 744;
				this.table_name();
				this.state = 745;
				this.match(SQLiteParser.USING_);
				this.state = 746;
				this.module_name();
				this.state = 758;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 747;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 748;
						this.module_argument();
						this.state = 753;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 749;
									this.match(SQLiteParser.COMMA);
									this.state = 750;
									this.module_argument();
								}
							}
							this.state = 755;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 756;
						this.match(SQLiteParser.CLOSE_PAR);
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public with_clause(): With_clauseContext {
		let localctx: With_clauseContext = new With_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 48, SQLiteParser.RULE_with_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 760;
				this.match(SQLiteParser.WITH_);
				this.state = 762;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 90, this._ctx)) {
					case 1:
						{
							this.state = 761;
							this.match(SQLiteParser.RECURSIVE_);
						}
						break;
				}
				this.state = 764;
				this.cte_table_name();
				this.state = 765;
				this.match(SQLiteParser.AS_);
				this.state = 766;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 767;
				this.select_stmt();
				this.state = 768;
				this.match(SQLiteParser.CLOSE_PAR);
				this.state = 778;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 769;
							this.match(SQLiteParser.COMMA);
							this.state = 770;
							this.cte_table_name();
							this.state = 771;
							this.match(SQLiteParser.AS_);
							this.state = 772;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 773;
							this.select_stmt();
							this.state = 774;
							this.match(SQLiteParser.CLOSE_PAR);
						}
					}
					this.state = 780;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public cte_table_name(): Cte_table_nameContext {
		let localctx: Cte_table_nameContext = new Cte_table_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 50, SQLiteParser.RULE_cte_table_name);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 781;
				this.table_name();
				this.state = 793;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 782;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 783;
						this.column_name();
						this.state = 788;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 784;
									this.match(SQLiteParser.COMMA);
									this.state = 785;
									this.column_name();
								}
							}
							this.state = 790;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 791;
						this.match(SQLiteParser.CLOSE_PAR);
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public recursive_cte(): Recursive_cteContext {
		let localctx: Recursive_cteContext = new Recursive_cteContext(this, this._ctx, this.state);
		this.enterRule(localctx, 52, SQLiteParser.RULE_recursive_cte);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 795;
				this.cte_table_name();
				this.state = 796;
				this.match(SQLiteParser.AS_);
				this.state = 797;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 798;
				this.initial_select();
				this.state = 799;
				this.match(SQLiteParser.UNION_);
				this.state = 801;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 29) {
					{
						this.state = 800;
						this.match(SQLiteParser.ALL_);
					}
				}

				this.state = 803;
				this.recursive_select();
				this.state = 804;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public common_table_expression(): Common_table_expressionContext {
		let localctx: Common_table_expressionContext = new Common_table_expressionContext(this, this._ctx, this.state);
		this.enterRule(localctx, 54, SQLiteParser.RULE_common_table_expression);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 806;
				this.table_name();
				this.state = 818;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 807;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 808;
						this.column_name();
						this.state = 813;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 809;
									this.match(SQLiteParser.COMMA);
									this.state = 810;
									this.column_name();
								}
							}
							this.state = 815;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 816;
						this.match(SQLiteParser.CLOSE_PAR);
					}
				}

				this.state = 820;
				this.match(SQLiteParser.AS_);
				this.state = 821;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 822;
				this.select_stmt();
				this.state = 823;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public delete_stmt(): Delete_stmtContext {
		let localctx: Delete_stmtContext = new Delete_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 56, SQLiteParser.RULE_delete_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 826;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 825;
						this.with_clause();
					}
				}

				this.state = 828;
				this.match(SQLiteParser.DELETE_);
				this.state = 829;
				this.match(SQLiteParser.FROM_);
				this.state = 830;
				this.qualified_table_name();
				this.state = 833;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 148) {
					{
						this.state = 831;
						this.match(SQLiteParser.WHERE_);
						this.state = 832;
						this.expr(0);
					}
				}

				this.state = 836;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 124) {
					{
						this.state = 835;
						this.returning_clause();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public delete_stmt_limited(): Delete_stmt_limitedContext {
		let localctx: Delete_stmt_limitedContext = new Delete_stmt_limitedContext(this, this._ctx, this.state);
		this.enterRule(localctx, 58, SQLiteParser.RULE_delete_stmt_limited);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 839;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 838;
						this.with_clause();
					}
				}

				this.state = 841;
				this.match(SQLiteParser.DELETE_);
				this.state = 842;
				this.match(SQLiteParser.FROM_);
				this.state = 843;
				this.qualified_table_name();
				this.state = 846;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 148) {
					{
						this.state = 844;
						this.match(SQLiteParser.WHERE_);
						this.state = 845;
						this.expr(0);
					}
				}

				this.state = 849;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 124) {
					{
						this.state = 848;
						this.returning_clause();
					}
				}

				this.state = 855;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 98 || _la === 109) {
					{
						this.state = 852;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 109) {
							{
								this.state = 851;
								this.order_by_stmt();
							}
						}

						this.state = 854;
						this.limit_stmt();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public detach_stmt(): Detach_stmtContext {
		let localctx: Detach_stmtContext = new Detach_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 60, SQLiteParser.RULE_detach_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 857;
				this.match(SQLiteParser.DETACH_);
				this.state = 859;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 105, this._ctx)) {
					case 1:
						{
							this.state = 858;
							this.match(SQLiteParser.DATABASE_);
						}
						break;
				}
				this.state = 861;
				this.schema_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public drop_stmt(): Drop_stmtContext {
		let localctx: Drop_stmtContext = new Drop_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 62, SQLiteParser.RULE_drop_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 863;
				this.match(SQLiteParser.DROP_);
				this.state = 864;
				localctx._object = this._input.LT(1);
				_la = this._input.LA(1);
				if (!(_la === 84 || ((((_la - 132)) & ~0x1F) === 0 && ((1 << (_la - 132)) & 8257) !== 0))) {
					localctx._object = this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 867;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 106, this._ctx)) {
					case 1:
						{
							this.state = 865;
							this.match(SQLiteParser.IF_);
							this.state = 866;
							this.match(SQLiteParser.EXISTS_);
						}
						break;
				}
				this.state = 872;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 107, this._ctx)) {
					case 1:
						{
							this.state = 869;
							this.schema_name();
							this.state = 870;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 874;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}

	public expr(): ExprContext;
	public expr(_p: number): ExprContext;
	// @RuleVersion(0)
	public expr(_p?: number): ExprContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let localctx: ExprContext = new ExprContext(this, this._ctx, _parentState);
		let _prevctx: ExprContext = localctx;
		let _startState: number = 64;
		this.enterRecursionRule(localctx, 64, SQLiteParser.RULE_expr, _p);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 964;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 121, this._ctx)) {
					case 1:
						{
							this.state = 877;
							this.literal_value();
						}
						break;
					case 2:
						{
							this.state = 878;
							this.match(SQLiteParser.BIND_PARAMETER);
						}
						break;
					case 3:
						{
							this.state = 887;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 109, this._ctx)) {
								case 1:
									{
										this.state = 882;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 108, this._ctx)) {
											case 1:
												{
													this.state = 879;
													this.schema_name();
													this.state = 880;
													this.match(SQLiteParser.DOT);
												}
												break;
										}
										this.state = 884;
										this.table_name();
										this.state = 885;
										this.match(SQLiteParser.DOT);
									}
									break;
							}
							this.state = 889;
							this.column_name();
						}
						break;
					case 4:
						{
							this.state = 890;
							this.unary_operator();
							this.state = 891;
							this.expr(21);
						}
						break;
					case 5:
						{
							this.state = 893;
							this.function_name();
							this.state = 894;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 907;
							this._errHandler.sync(this);
							switch (this._input.LA(1)) {
								case 3:
								case 8:
								case 9:
								case 10:
								case 25:
								case 26:
								case 27:
								case 28:
								case 29:
								case 30:
								case 31:
								case 32:
								case 33:
								case 34:
								case 35:
								case 36:
								case 37:
								case 38:
								case 39:
								case 40:
								case 41:
								case 42:
								case 43:
								case 44:
								case 45:
								case 46:
								case 47:
								case 48:
								case 49:
								case 50:
								case 51:
								case 52:
								case 53:
								case 54:
								case 55:
								case 56:
								case 57:
								case 58:
								case 59:
								case 60:
								case 61:
								case 62:
								case 63:
								case 64:
								case 65:
								case 66:
								case 67:
								case 68:
								case 69:
								case 70:
								case 71:
								case 72:
								case 73:
								case 74:
								case 75:
								case 76:
								case 77:
								case 78:
								case 79:
								case 80:
								case 81:
								case 82:
								case 83:
								case 84:
								case 85:
								case 86:
								case 87:
								case 88:
								case 89:
								case 90:
								case 91:
								case 92:
								case 93:
								case 94:
								case 95:
								case 96:
								case 97:
								case 98:
								case 99:
								case 100:
								case 101:
								case 102:
								case 103:
								case 104:
								case 105:
								case 106:
								case 107:
								case 108:
								case 109:
								case 110:
								case 111:
								case 112:
								case 113:
								case 114:
								case 115:
								case 116:
								case 117:
								case 118:
								case 119:
								case 120:
								case 121:
								case 122:
								case 123:
								case 125:
								case 126:
								case 127:
								case 128:
								case 129:
								case 130:
								case 131:
								case 132:
								case 133:
								case 134:
								case 135:
								case 136:
								case 137:
								case 138:
								case 139:
								case 140:
								case 141:
								case 142:
								case 143:
								case 144:
								case 145:
								case 146:
								case 147:
								case 148:
								case 149:
								case 150:
								case 151:
								case 152:
								case 153:
								case 154:
								case 155:
								case 156:
								case 157:
								case 158:
								case 159:
								case 160:
								case 161:
								case 162:
								case 163:
								case 164:
								case 165:
								case 166:
								case 167:
								case 168:
								case 169:
								case 170:
								case 171:
								case 172:
								case 173:
								case 174:
								case 175:
								case 176:
								case 177:
								case 178:
								case 179:
								case 180:
								case 185:
								case 186:
								case 187:
								case 188:
								case 189:
									{
										{
											this.state = 896;
											this._errHandler.sync(this);
											switch (this._interp.adaptivePredict(this._input, 110, this._ctx)) {
												case 1:
													{
														this.state = 895;
														this.match(SQLiteParser.DISTINCT_);
													}
													break;
											}
											this.state = 898;
											this.expr(0);
											this.state = 903;
											this._errHandler.sync(this);
											_la = this._input.LA(1);
											while (_la === 5) {
												{
													{
														this.state = 899;
														this.match(SQLiteParser.COMMA);
														this.state = 900;
														this.expr(0);
													}
												}
												this.state = 905;
												this._errHandler.sync(this);
												_la = this._input.LA(1);
											}
										}
									}
									break;
								case 7:
									{
										this.state = 906;
										this.match(SQLiteParser.STAR);
									}
									break;
								case 4:
									break;
								default:
									break;
							}
							this.state = 909;
							this.match(SQLiteParser.CLOSE_PAR);
							this.state = 911;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 113, this._ctx)) {
								case 1:
									{
										this.state = 910;
										this.filter_clause();
									}
									break;
							}
							this.state = 914;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 114, this._ctx)) {
								case 1:
									{
										this.state = 913;
										this.over_clause();
									}
									break;
							}
						}
						break;
					case 6:
						{
							this.state = 916;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 917;
							this.expr(0);
							this.state = 922;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 918;
										this.match(SQLiteParser.COMMA);
										this.state = 919;
										this.expr(0);
									}
								}
								this.state = 924;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
							this.state = 925;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case 7:
						{
							this.state = 927;
							this.match(SQLiteParser.CAST_);
							this.state = 928;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 929;
							this.expr(0);
							this.state = 930;
							this.match(SQLiteParser.AS_);
							this.state = 931;
							this.type_name();
							this.state = 932;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case 8:
						{
							this.state = 938;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 70 || _la === 102) {
								{
									this.state = 935;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									if (_la === 102) {
										{
											this.state = 934;
											this.match(SQLiteParser.NOT_);
										}
									}

									this.state = 937;
									this.match(SQLiteParser.EXISTS_);
								}
							}

							this.state = 940;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 941;
							this.select_stmt();
							this.state = 942;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case 9:
						{
							this.state = 944;
							this.match(SQLiteParser.CASE_);
							this.state = 946;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 118, this._ctx)) {
								case 1:
									{
										this.state = 945;
										this.expr(0);
									}
									break;
							}
							this.state = 953;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							do {
								{
									{
										this.state = 948;
										this.match(SQLiteParser.WHEN_);
										this.state = 949;
										this.expr(0);
										this.state = 950;
										this.match(SQLiteParser.THEN_);
										this.state = 951;
										this.expr(0);
									}
								}
								this.state = 955;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							} while (_la === 147);
							this.state = 959;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 65) {
								{
									this.state = 957;
									this.match(SQLiteParser.ELSE_);
									this.state = 958;
									this.expr(0);
								}
							}

							this.state = 961;
							this.match(SQLiteParser.END_);
						}
						break;
					case 10:
						{
							this.state = 963;
							this.raise_function();
						}
						break;
				}
				this._ctx.stop = this._input.LT(-1);
				this.state = 1091;
				this._errHandler.sync(this);
				_alt = this._interp.adaptivePredict(this._input, 138, this._ctx);
				while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
					if (_alt === 1) {
						if (this._parseListeners != null) {
							this.triggerExitRuleEvent();
						}
						_prevctx = localctx;
						{
							this.state = 1089;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 137, this._ctx)) {
								case 1:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 966;
										if (!(this.precpred(this._ctx, 20))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 20)");
										}
										this.state = 967;
										this.match(SQLiteParser.PIPE2);
										this.state = 968;
										this.expr(21);
									}
									break;
								case 2:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 969;
										if (!(this.precpred(this._ctx, 19))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 19)");
										}
										this.state = 970;
										_la = this._input.LA(1);
										if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & 12416) !== 0))) {
											this._errHandler.recoverInline(this);
										}
										else {
											this._errHandler.reportMatch(this);
											this.consume();
										}
										this.state = 971;
										this.expr(20);
									}
									break;
								case 3:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 972;
										if (!(this.precpred(this._ctx, 18))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 18)");
										}
										this.state = 973;
										_la = this._input.LA(1);
										if (!(_la === 8 || _la === 9)) {
											this._errHandler.recoverInline(this);
										}
										else {
											this._errHandler.reportMatch(this);
											this.consume();
										}
										this.state = 974;
										this.expr(19);
									}
									break;
								case 4:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 975;
										if (!(this.precpred(this._ctx, 17))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 17)");
										}
										this.state = 976;
										_la = this._input.LA(1);
										if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & 245760) !== 0))) {
											this._errHandler.recoverInline(this);
										}
										else {
											this._errHandler.reportMatch(this);
											this.consume();
										}
										this.state = 977;
										this.expr(18);
									}
									break;
								case 5:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 978;
										if (!(this.precpred(this._ctx, 16))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 16)");
										}
										this.state = 979;
										_la = this._input.LA(1);
										if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & 3932160) !== 0))) {
											this._errHandler.recoverInline(this);
										}
										else {
											this._errHandler.reportMatch(this);
											this.consume();
										}
										this.state = 980;
										this.expr(17);
									}
									break;
								case 6:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 981;
										if (!(this.precpred(this._ctx, 15))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 15)");
										}
										this.state = 1000;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 123, this._ctx)) {
											case 1:
												{
													this.state = 982;
													this.match(SQLiteParser.ASSIGN);
												}
												break;
											case 2:
												{
													this.state = 983;
													this.match(SQLiteParser.EQ);
												}
												break;
											case 3:
												{
													this.state = 984;
													this.match(SQLiteParser.NOT_EQ1);
												}
												break;
											case 4:
												{
													this.state = 985;
													this.match(SQLiteParser.NOT_EQ2);
												}
												break;
											case 5:
												{
													this.state = 986;
													this.match(SQLiteParser.IS_);
												}
												break;
											case 6:
												{
													this.state = 987;
													this.match(SQLiteParser.IS_);
													this.state = 988;
													this.match(SQLiteParser.NOT_);
												}
												break;
											case 7:
												{
													this.state = 989;
													this.match(SQLiteParser.IS_);
													this.state = 991;
													this._errHandler.sync(this);
													_la = this._input.LA(1);
													if (_la === 102) {
														{
															this.state = 990;
															this.match(SQLiteParser.NOT_);
														}
													}

													this.state = 993;
													this.match(SQLiteParser.DISTINCT_);
													this.state = 994;
													this.match(SQLiteParser.FROM_);
												}
												break;
											case 8:
												{
													this.state = 995;
													this.match(SQLiteParser.IN_);
												}
												break;
											case 9:
												{
													this.state = 996;
													this.match(SQLiteParser.LIKE_);
												}
												break;
											case 10:
												{
													this.state = 997;
													this.match(SQLiteParser.GLOB_);
												}
												break;
											case 11:
												{
													this.state = 998;
													this.match(SQLiteParser.MATCH_);
												}
												break;
											case 12:
												{
													this.state = 999;
													this.match(SQLiteParser.REGEXP_);
												}
												break;
										}
										this.state = 1002;
										this.expr(16);
									}
									break;
								case 7:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1003;
										if (!(this.precpred(this._ctx, 14))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 14)");
										}
										this.state = 1004;
										this.match(SQLiteParser.AND_);
										this.state = 1005;
										this.expr(15);
									}
									break;
								case 8:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1006;
										if (!(this.precpred(this._ctx, 13))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 13)");
										}
										this.state = 1007;
										this.match(SQLiteParser.OR_);
										this.state = 1008;
										this.expr(14);
									}
									break;
								case 9:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1009;
										if (!(this.precpred(this._ctx, 6))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 6)");
										}
										this.state = 1010;
										this.match(SQLiteParser.IS_);
										this.state = 1012;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 124, this._ctx)) {
											case 1:
												{
													this.state = 1011;
													this.match(SQLiteParser.NOT_);
												}
												break;
										}
										this.state = 1014;
										this.expr(7);
									}
									break;
								case 10:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1015;
										if (!(this.precpred(this._ctx, 5))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 5)");
										}
										this.state = 1017;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
										if (_la === 102) {
											{
												this.state = 1016;
												this.match(SQLiteParser.NOT_);
											}
										}

										this.state = 1019;
										this.match(SQLiteParser.BETWEEN_);
										this.state = 1020;
										this.expr(0);
										this.state = 1021;
										this.match(SQLiteParser.AND_);
										this.state = 1022;
										this.expr(6);
									}
									break;
								case 11:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1024;
										if (!(this.precpred(this._ctx, 9))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 9)");
										}
										this.state = 1025;
										this.match(SQLiteParser.COLLATE_);
										this.state = 1026;
										this.collation_name();
									}
									break;
								case 12:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1027;
										if (!(this.precpred(this._ctx, 8))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 8)");
										}
										this.state = 1029;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
										if (_la === 102) {
											{
												this.state = 1028;
												this.match(SQLiteParser.NOT_);
											}
										}

										this.state = 1031;
										_la = this._input.LA(1);
										if (!(((((_la - 77)) & ~0x1F) === 0 && ((1 << (_la - 77)) & 5242881) !== 0) || _la === 118)) {
											this._errHandler.recoverInline(this);
										}
										else {
											this._errHandler.reportMatch(this);
											this.consume();
										}
										this.state = 1032;
										this.expr(0);
										this.state = 1035;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 127, this._ctx)) {
											case 1:
												{
													this.state = 1033;
													this.match(SQLiteParser.ESCAPE_);
													this.state = 1034;
													this.expr(0);
												}
												break;
										}
									}
									break;
								case 13:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1037;
										if (!(this.precpred(this._ctx, 7))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 7)");
										}
										this.state = 1042;
										this._errHandler.sync(this);
										switch (this._input.LA(1)) {
											case 93:
												{
													this.state = 1038;
													this.match(SQLiteParser.ISNULL_);
												}
												break;
											case 103:
												{
													this.state = 1039;
													this.match(SQLiteParser.NOTNULL_);
												}
												break;
											case 102:
												{
													this.state = 1040;
													this.match(SQLiteParser.NOT_);
													this.state = 1041;
													this.match(SQLiteParser.NULL_);
												}
												break;
											default:
												throw new NoViableAltException(this);
										}
									}
									break;
								case 14:
									{
										localctx = new ExprContext(this, _parentctx, _parentState);
										this.pushNewRecursionContext(localctx, _startState, SQLiteParser.RULE_expr);
										this.state = 1044;
										if (!(this.precpred(this._ctx, 4))) {
											throw this.createFailedPredicateException("this.precpred(this._ctx, 4)");
										}
										this.state = 1046;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
										if (_la === 102) {
											{
												this.state = 1045;
												this.match(SQLiteParser.NOT_);
											}
										}

										this.state = 1048;
										this.match(SQLiteParser.IN_);
										this.state = 1087;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 136, this._ctx)) {
											case 1:
												{
													this.state = 1049;
													this.match(SQLiteParser.OPEN_PAR);
													this.state = 1059;
													this._errHandler.sync(this);
													switch (this._interp.adaptivePredict(this._input, 131, this._ctx)) {
														case 1:
															{
																this.state = 1050;
																this.select_stmt();
															}
															break;
														case 2:
															{
																this.state = 1051;
																this.expr(0);
																this.state = 1056;
																this._errHandler.sync(this);
																_la = this._input.LA(1);
																while (_la === 5) {
																	{
																		{
																			this.state = 1052;
																			this.match(SQLiteParser.COMMA);
																			this.state = 1053;
																			this.expr(0);
																		}
																	}
																	this.state = 1058;
																	this._errHandler.sync(this);
																	_la = this._input.LA(1);
																}
															}
															break;
													}
													this.state = 1061;
													this.match(SQLiteParser.CLOSE_PAR);
												}
												break;
											case 2:
												{
													this.state = 1065;
													this._errHandler.sync(this);
													switch (this._interp.adaptivePredict(this._input, 132, this._ctx)) {
														case 1:
															{
																this.state = 1062;
																this.schema_name();
																this.state = 1063;
																this.match(SQLiteParser.DOT);
															}
															break;
													}
													this.state = 1067;
													this.table_name();
												}
												break;
											case 3:
												{
													this.state = 1071;
													this._errHandler.sync(this);
													switch (this._interp.adaptivePredict(this._input, 133, this._ctx)) {
														case 1:
															{
																this.state = 1068;
																this.schema_name();
																this.state = 1069;
																this.match(SQLiteParser.DOT);
															}
															break;
													}
													this.state = 1073;
													this.table_function_name();
													this.state = 1074;
													this.match(SQLiteParser.OPEN_PAR);
													this.state = 1083;
													this._errHandler.sync(this);
													_la = this._input.LA(1);
													if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4261414664) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4026531839) !== 0) || ((((_la - 128)) & ~0x1F) === 0 && ((1 << (_la - 128)) & 4294967295) !== 0) || ((((_la - 160)) & ~0x1F) === 0 && ((1 << (_la - 160)) & 1042284543) !== 0)) {
														{
															this.state = 1075;
															this.expr(0);
															this.state = 1080;
															this._errHandler.sync(this);
															_la = this._input.LA(1);
															while (_la === 5) {
																{
																	{
																		this.state = 1076;
																		this.match(SQLiteParser.COMMA);
																		this.state = 1077;
																		this.expr(0);
																	}
																}
																this.state = 1082;
																this._errHandler.sync(this);
																_la = this._input.LA(1);
															}
														}
													}

													this.state = 1085;
													this.match(SQLiteParser.CLOSE_PAR);
												}
												break;
										}
									}
									break;
							}
						}
					}
					this.state = 1093;
					this._errHandler.sync(this);
					_alt = this._interp.adaptivePredict(this._input, 138, this._ctx);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return localctx;
	}
	// @RuleVersion(0)
	public raise_function(): Raise_functionContext {
		let localctx: Raise_functionContext = new Raise_functionContext(this, this._ctx, this.state);
		this.enterRule(localctx, 66, SQLiteParser.RULE_raise_function);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1094;
				this.match(SQLiteParser.RAISE_);
				this.state = 1095;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1100;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 81:
						{
							this.state = 1096;
							this.match(SQLiteParser.IGNORE_);
						}
						break;
					case 25:
					case 72:
					case 126:
						{
							this.state = 1097;
							_la = this._input.LA(1);
							if (!(_la === 25 || _la === 72 || _la === 126)) {
								this._errHandler.recoverInline(this);
							}
							else {
								this._errHandler.reportMatch(this);
								this.consume();
							}
							this.state = 1098;
							this.match(SQLiteParser.COMMA);
							this.state = 1099;
							this.error_message();
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
				this.state = 1102;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public literal_value(): Literal_valueContext {
		let localctx: Literal_valueContext = new Literal_valueContext(this, this._ctx, this.state);
		this.enterRule(localctx, 68, SQLiteParser.RULE_literal_value);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1104;
				_la = this._input.LA(1);
				if (!(((((_la - 52)) & ~0x1F) === 0 && ((1 << (_la - 52)) & 7) !== 0) || _la === 104 || ((((_la - 172)) & ~0x1F) === 0 && ((1 << (_la - 172)) & 212995) !== 0))) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public value_row(): Value_rowContext {
		let localctx: Value_rowContext = new Value_rowContext(this, this._ctx, this.state);
		this.enterRule(localctx, 70, SQLiteParser.RULE_value_row);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1106;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1107;
				this.expr(0);
				this.state = 1112;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1108;
							this.match(SQLiteParser.COMMA);
							this.state = 1109;
							this.expr(0);
						}
					}
					this.state = 1114;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 1115;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public values_clause(): Values_clauseContext {
		let localctx: Values_clauseContext = new Values_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 72, SQLiteParser.RULE_values_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1117;
				this.match(SQLiteParser.VALUES_);
				this.state = 1118;
				this.value_row();
				this.state = 1123;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1119;
							this.match(SQLiteParser.COMMA);
							this.state = 1120;
							this.value_row();
						}
					}
					this.state = 1125;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public insert_stmt(): Insert_stmtContext {
		let localctx: Insert_stmtContext = new Insert_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 74, SQLiteParser.RULE_insert_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1127;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 1126;
						this.with_clause();
					}
				}

				this.state = 1134;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 143, this._ctx)) {
					case 1:
						{
							this.state = 1129;
							this.match(SQLiteParser.INSERT_);
						}
						break;
					case 2:
						{
							this.state = 1130;
							this.match(SQLiteParser.REPLACE_);
						}
						break;
					case 3:
						{
							this.state = 1131;
							this.match(SQLiteParser.INSERT_);
							this.state = 1132;
							this.match(SQLiteParser.OR_);
							this.state = 1133;
							_la = this._input.LA(1);
							if (!(_la === 25 || _la === 72 || _la === 81 || _la === 122 || _la === 126)) {
								this._errHandler.recoverInline(this);
							}
							else {
								this._errHandler.reportMatch(this);
								this.consume();
							}
						}
						break;
				}
				this.state = 1136;
				this.match(SQLiteParser.INTO_);
				this.state = 1140;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 144, this._ctx)) {
					case 1:
						{
							this.state = 1137;
							this.schema_name();
							this.state = 1138;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 1142;
				this.table_name();
				this.state = 1145;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 33) {
					{
						this.state = 1143;
						this.match(SQLiteParser.AS_);
						this.state = 1144;
						this.table_alias();
					}
				}

				this.state = 1158;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 1147;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1148;
						this.column_name();
						this.state = 1153;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 1149;
									this.match(SQLiteParser.COMMA);
									this.state = 1150;
									this.column_name();
								}
							}
							this.state = 1155;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 1156;
						this.match(SQLiteParser.CLOSE_PAR);
					}
				}

				this.state = 1169;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 130:
					case 144:
					case 149:
						{
							{
								this.state = 1162;
								this._errHandler.sync(this);
								switch (this._interp.adaptivePredict(this._input, 148, this._ctx)) {
									case 1:
										{
											this.state = 1160;
											this.values_clause();
										}
										break;
									case 2:
										{
											this.state = 1161;
											this.select_stmt();
										}
										break;
								}
								this.state = 1165;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								if (_la === 107) {
									{
										this.state = 1164;
										this.upsert_clause();
									}
								}

							}
						}
						break;
					case 56:
						{
							this.state = 1167;
							this.match(SQLiteParser.DEFAULT_);
							this.state = 1168;
							this.match(SQLiteParser.VALUES_);
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
				this.state = 1172;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 124) {
					{
						this.state = 1171;
						this.returning_clause();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public returning_clause(): Returning_clauseContext {
		let localctx: Returning_clauseContext = new Returning_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 76, SQLiteParser.RULE_returning_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1174;
				this.match(SQLiteParser.RETURNING_);
				this.state = 1175;
				this.result_column();
				this.state = 1180;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1176;
							this.match(SQLiteParser.COMMA);
							this.state = 1177;
							this.result_column();
						}
					}
					this.state = 1182;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public upsert_clause(): Upsert_clauseContext {
		let localctx: Upsert_clauseContext = new Upsert_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 78, SQLiteParser.RULE_upsert_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1183;
				this.match(SQLiteParser.ON_);
				this.state = 1184;
				this.match(SQLiteParser.CONFLICT_);
				this.state = 1199;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 3) {
					{
						this.state = 1185;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1186;
						this.indexed_column();
						this.state = 1191;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 1187;
									this.match(SQLiteParser.COMMA);
									this.state = 1188;
									this.indexed_column();
								}
							}
							this.state = 1193;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 1194;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1197;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 148) {
							{
								this.state = 1195;
								this.match(SQLiteParser.WHERE_);
								this.state = 1196;
								this.expr(0);
							}
						}

					}
				}

				this.state = 1201;
				this.match(SQLiteParser.DO_);
				this.state = 1228;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 184:
						{
							this.state = 1202;
							this.match(SQLiteParser.NOTHING_);
						}
						break;
					case 141:
						{
							this.state = 1203;
							this.match(SQLiteParser.UPDATE_);
							this.state = 1204;
							this.match(SQLiteParser.SET_);
							{
								this.state = 1207;
								this._errHandler.sync(this);
								switch (this._interp.adaptivePredict(this._input, 156, this._ctx)) {
									case 1:
										{
											this.state = 1205;
											this.column_name();
										}
										break;
									case 2:
										{
											this.state = 1206;
											this.column_name_list();
										}
										break;
								}
								this.state = 1209;
								this.match(SQLiteParser.ASSIGN);
								this.state = 1210;
								this.expr(0);
								this.state = 1221;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								while (_la === 5) {
									{
										{
											this.state = 1211;
											this.match(SQLiteParser.COMMA);
											this.state = 1214;
											this._errHandler.sync(this);
											switch (this._interp.adaptivePredict(this._input, 157, this._ctx)) {
												case 1:
													{
														this.state = 1212;
														this.column_name();
													}
													break;
												case 2:
													{
														this.state = 1213;
														this.column_name_list();
													}
													break;
											}
											this.state = 1216;
											this.match(SQLiteParser.ASSIGN);
											this.state = 1217;
											this.expr(0);
										}
									}
									this.state = 1223;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
								}
								this.state = 1226;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								if (_la === 148) {
									{
										this.state = 1224;
										this.match(SQLiteParser.WHERE_);
										this.state = 1225;
										this.expr(0);
									}
								}

							}
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pragma_stmt(): Pragma_stmtContext {
		let localctx: Pragma_stmtContext = new Pragma_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 80, SQLiteParser.RULE_pragma_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1230;
				this.match(SQLiteParser.PRAGMA_);
				this.state = 1234;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 161, this._ctx)) {
					case 1:
						{
							this.state = 1231;
							this.schema_name();
							this.state = 1232;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 1236;
				this.pragma_name();
				this.state = 1243;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 6:
						{
							this.state = 1237;
							this.match(SQLiteParser.ASSIGN);
							this.state = 1238;
							this.pragma_value();
						}
						break;
					case 3:
						{
							this.state = 1239;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 1240;
							this.pragma_value();
							this.state = 1241;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
					case -1:
					case 1:
					case 30:
					case 31:
					case 35:
					case 38:
					case 47:
					case 50:
					case 59:
					case 61:
					case 63:
					case 66:
					case 71:
					case 88:
					case 112:
					case 119:
					case 120:
					case 122:
					case 126:
					case 129:
					case 130:
					case 141:
					case 143:
					case 144:
					case 149:
						break;
					default:
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pragma_value(): Pragma_valueContext {
		let localctx: Pragma_valueContext = new Pragma_valueContext(this, this._ctx, this.state);
		this.enterRule(localctx, 82, SQLiteParser.RULE_pragma_value);
		try {
			this.state = 1248;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 163, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1245;
						this.signed_number();
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1246;
						this.name();
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1247;
						this.match(SQLiteParser.STRING_LITERAL);
					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public reindex_stmt(): Reindex_stmtContext {
		let localctx: Reindex_stmtContext = new Reindex_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 84, SQLiteParser.RULE_reindex_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1250;
				this.match(SQLiteParser.REINDEX_);
				this.state = 1261;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 166, this._ctx)) {
					case 1:
						{
							this.state = 1251;
							this.collation_name();
						}
						break;
					case 2:
						{
							this.state = 1255;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 164, this._ctx)) {
								case 1:
									{
										this.state = 1252;
										this.schema_name();
										this.state = 1253;
										this.match(SQLiteParser.DOT);
									}
									break;
							}
							this.state = 1259;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 165, this._ctx)) {
								case 1:
									{
										this.state = 1257;
										this.table_name();
									}
									break;
								case 2:
									{
										this.state = 1258;
										this.index_name();
									}
									break;
							}
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public select_stmt(): Select_stmtContext {
		let localctx: Select_stmtContext = new Select_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 86, SQLiteParser.RULE_select_stmt);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1264;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 1263;
						this.common_table_stmt();
					}
				}

				this.state = 1266;
				this.select_core();
				this.state = 1272;
				this._errHandler.sync(this);
				_alt = this._interp.adaptivePredict(this._input, 168, this._ctx);
				while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
					if (_alt === 1) {
						{
							{
								this.state = 1267;
								this.compound_operator();
								this.state = 1268;
								this.select_core();
							}
						}
					}
					this.state = 1274;
					this._errHandler.sync(this);
					_alt = this._interp.adaptivePredict(this._input, 168, this._ctx);
				}
				this.state = 1276;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 109) {
					{
						this.state = 1275;
						this.order_by_stmt();
					}
				}

				this.state = 1279;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 98) {
					{
						this.state = 1278;
						this.limit_stmt();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public join_clause(): Join_clauseContext {
		let localctx: Join_clauseContext = new Join_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 88, SQLiteParser.RULE_join_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1281;
				this.table_or_subquery();
				this.state = 1289;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5 || _la === 51 || _la === 76 || ((((_la - 87)) & ~0x1F) === 0 && ((1 << (_la - 87)) & 8833) !== 0) || _la === 125) {
					{
						{
							this.state = 1282;
							this.join_operator();
							this.state = 1283;
							this.table_or_subquery();
							this.state = 1285;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 171, this._ctx)) {
								case 1:
									{
										this.state = 1284;
										this.join_constraint();
									}
									break;
							}
						}
					}
					this.state = 1291;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public select_core(): Select_coreContext {
		let localctx: Select_coreContext = new Select_coreContext(this, this._ctx, this.state);
		this.enterRule(localctx, 90, SQLiteParser.RULE_select_core);
		let _la: number;
		try {
			this.state = 1355;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 130:
					this.enterOuterAlt(localctx, 1);
					{
						{
							this.state = 1292;
							this.match(SQLiteParser.SELECT_);
							this.state = 1294;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 173, this._ctx)) {
								case 1:
									{
										this.state = 1293;
										_la = this._input.LA(1);
										if (!(_la === 29 || _la === 62)) {
											this._errHandler.recoverInline(this);
										}
										else {
											this._errHandler.reportMatch(this);
											this.consume();
										}
									}
									break;
							}
							this.state = 1296;
							this.result_column();
							this.state = 1301;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 1297;
										this.match(SQLiteParser.COMMA);
										this.state = 1298;
										this.result_column();
									}
								}
								this.state = 1303;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
							this.state = 1316;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 75) {
								{
									this.state = 1304;
									this.match(SQLiteParser.FROM_);
									this.state = 1314;
									this._errHandler.sync(this);
									switch (this._interp.adaptivePredict(this._input, 176, this._ctx)) {
										case 1:
											{
												this.state = 1305;
												this.table_or_subquery();
												this.state = 1310;
												this._errHandler.sync(this);
												_la = this._input.LA(1);
												while (_la === 5) {
													{
														{
															this.state = 1306;
															this.match(SQLiteParser.COMMA);
															this.state = 1307;
															this.table_or_subquery();
														}
													}
													this.state = 1312;
													this._errHandler.sync(this);
													_la = this._input.LA(1);
												}
											}
											break;
										case 2:
											{
												this.state = 1313;
												this.join_clause();
											}
											break;
									}
								}
							}

							this.state = 1320;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 148) {
								{
									this.state = 1318;
									this.match(SQLiteParser.WHERE_);
									this.state = 1319;
									localctx._whereExpr = this.expr(0);
								}
							}

							this.state = 1336;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 78) {
								{
									this.state = 1322;
									this.match(SQLiteParser.GROUP_);
									this.state = 1323;
									this.match(SQLiteParser.BY_);
									this.state = 1324;
									localctx._expr = this.expr(0);
									localctx._groupByExpr.push(localctx._expr);
									this.state = 1329;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 1325;
												this.match(SQLiteParser.COMMA);
												this.state = 1326;
												localctx._expr = this.expr(0);
												localctx._groupByExpr.push(localctx._expr);
											}
										}
										this.state = 1331;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
									this.state = 1334;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									if (_la === 79) {
										{
											this.state = 1332;
											this.match(SQLiteParser.HAVING_);
											this.state = 1333;
											localctx._havingExpr = this.expr(0);
										}
									}

								}
							}

							this.state = 1352;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 174) {
								{
									this.state = 1338;
									this.match(SQLiteParser.WINDOW_);
									this.state = 1339;
									this.window_name();
									this.state = 1340;
									this.match(SQLiteParser.AS_);
									this.state = 1341;
									this.window_defn();
									this.state = 1349;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 1342;
												this.match(SQLiteParser.COMMA);
												this.state = 1343;
												this.window_name();
												this.state = 1344;
												this.match(SQLiteParser.AS_);
												this.state = 1345;
												this.window_defn();
											}
										}
										this.state = 1351;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
								}
							}

						}
					}
					break;
				case 144:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1354;
						this.values_clause();
					}
					break;
				default:
					throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public factored_select_stmt(): Factored_select_stmtContext {
		let localctx: Factored_select_stmtContext = new Factored_select_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 92, SQLiteParser.RULE_factored_select_stmt);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1357;
				this.select_stmt();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public simple_select_stmt(): Simple_select_stmtContext {
		let localctx: Simple_select_stmtContext = new Simple_select_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 94, SQLiteParser.RULE_simple_select_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1360;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 1359;
						this.common_table_stmt();
					}
				}

				this.state = 1362;
				this.select_core();
				this.state = 1364;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 109) {
					{
						this.state = 1363;
						this.order_by_stmt();
					}
				}

				this.state = 1367;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 98) {
					{
						this.state = 1366;
						this.limit_stmt();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public compound_select_stmt(): Compound_select_stmtContext {
		let localctx: Compound_select_stmtContext = new Compound_select_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 96, SQLiteParser.RULE_compound_select_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1370;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 1369;
						this.common_table_stmt();
					}
				}

				this.state = 1372;
				this.select_core();
				this.state = 1382;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				do {
					{
						{
							this.state = 1379;
							this._errHandler.sync(this);
							switch (this._input.LA(1)) {
								case 139:
									{
										this.state = 1373;
										this.match(SQLiteParser.UNION_);
										this.state = 1375;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
										if (_la === 29) {
											{
												this.state = 1374;
												this.match(SQLiteParser.ALL_);
											}
										}

									}
									break;
								case 90:
									{
										this.state = 1377;
										this.match(SQLiteParser.INTERSECT_);
									}
									break;
								case 68:
									{
										this.state = 1378;
										this.match(SQLiteParser.EXCEPT_);
									}
									break;
								default:
									throw new NoViableAltException(this);
							}
							this.state = 1381;
							this.select_core();
						}
					}
					this.state = 1384;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				} while (_la === 68 || _la === 90 || _la === 139);
				this.state = 1387;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 109) {
					{
						this.state = 1386;
						this.order_by_stmt();
					}
				}

				this.state = 1390;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 98) {
					{
						this.state = 1389;
						this.limit_stmt();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public table_or_subquery(): Table_or_subqueryContext {
		let localctx: Table_or_subqueryContext = new Table_or_subqueryContext(this, this._ctx, this.state);
		this.enterRule(localctx, 98, SQLiteParser.RULE_table_or_subquery);
		let _la: number;
		try {
			this.state = 1456;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 206, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						{
							this.state = 1395;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 194, this._ctx)) {
								case 1:
									{
										this.state = 1392;
										this.schema_name();
										this.state = 1393;
										this.match(SQLiteParser.DOT);
									}
									break;
							}
							this.state = 1397;
							this.table_name();
							this.state = 1402;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 196, this._ctx)) {
								case 1:
									{
										this.state = 1399;
										this._errHandler.sync(this);
										switch (this._interp.adaptivePredict(this._input, 195, this._ctx)) {
											case 1:
												{
													this.state = 1398;
													this.match(SQLiteParser.AS_);
												}
												break;
										}
										this.state = 1401;
										this.table_alias();
									}
									break;
							}
							this.state = 1409;
							this._errHandler.sync(this);
							switch (this._input.LA(1)) {
								case 85:
									{
										this.state = 1404;
										this.match(SQLiteParser.INDEXED_);
										this.state = 1405;
										this.match(SQLiteParser.BY_);
										this.state = 1406;
										this.index_name();
									}
									break;
								case 102:
									{
										this.state = 1407;
										this.match(SQLiteParser.NOT_);
										this.state = 1408;
										this.match(SQLiteParser.INDEXED_);
									}
									break;
								case -1:
								case 1:
								case 4:
								case 5:
								case 30:
								case 31:
								case 35:
								case 38:
								case 47:
								case 50:
								case 51:
								case 59:
								case 61:
								case 63:
								case 66:
								case 68:
								case 71:
								case 76:
								case 78:
								case 87:
								case 88:
								case 90:
								case 94:
								case 96:
								case 98:
								case 100:
								case 107:
								case 109:
								case 112:
								case 119:
								case 120:
								case 122:
								case 124:
								case 125:
								case 126:
								case 129:
								case 130:
								case 139:
								case 141:
								case 142:
								case 143:
								case 144:
								case 148:
								case 149:
								case 174:
									break;
								default:
									break;
							}
						}
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1414;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 198, this._ctx)) {
							case 1:
								{
									this.state = 1411;
									this.schema_name();
									this.state = 1412;
									this.match(SQLiteParser.DOT);
								}
								break;
						}
						this.state = 1416;
						this.table_function_name();
						this.state = 1417;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1418;
						this.expr(0);
						this.state = 1423;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 1419;
									this.match(SQLiteParser.COMMA);
									this.state = 1420;
									this.expr(0);
								}
							}
							this.state = 1425;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 1426;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1431;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 201, this._ctx)) {
							case 1:
								{
									this.state = 1428;
									this._errHandler.sync(this);
									switch (this._interp.adaptivePredict(this._input, 200, this._ctx)) {
										case 1:
											{
												this.state = 1427;
												this.match(SQLiteParser.AS_);
											}
											break;
									}
									this.state = 1430;
									this.table_alias();
								}
								break;
						}
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1433;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1443;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 203, this._ctx)) {
							case 1:
								{
									this.state = 1434;
									this.table_or_subquery();
									this.state = 1439;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 1435;
												this.match(SQLiteParser.COMMA);
												this.state = 1436;
												this.table_or_subquery();
											}
										}
										this.state = 1441;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
								}
								break;
							case 2:
								{
									this.state = 1442;
									this.join_clause();
								}
								break;
						}
						this.state = 1445;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				case 4:
					this.enterOuterAlt(localctx, 4);
					{
						this.state = 1447;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1448;
						this.select_stmt();
						this.state = 1449;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1454;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 205, this._ctx)) {
							case 1:
								{
									this.state = 1451;
									this._errHandler.sync(this);
									switch (this._interp.adaptivePredict(this._input, 204, this._ctx)) {
										case 1:
											{
												this.state = 1450;
												this.match(SQLiteParser.AS_);
											}
											break;
									}
									this.state = 1453;
									this.table_alias();
								}
								break;
						}
					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public result_column(): Result_columnContext {
		let localctx: Result_columnContext = new Result_columnContext(this, this._ctx, this.state);
		this.enterRule(localctx, 100, SQLiteParser.RULE_result_column);
		let _la: number;
		try {
			this.state = 1470;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 209, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1458;
						this.match(SQLiteParser.STAR);
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1459;
						this.table_name();
						this.state = 1460;
						this.match(SQLiteParser.DOT);
						this.state = 1461;
						this.match(SQLiteParser.STAR);
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1463;
						this.expr(0);
						this.state = 1468;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 33 || _la === 185 || _la === 188) {
							{
								this.state = 1465;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
								if (_la === 33) {
									{
										this.state = 1464;
										this.match(SQLiteParser.AS_);
									}
								}

								this.state = 1467;
								this.column_alias();
							}
						}

					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public join_operator(): Join_operatorContext {
		let localctx: Join_operatorContext = new Join_operatorContext(this, this._ctx, this.state);
		this.enterRule(localctx, 102, SQLiteParser.RULE_join_operator);
		let _la: number;
		try {
			this.state = 1485;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 5:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1472;
						this.match(SQLiteParser.COMMA);
					}
					break;
				case 51:
				case 76:
				case 87:
				case 94:
				case 96:
				case 100:
				case 125:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1474;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 100) {
							{
								this.state = 1473;
								this.match(SQLiteParser.NATURAL_);
							}
						}

						this.state = 1482;
						this._errHandler.sync(this);
						switch (this._input.LA(1)) {
							case 76:
							case 96:
							case 125:
								{
									this.state = 1476;
									_la = this._input.LA(1);
									if (!(_la === 76 || _la === 96 || _la === 125)) {
										this._errHandler.recoverInline(this);
									}
									else {
										this._errHandler.reportMatch(this);
										this.consume();
									}
									this.state = 1478;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									if (_la === 110) {
										{
											this.state = 1477;
											this.match(SQLiteParser.OUTER_);
										}
									}

								}
								break;
							case 87:
								{
									this.state = 1480;
									this.match(SQLiteParser.INNER_);
								}
								break;
							case 51:
								{
									this.state = 1481;
									this.match(SQLiteParser.CROSS_);
								}
								break;
							case 94:
								break;
							default:
								break;
						}
						this.state = 1484;
						this.match(SQLiteParser.JOIN_);
					}
					break;
				default:
					throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public join_constraint(): Join_constraintContext {
		let localctx: Join_constraintContext = new Join_constraintContext(this, this._ctx, this.state);
		this.enterRule(localctx, 104, SQLiteParser.RULE_join_constraint);
		let _la: number;
		try {
			this.state = 1501;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 107:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1487;
						this.match(SQLiteParser.ON_);
						this.state = 1488;
						this.expr(0);
					}
					break;
				case 142:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1489;
						this.match(SQLiteParser.USING_);
						this.state = 1490;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1491;
						this.column_name();
						this.state = 1496;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 1492;
									this.match(SQLiteParser.COMMA);
									this.state = 1493;
									this.column_name();
								}
							}
							this.state = 1498;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						this.state = 1499;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				default:
					throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public compound_operator(): Compound_operatorContext {
		let localctx: Compound_operatorContext = new Compound_operatorContext(this, this._ctx, this.state);
		this.enterRule(localctx, 106, SQLiteParser.RULE_compound_operator);
		let _la: number;
		try {
			this.state = 1509;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 139:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1503;
						this.match(SQLiteParser.UNION_);
						this.state = 1505;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 29) {
							{
								this.state = 1504;
								this.match(SQLiteParser.ALL_);
							}
						}

					}
					break;
				case 90:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1507;
						this.match(SQLiteParser.INTERSECT_);
					}
					break;
				case 68:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1508;
						this.match(SQLiteParser.EXCEPT_);
					}
					break;
				default:
					throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public update_stmt(): Update_stmtContext {
		let localctx: Update_stmtContext = new Update_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 108, SQLiteParser.RULE_update_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1512;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 1511;
						this.with_clause();
					}
				}

				this.state = 1514;
				this.match(SQLiteParser.UPDATE_);
				this.state = 1517;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 219, this._ctx)) {
					case 1:
						{
							this.state = 1515;
							this.match(SQLiteParser.OR_);
							this.state = 1516;
							_la = this._input.LA(1);
							if (!(_la === 25 || _la === 72 || _la === 81 || _la === 122 || _la === 126)) {
								this._errHandler.recoverInline(this);
							}
							else {
								this._errHandler.reportMatch(this);
								this.consume();
							}
						}
						break;
				}
				this.state = 1519;
				this.qualified_table_name();
				this.state = 1520;
				this.match(SQLiteParser.SET_);
				this.state = 1523;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 220, this._ctx)) {
					case 1:
						{
							this.state = 1521;
							this.column_name();
						}
						break;
					case 2:
						{
							this.state = 1522;
							this.column_name_list();
						}
						break;
				}
				this.state = 1525;
				this.match(SQLiteParser.ASSIGN);
				this.state = 1526;
				this.expr(0);
				this.state = 1537;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1527;
							this.match(SQLiteParser.COMMA);
							this.state = 1530;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 221, this._ctx)) {
								case 1:
									{
										this.state = 1528;
										this.column_name();
									}
									break;
								case 2:
									{
										this.state = 1529;
										this.column_name_list();
									}
									break;
							}
							this.state = 1532;
							this.match(SQLiteParser.ASSIGN);
							this.state = 1533;
							this.expr(0);
						}
					}
					this.state = 1539;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 1552;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 75) {
					{
						this.state = 1540;
						this.match(SQLiteParser.FROM_);
						this.state = 1550;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 224, this._ctx)) {
							case 1:
								{
									this.state = 1541;
									this.table_or_subquery();
									this.state = 1546;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 1542;
												this.match(SQLiteParser.COMMA);
												this.state = 1543;
												this.table_or_subquery();
											}
										}
										this.state = 1548;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
								}
								break;
							case 2:
								{
									this.state = 1549;
									this.join_clause();
								}
								break;
						}
					}
				}

				this.state = 1556;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 148) {
					{
						this.state = 1554;
						this.match(SQLiteParser.WHERE_);
						this.state = 1555;
						this.expr(0);
					}
				}

				this.state = 1559;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 124) {
					{
						this.state = 1558;
						this.returning_clause();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public column_name_list(): Column_name_listContext {
		let localctx: Column_name_listContext = new Column_name_listContext(this, this._ctx, this.state);
		this.enterRule(localctx, 110, SQLiteParser.RULE_column_name_list);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1561;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1562;
				this.column_name();
				this.state = 1567;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1563;
							this.match(SQLiteParser.COMMA);
							this.state = 1564;
							this.column_name();
						}
					}
					this.state = 1569;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 1570;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public update_stmt_limited(): Update_stmt_limitedContext {
		let localctx: Update_stmt_limitedContext = new Update_stmt_limitedContext(this, this._ctx, this.state);
		this.enterRule(localctx, 112, SQLiteParser.RULE_update_stmt_limited);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1573;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 149) {
					{
						this.state = 1572;
						this.with_clause();
					}
				}

				this.state = 1575;
				this.match(SQLiteParser.UPDATE_);
				this.state = 1578;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 230, this._ctx)) {
					case 1:
						{
							this.state = 1576;
							this.match(SQLiteParser.OR_);
							this.state = 1577;
							_la = this._input.LA(1);
							if (!(_la === 25 || _la === 72 || _la === 81 || _la === 122 || _la === 126)) {
								this._errHandler.recoverInline(this);
							}
							else {
								this._errHandler.reportMatch(this);
								this.consume();
							}
						}
						break;
				}
				this.state = 1580;
				this.qualified_table_name();
				this.state = 1581;
				this.match(SQLiteParser.SET_);
				this.state = 1584;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 231, this._ctx)) {
					case 1:
						{
							this.state = 1582;
							this.column_name();
						}
						break;
					case 2:
						{
							this.state = 1583;
							this.column_name_list();
						}
						break;
				}
				this.state = 1586;
				this.match(SQLiteParser.ASSIGN);
				this.state = 1587;
				this.expr(0);
				this.state = 1598;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1588;
							this.match(SQLiteParser.COMMA);
							this.state = 1591;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 232, this._ctx)) {
								case 1:
									{
										this.state = 1589;
										this.column_name();
									}
									break;
								case 2:
									{
										this.state = 1590;
										this.column_name_list();
									}
									break;
							}
							this.state = 1593;
							this.match(SQLiteParser.ASSIGN);
							this.state = 1594;
							this.expr(0);
						}
					}
					this.state = 1600;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 1603;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 148) {
					{
						this.state = 1601;
						this.match(SQLiteParser.WHERE_);
						this.state = 1602;
						this.expr(0);
					}
				}

				this.state = 1606;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 124) {
					{
						this.state = 1605;
						this.returning_clause();
					}
				}

				this.state = 1612;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 98 || _la === 109) {
					{
						this.state = 1609;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 109) {
							{
								this.state = 1608;
								this.order_by_stmt();
							}
						}

						this.state = 1611;
						this.limit_stmt();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public qualified_table_name(): Qualified_table_nameContext {
		let localctx: Qualified_table_nameContext = new Qualified_table_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 114, SQLiteParser.RULE_qualified_table_name);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1617;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 238, this._ctx)) {
					case 1:
						{
							this.state = 1614;
							this.schema_name();
							this.state = 1615;
							this.match(SQLiteParser.DOT);
						}
						break;
				}
				this.state = 1619;
				this.table_name();
				this.state = 1622;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 33) {
					{
						this.state = 1620;
						this.match(SQLiteParser.AS_);
						this.state = 1621;
						this.alias();
					}
				}

				this.state = 1629;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 85:
						{
							this.state = 1624;
							this.match(SQLiteParser.INDEXED_);
							this.state = 1625;
							this.match(SQLiteParser.BY_);
							this.state = 1626;
							this.index_name();
						}
						break;
					case 102:
						{
							this.state = 1627;
							this.match(SQLiteParser.NOT_);
							this.state = 1628;
							this.match(SQLiteParser.INDEXED_);
						}
						break;
					case -1:
					case 1:
					case 30:
					case 31:
					case 35:
					case 38:
					case 47:
					case 50:
					case 59:
					case 61:
					case 63:
					case 66:
					case 71:
					case 88:
					case 98:
					case 109:
					case 112:
					case 119:
					case 120:
					case 122:
					case 124:
					case 126:
					case 129:
					case 130:
					case 131:
					case 141:
					case 143:
					case 144:
					case 148:
					case 149:
						break;
					default:
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public vacuum_stmt(): Vacuum_stmtContext {
		let localctx: Vacuum_stmtContext = new Vacuum_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 116, SQLiteParser.RULE_vacuum_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1631;
				this.match(SQLiteParser.VACUUM_);
				this.state = 1633;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 241, this._ctx)) {
					case 1:
						{
							this.state = 1632;
							this.schema_name();
						}
						break;
				}
				this.state = 1637;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 91) {
					{
						this.state = 1635;
						this.match(SQLiteParser.INTO_);
						this.state = 1636;
						this.filename();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public filter_clause(): Filter_clauseContext {
		let localctx: Filter_clauseContext = new Filter_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 118, SQLiteParser.RULE_filter_clause);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1639;
				this.match(SQLiteParser.FILTER_);
				this.state = 1640;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1641;
				this.match(SQLiteParser.WHERE_);
				this.state = 1642;
				this.expr(0);
				this.state = 1643;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public window_defn(): Window_defnContext {
		let localctx: Window_defnContext = new Window_defnContext(this, this._ctx, this.state);
		this.enterRule(localctx, 120, SQLiteParser.RULE_window_defn);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1645;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1647;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 243, this._ctx)) {
					case 1:
						{
							this.state = 1646;
							this.base_window_name();
						}
						break;
				}
				this.state = 1659;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 153) {
					{
						this.state = 1649;
						this.match(SQLiteParser.PARTITION_);
						this.state = 1650;
						this.match(SQLiteParser.BY_);
						this.state = 1651;
						this.expr(0);
						this.state = 1656;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la === 5) {
							{
								{
									this.state = 1652;
									this.match(SQLiteParser.COMMA);
									this.state = 1653;
									this.expr(0);
								}
							}
							this.state = 1658;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
					}
				}

				{
					this.state = 1661;
					this.match(SQLiteParser.ORDER_);
					this.state = 1662;
					this.match(SQLiteParser.BY_);
					this.state = 1663;
					this.ordering_term();
					this.state = 1668;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la === 5) {
						{
							{
								this.state = 1664;
								this.match(SQLiteParser.COMMA);
								this.state = 1665;
								this.ordering_term();
							}
						}
						this.state = 1670;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
				}
				this.state = 1672;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 128 || _la === 154 || _la === 179) {
					{
						this.state = 1671;
						this.frame_spec();
					}
				}

				this.state = 1674;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public over_clause(): Over_clauseContext {
		let localctx: Over_clauseContext = new Over_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 122, SQLiteParser.RULE_over_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1676;
				this.match(SQLiteParser.OVER_);
				this.state = 1710;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 254, this._ctx)) {
					case 1:
						{
							this.state = 1677;
							this.window_name();
						}
						break;
					case 2:
						{
							this.state = 1678;
							this.match(SQLiteParser.OPEN_PAR);
							this.state = 1680;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 248, this._ctx)) {
								case 1:
									{
										this.state = 1679;
										this.base_window_name();
									}
									break;
							}
							this.state = 1692;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 153) {
								{
									this.state = 1682;
									this.match(SQLiteParser.PARTITION_);
									this.state = 1683;
									this.match(SQLiteParser.BY_);
									this.state = 1684;
									this.expr(0);
									this.state = 1689;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 1685;
												this.match(SQLiteParser.COMMA);
												this.state = 1686;
												this.expr(0);
											}
										}
										this.state = 1691;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
								}
							}

							this.state = 1704;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 109) {
								{
									this.state = 1694;
									this.match(SQLiteParser.ORDER_);
									this.state = 1695;
									this.match(SQLiteParser.BY_);
									this.state = 1696;
									this.ordering_term();
									this.state = 1701;
									this._errHandler.sync(this);
									_la = this._input.LA(1);
									while (_la === 5) {
										{
											{
												this.state = 1697;
												this.match(SQLiteParser.COMMA);
												this.state = 1698;
												this.ordering_term();
											}
										}
										this.state = 1703;
										this._errHandler.sync(this);
										_la = this._input.LA(1);
									}
								}
							}

							this.state = 1707;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 128 || _la === 154 || _la === 179) {
								{
									this.state = 1706;
									this.frame_spec();
								}
							}

							this.state = 1709;
							this.match(SQLiteParser.CLOSE_PAR);
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public frame_spec(): Frame_specContext {
		let localctx: Frame_specContext = new Frame_specContext(this, this._ctx, this.state);
		this.enterRule(localctx, 124, SQLiteParser.RULE_frame_spec);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1712;
				this.frame_clause();
				this.state = 1722;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 180) {
					{
						this.state = 1713;
						this.match(SQLiteParser.EXCLUDE_);
						this.state = 1720;
						this._errHandler.sync(this);
						switch (this._input.LA(1)) {
							case 101:
								{
									this.state = 1714;
									this.match(SQLiteParser.NO_);
									this.state = 1715;
									this.match(SQLiteParser.OTHERS_);
								}
								break;
							case 157:
								{
									this.state = 1716;
									this.match(SQLiteParser.CURRENT_);
									this.state = 1717;
									this.match(SQLiteParser.ROW_);
								}
								break;
							case 78:
								{
									this.state = 1718;
									this.match(SQLiteParser.GROUP_);
								}
								break;
							case 181:
								{
									this.state = 1719;
									this.match(SQLiteParser.TIES_);
								}
								break;
							default:
								throw new NoViableAltException(this);
						}
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public frame_clause(): Frame_clauseContext {
		let localctx: Frame_clauseContext = new Frame_clauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 126, SQLiteParser.RULE_frame_clause);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1724;
				_la = this._input.LA(1);
				if (!(_la === 128 || _la === 154 || _la === 179)) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 1731;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 257, this._ctx)) {
					case 1:
						{
							this.state = 1725;
							this.frame_single();
						}
						break;
					case 2:
						{
							this.state = 1726;
							this.match(SQLiteParser.BETWEEN_);
							this.state = 1727;
							this.frame_left();
							this.state = 1728;
							this.match(SQLiteParser.AND_);
							this.state = 1729;
							this.frame_right();
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public simple_function_invocation(): Simple_function_invocationContext {
		let localctx: Simple_function_invocationContext = new Simple_function_invocationContext(this, this._ctx, this.state);
		this.enterRule(localctx, 128, SQLiteParser.RULE_simple_function_invocation);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1733;
				this.simple_func();
				this.state = 1734;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1744;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 3:
					case 8:
					case 9:
					case 10:
					case 25:
					case 26:
					case 27:
					case 28:
					case 29:
					case 30:
					case 31:
					case 32:
					case 33:
					case 34:
					case 35:
					case 36:
					case 37:
					case 38:
					case 39:
					case 40:
					case 41:
					case 42:
					case 43:
					case 44:
					case 45:
					case 46:
					case 47:
					case 48:
					case 49:
					case 50:
					case 51:
					case 52:
					case 53:
					case 54:
					case 55:
					case 56:
					case 57:
					case 58:
					case 59:
					case 60:
					case 61:
					case 62:
					case 63:
					case 64:
					case 65:
					case 66:
					case 67:
					case 68:
					case 69:
					case 70:
					case 71:
					case 72:
					case 73:
					case 74:
					case 75:
					case 76:
					case 77:
					case 78:
					case 79:
					case 80:
					case 81:
					case 82:
					case 83:
					case 84:
					case 85:
					case 86:
					case 87:
					case 88:
					case 89:
					case 90:
					case 91:
					case 92:
					case 93:
					case 94:
					case 95:
					case 96:
					case 97:
					case 98:
					case 99:
					case 100:
					case 101:
					case 102:
					case 103:
					case 104:
					case 105:
					case 106:
					case 107:
					case 108:
					case 109:
					case 110:
					case 111:
					case 112:
					case 113:
					case 114:
					case 115:
					case 116:
					case 117:
					case 118:
					case 119:
					case 120:
					case 121:
					case 122:
					case 123:
					case 125:
					case 126:
					case 127:
					case 128:
					case 129:
					case 130:
					case 131:
					case 132:
					case 133:
					case 134:
					case 135:
					case 136:
					case 137:
					case 138:
					case 139:
					case 140:
					case 141:
					case 142:
					case 143:
					case 144:
					case 145:
					case 146:
					case 147:
					case 148:
					case 149:
					case 150:
					case 151:
					case 152:
					case 153:
					case 154:
					case 155:
					case 156:
					case 157:
					case 158:
					case 159:
					case 160:
					case 161:
					case 162:
					case 163:
					case 164:
					case 165:
					case 166:
					case 167:
					case 168:
					case 169:
					case 170:
					case 171:
					case 172:
					case 173:
					case 174:
					case 175:
					case 176:
					case 177:
					case 178:
					case 179:
					case 180:
					case 185:
					case 186:
					case 187:
					case 188:
					case 189:
						{
							this.state = 1735;
							this.expr(0);
							this.state = 1740;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 1736;
										this.match(SQLiteParser.COMMA);
										this.state = 1737;
										this.expr(0);
									}
								}
								this.state = 1742;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
						}
						break;
					case 7:
						{
							this.state = 1743;
							this.match(SQLiteParser.STAR);
						}
						break;
					default:
						throw new NoViableAltException(this);
				}
				this.state = 1746;
				this.match(SQLiteParser.CLOSE_PAR);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public aggregate_function_invocation(): Aggregate_function_invocationContext {
		let localctx: Aggregate_function_invocationContext = new Aggregate_function_invocationContext(this, this._ctx, this.state);
		this.enterRule(localctx, 130, SQLiteParser.RULE_aggregate_function_invocation);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1748;
				this.aggregate_func();
				this.state = 1749;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1762;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 3:
					case 8:
					case 9:
					case 10:
					case 25:
					case 26:
					case 27:
					case 28:
					case 29:
					case 30:
					case 31:
					case 32:
					case 33:
					case 34:
					case 35:
					case 36:
					case 37:
					case 38:
					case 39:
					case 40:
					case 41:
					case 42:
					case 43:
					case 44:
					case 45:
					case 46:
					case 47:
					case 48:
					case 49:
					case 50:
					case 51:
					case 52:
					case 53:
					case 54:
					case 55:
					case 56:
					case 57:
					case 58:
					case 59:
					case 60:
					case 61:
					case 62:
					case 63:
					case 64:
					case 65:
					case 66:
					case 67:
					case 68:
					case 69:
					case 70:
					case 71:
					case 72:
					case 73:
					case 74:
					case 75:
					case 76:
					case 77:
					case 78:
					case 79:
					case 80:
					case 81:
					case 82:
					case 83:
					case 84:
					case 85:
					case 86:
					case 87:
					case 88:
					case 89:
					case 90:
					case 91:
					case 92:
					case 93:
					case 94:
					case 95:
					case 96:
					case 97:
					case 98:
					case 99:
					case 100:
					case 101:
					case 102:
					case 103:
					case 104:
					case 105:
					case 106:
					case 107:
					case 108:
					case 109:
					case 110:
					case 111:
					case 112:
					case 113:
					case 114:
					case 115:
					case 116:
					case 117:
					case 118:
					case 119:
					case 120:
					case 121:
					case 122:
					case 123:
					case 125:
					case 126:
					case 127:
					case 128:
					case 129:
					case 130:
					case 131:
					case 132:
					case 133:
					case 134:
					case 135:
					case 136:
					case 137:
					case 138:
					case 139:
					case 140:
					case 141:
					case 142:
					case 143:
					case 144:
					case 145:
					case 146:
					case 147:
					case 148:
					case 149:
					case 150:
					case 151:
					case 152:
					case 153:
					case 154:
					case 155:
					case 156:
					case 157:
					case 158:
					case 159:
					case 160:
					case 161:
					case 162:
					case 163:
					case 164:
					case 165:
					case 166:
					case 167:
					case 168:
					case 169:
					case 170:
					case 171:
					case 172:
					case 173:
					case 174:
					case 175:
					case 176:
					case 177:
					case 178:
					case 179:
					case 180:
					case 185:
					case 186:
					case 187:
					case 188:
					case 189:
						{
							this.state = 1751;
							this._errHandler.sync(this);
							switch (this._interp.adaptivePredict(this._input, 260, this._ctx)) {
								case 1:
									{
										this.state = 1750;
										this.match(SQLiteParser.DISTINCT_);
									}
									break;
							}
							this.state = 1753;
							this.expr(0);
							this.state = 1758;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 1754;
										this.match(SQLiteParser.COMMA);
										this.state = 1755;
										this.expr(0);
									}
								}
								this.state = 1760;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
						}
						break;
					case 7:
						{
							this.state = 1761;
							this.match(SQLiteParser.STAR);
						}
						break;
					case 4:
						break;
					default:
						break;
				}
				this.state = 1764;
				this.match(SQLiteParser.CLOSE_PAR);
				this.state = 1766;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 178) {
					{
						this.state = 1765;
						this.filter_clause();
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public window_function_invocation(): Window_function_invocationContext {
		let localctx: Window_function_invocationContext = new Window_function_invocationContext(this, this._ctx, this.state);
		this.enterRule(localctx, 132, SQLiteParser.RULE_window_function_invocation);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1768;
				this.window_function();
				this.state = 1769;
				this.match(SQLiteParser.OPEN_PAR);
				this.state = 1779;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
					case 3:
					case 8:
					case 9:
					case 10:
					case 25:
					case 26:
					case 27:
					case 28:
					case 29:
					case 30:
					case 31:
					case 32:
					case 33:
					case 34:
					case 35:
					case 36:
					case 37:
					case 38:
					case 39:
					case 40:
					case 41:
					case 42:
					case 43:
					case 44:
					case 45:
					case 46:
					case 47:
					case 48:
					case 49:
					case 50:
					case 51:
					case 52:
					case 53:
					case 54:
					case 55:
					case 56:
					case 57:
					case 58:
					case 59:
					case 60:
					case 61:
					case 62:
					case 63:
					case 64:
					case 65:
					case 66:
					case 67:
					case 68:
					case 69:
					case 70:
					case 71:
					case 72:
					case 73:
					case 74:
					case 75:
					case 76:
					case 77:
					case 78:
					case 79:
					case 80:
					case 81:
					case 82:
					case 83:
					case 84:
					case 85:
					case 86:
					case 87:
					case 88:
					case 89:
					case 90:
					case 91:
					case 92:
					case 93:
					case 94:
					case 95:
					case 96:
					case 97:
					case 98:
					case 99:
					case 100:
					case 101:
					case 102:
					case 103:
					case 104:
					case 105:
					case 106:
					case 107:
					case 108:
					case 109:
					case 110:
					case 111:
					case 112:
					case 113:
					case 114:
					case 115:
					case 116:
					case 117:
					case 118:
					case 119:
					case 120:
					case 121:
					case 122:
					case 123:
					case 125:
					case 126:
					case 127:
					case 128:
					case 129:
					case 130:
					case 131:
					case 132:
					case 133:
					case 134:
					case 135:
					case 136:
					case 137:
					case 138:
					case 139:
					case 140:
					case 141:
					case 142:
					case 143:
					case 144:
					case 145:
					case 146:
					case 147:
					case 148:
					case 149:
					case 150:
					case 151:
					case 152:
					case 153:
					case 154:
					case 155:
					case 156:
					case 157:
					case 158:
					case 159:
					case 160:
					case 161:
					case 162:
					case 163:
					case 164:
					case 165:
					case 166:
					case 167:
					case 168:
					case 169:
					case 170:
					case 171:
					case 172:
					case 173:
					case 174:
					case 175:
					case 176:
					case 177:
					case 178:
					case 179:
					case 180:
					case 185:
					case 186:
					case 187:
					case 188:
					case 189:
						{
							this.state = 1770;
							this.expr(0);
							this.state = 1775;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							while (_la === 5) {
								{
									{
										this.state = 1771;
										this.match(SQLiteParser.COMMA);
										this.state = 1772;
										this.expr(0);
									}
								}
								this.state = 1777;
								this._errHandler.sync(this);
								_la = this._input.LA(1);
							}
						}
						break;
					case 7:
						{
							this.state = 1778;
							this.match(SQLiteParser.STAR);
						}
						break;
					case 4:
						break;
					default:
						break;
				}
				this.state = 1781;
				this.match(SQLiteParser.CLOSE_PAR);
				this.state = 1783;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 178) {
					{
						this.state = 1782;
						this.filter_clause();
					}
				}

				this.state = 1785;
				this.match(SQLiteParser.OVER_);
				this.state = 1788;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 267, this._ctx)) {
					case 1:
						{
							this.state = 1786;
							this.window_defn();
						}
						break;
					case 2:
						{
							this.state = 1787;
							this.window_name();
						}
						break;
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public common_table_stmt(): Common_table_stmtContext {
		let localctx: Common_table_stmtContext = new Common_table_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 134, SQLiteParser.RULE_common_table_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1790;
				this.match(SQLiteParser.WITH_);
				this.state = 1792;
				this._errHandler.sync(this);
				switch (this._interp.adaptivePredict(this._input, 268, this._ctx)) {
					case 1:
						{
							this.state = 1791;
							this.match(SQLiteParser.RECURSIVE_);
						}
						break;
				}
				this.state = 1794;
				this.common_table_expression();
				this.state = 1799;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1795;
							this.match(SQLiteParser.COMMA);
							this.state = 1796;
							this.common_table_expression();
						}
					}
					this.state = 1801;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public order_by_stmt(): Order_by_stmtContext {
		let localctx: Order_by_stmtContext = new Order_by_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 136, SQLiteParser.RULE_order_by_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1802;
				this.match(SQLiteParser.ORDER_);
				this.state = 1803;
				this.match(SQLiteParser.BY_);
				this.state = 1804;
				this.ordering_term();
				this.state = 1809;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1805;
							this.match(SQLiteParser.COMMA);
							this.state = 1806;
							this.ordering_term();
						}
					}
					this.state = 1811;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public limit_stmt(): Limit_stmtContext {
		let localctx: Limit_stmtContext = new Limit_stmtContext(this, this._ctx, this.state);
		this.enterRule(localctx, 138, SQLiteParser.RULE_limit_stmt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1812;
				this.match(SQLiteParser.LIMIT_);
				this.state = 1813;
				this.expr(0);
				this.state = 1816;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 5 || _la === 106) {
					{
						this.state = 1814;
						_la = this._input.LA(1);
						if (!(_la === 5 || _la === 106)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 1815;
						this.expr(0);
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public ordering_term(): Ordering_termContext {
		let localctx: Ordering_termContext = new Ordering_termContext(this, this._ctx, this.state);
		this.enterRule(localctx, 140, SQLiteParser.RULE_ordering_term);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1818;
				this.expr(0);
				this.state = 1821;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 45) {
					{
						this.state = 1819;
						this.match(SQLiteParser.COLLATE_);
						this.state = 1820;
						this.collation_name();
					}
				}

				this.state = 1824;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 34 || _la === 60) {
					{
						this.state = 1823;
						this.asc_desc();
					}
				}

				this.state = 1828;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 175) {
					{
						this.state = 1826;
						this.match(SQLiteParser.NULLS_);
						this.state = 1827;
						_la = this._input.LA(1);
						if (!(_la === 176 || _la === 177)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
					}
				}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public asc_desc(): Asc_descContext {
		let localctx: Asc_descContext = new Asc_descContext(this, this._ctx, this.state);
		this.enterRule(localctx, 142, SQLiteParser.RULE_asc_desc);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1830;
				_la = this._input.LA(1);
				if (!(_la === 34 || _la === 60)) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public frame_left(): Frame_leftContext {
		let localctx: Frame_leftContext = new Frame_leftContext(this, this._ctx, this.state);
		this.enterRule(localctx, 144, SQLiteParser.RULE_frame_left);
		try {
			this.state = 1842;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 275, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1832;
						this.expr(0);
						this.state = 1833;
						this.match(SQLiteParser.PRECEDING_);
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1835;
						this.expr(0);
						this.state = 1836;
						this.match(SQLiteParser.FOLLOWING_);
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1838;
						this.match(SQLiteParser.CURRENT_);
						this.state = 1839;
						this.match(SQLiteParser.ROW_);
					}
					break;
				case 4:
					this.enterOuterAlt(localctx, 4);
					{
						this.state = 1840;
						this.match(SQLiteParser.UNBOUNDED_);
						this.state = 1841;
						this.match(SQLiteParser.PRECEDING_);
					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public frame_right(): Frame_rightContext {
		let localctx: Frame_rightContext = new Frame_rightContext(this, this._ctx, this.state);
		this.enterRule(localctx, 146, SQLiteParser.RULE_frame_right);
		try {
			this.state = 1854;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 276, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1844;
						this.expr(0);
						this.state = 1845;
						this.match(SQLiteParser.PRECEDING_);
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1847;
						this.expr(0);
						this.state = 1848;
						this.match(SQLiteParser.FOLLOWING_);
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1850;
						this.match(SQLiteParser.CURRENT_);
						this.state = 1851;
						this.match(SQLiteParser.ROW_);
					}
					break;
				case 4:
					this.enterOuterAlt(localctx, 4);
					{
						this.state = 1852;
						this.match(SQLiteParser.UNBOUNDED_);
						this.state = 1853;
						this.match(SQLiteParser.FOLLOWING_);
					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public frame_single(): Frame_singleContext {
		let localctx: Frame_singleContext = new Frame_singleContext(this, this._ctx, this.state);
		this.enterRule(localctx, 148, SQLiteParser.RULE_frame_single);
		try {
			this.state = 1863;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 277, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1856;
						this.expr(0);
						this.state = 1857;
						this.match(SQLiteParser.PRECEDING_);
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1859;
						this.match(SQLiteParser.UNBOUNDED_);
						this.state = 1860;
						this.match(SQLiteParser.PRECEDING_);
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1861;
						this.match(SQLiteParser.CURRENT_);
						this.state = 1862;
						this.match(SQLiteParser.ROW_);
					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public window_function(): Window_functionContext {
		let localctx: Window_functionContext = new Window_functionContext(this, this._ctx, this.state);
		this.enterRule(localctx, 150, SQLiteParser.RULE_window_function);
		let _la: number;
		try {
			this.state = 1950;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 151:
				case 162:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1865;
						_la = this._input.LA(1);
						if (!(_la === 151 || _la === 162)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 1866;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1867;
						this.expr(0);
						this.state = 1868;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1869;
						this.match(SQLiteParser.OVER_);
						this.state = 1870;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1872;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 153) {
							{
								this.state = 1871;
								this.partition_by();
							}
						}

						this.state = 1874;
						this.order_by_expr_asc_desc();
						this.state = 1876;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 128 || _la === 154 || _la === 179) {
							{
								this.state = 1875;
								this.frame_clause();
							}
						}

						this.state = 1878;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				case 159:
				case 166:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1880;
						_la = this._input.LA(1);
						if (!(_la === 159 || _la === 166)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 1881;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1882;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1883;
						this.match(SQLiteParser.OVER_);
						this.state = 1884;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1886;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 153) {
							{
								this.state = 1885;
								this.partition_by();
							}
						}

						this.state = 1889;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 109) {
							{
								this.state = 1888;
								this.order_by_expr();
							}
						}

						this.state = 1891;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				case 160:
				case 167:
				case 168:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 1892;
						_la = this._input.LA(1);
						if (!(((((_la - 160)) & ~0x1F) === 0 && ((1 << (_la - 160)) & 385) !== 0))) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 1893;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1894;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1895;
						this.match(SQLiteParser.OVER_);
						this.state = 1896;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1898;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 153) {
							{
								this.state = 1897;
								this.partition_by();
							}
						}

						this.state = 1900;
						this.order_by_expr_asc_desc();
						this.state = 1901;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				case 161:
				case 163:
					this.enterOuterAlt(localctx, 4);
					{
						this.state = 1903;
						_la = this._input.LA(1);
						if (!(_la === 161 || _la === 163)) {
							this._errHandler.recoverInline(this);
						}
						else {
							this._errHandler.reportMatch(this);
							this.consume();
						}
						this.state = 1904;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1905;
						this.expr(0);
						this.state = 1907;
						this._errHandler.sync(this);
						switch (this._interp.adaptivePredict(this._input, 283, this._ctx)) {
							case 1:
								{
									this.state = 1906;
									this.offset();
								}
								break;
						}
						this.state = 1910;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 5) {
							{
								this.state = 1909;
								this.default_value();
							}
						}

						this.state = 1912;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1913;
						this.match(SQLiteParser.OVER_);
						this.state = 1914;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1916;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 153) {
							{
								this.state = 1915;
								this.partition_by();
							}
						}

						this.state = 1918;
						this.order_by_expr_asc_desc();
						this.state = 1919;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				case 164:
					this.enterOuterAlt(localctx, 5);
					{
						this.state = 1921;
						this.match(SQLiteParser.NTH_VALUE_);
						this.state = 1922;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1923;
						this.expr(0);
						this.state = 1924;
						this.match(SQLiteParser.COMMA);
						this.state = 1925;
						this.signed_number();
						this.state = 1926;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1927;
						this.match(SQLiteParser.OVER_);
						this.state = 1928;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1930;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 153) {
							{
								this.state = 1929;
								this.partition_by();
							}
						}

						this.state = 1932;
						this.order_by_expr_asc_desc();
						this.state = 1934;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 128 || _la === 154 || _la === 179) {
							{
								this.state = 1933;
								this.frame_clause();
							}
						}

						this.state = 1936;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				case 165:
					this.enterOuterAlt(localctx, 6);
					{
						this.state = 1938;
						this.match(SQLiteParser.NTILE_);
						this.state = 1939;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1940;
						this.expr(0);
						this.state = 1941;
						this.match(SQLiteParser.CLOSE_PAR);
						this.state = 1942;
						this.match(SQLiteParser.OVER_);
						this.state = 1943;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 1945;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						if (_la === 153) {
							{
								this.state = 1944;
								this.partition_by();
							}
						}

						this.state = 1947;
						this.order_by_expr_asc_desc();
						this.state = 1948;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				default:
					throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public offset(): OffsetContext {
		let localctx: OffsetContext = new OffsetContext(this, this._ctx, this.state);
		this.enterRule(localctx, 152, SQLiteParser.RULE_offset);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1952;
				this.match(SQLiteParser.COMMA);
				this.state = 1953;
				this.signed_number();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public default_value(): Default_valueContext {
		let localctx: Default_valueContext = new Default_valueContext(this, this._ctx, this.state);
		this.enterRule(localctx, 154, SQLiteParser.RULE_default_value);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1955;
				this.match(SQLiteParser.COMMA);
				this.state = 1956;
				this.signed_number();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public partition_by(): Partition_byContext {
		let localctx: Partition_byContext = new Partition_byContext(this, this._ctx, this.state);
		this.enterRule(localctx, 156, SQLiteParser.RULE_partition_by);
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1958;
				this.match(SQLiteParser.PARTITION_);
				this.state = 1959;
				this.match(SQLiteParser.BY_);
				this.state = 1961;
				this._errHandler.sync(this);
				_alt = 1;
				do {
					switch (_alt) {
						case 1:
							{
								{
									this.state = 1960;
									this.expr(0);
								}
							}
							break;
						default:
							throw new NoViableAltException(this);
					}
					this.state = 1963;
					this._errHandler.sync(this);
					_alt = this._interp.adaptivePredict(this._input, 290, this._ctx);
				} while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public order_by_expr(): Order_by_exprContext {
		let localctx: Order_by_exprContext = new Order_by_exprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 158, SQLiteParser.RULE_order_by_expr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1965;
				this.match(SQLiteParser.ORDER_);
				this.state = 1966;
				this.match(SQLiteParser.BY_);
				this.state = 1968;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				do {
					{
						{
							this.state = 1967;
							this.expr(0);
						}
					}
					this.state = 1970;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				} while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 4261414664) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 4294967295) !== 0) || ((((_la - 64)) & ~0x1F) === 0 && ((1 << (_la - 64)) & 4294967295) !== 0) || ((((_la - 96)) & ~0x1F) === 0 && ((1 << (_la - 96)) & 4026531839) !== 0) || ((((_la - 128)) & ~0x1F) === 0 && ((1 << (_la - 128)) & 4294967295) !== 0) || ((((_la - 160)) & ~0x1F) === 0 && ((1 << (_la - 160)) & 1042284543) !== 0));
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public order_by_expr_asc_desc(): Order_by_expr_asc_descContext {
		let localctx: Order_by_expr_asc_descContext = new Order_by_expr_asc_descContext(this, this._ctx, this.state);
		this.enterRule(localctx, 160, SQLiteParser.RULE_order_by_expr_asc_desc);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1972;
				this.match(SQLiteParser.ORDER_);
				this.state = 1973;
				this.match(SQLiteParser.BY_);
				this.state = 1974;
				this.expr_asc_desc();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public expr_asc_desc(): Expr_asc_descContext {
		let localctx: Expr_asc_descContext = new Expr_asc_descContext(this, this._ctx, this.state);
		this.enterRule(localctx, 162, SQLiteParser.RULE_expr_asc_desc);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1976;
				this.expr(0);
				this.state = 1978;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la === 34 || _la === 60) {
					{
						this.state = 1977;
						this.asc_desc();
					}
				}

				this.state = 1987;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la === 5) {
					{
						{
							this.state = 1980;
							this.match(SQLiteParser.COMMA);
							this.state = 1981;
							this.expr(0);
							this.state = 1983;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
							if (_la === 34 || _la === 60) {
								{
									this.state = 1982;
									this.asc_desc();
								}
							}

						}
					}
					this.state = 1989;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public initial_select(): Initial_selectContext {
		let localctx: Initial_selectContext = new Initial_selectContext(this, this._ctx, this.state);
		this.enterRule(localctx, 164, SQLiteParser.RULE_initial_select);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1990;
				this.select_stmt();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public recursive_select(): Recursive_selectContext {
		let localctx: Recursive_selectContext = new Recursive_selectContext(this, this._ctx, this.state);
		this.enterRule(localctx, 166, SQLiteParser.RULE_recursive_select);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1992;
				this.select_stmt();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public unary_operator(): Unary_operatorContext {
		let localctx: Unary_operatorContext = new Unary_operatorContext(this, this._ctx, this.state);
		this.enterRule(localctx, 168, SQLiteParser.RULE_unary_operator);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1994;
				_la = this._input.LA(1);
				if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1792) !== 0) || _la === 102)) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public error_message(): Error_messageContext {
		let localctx: Error_messageContext = new Error_messageContext(this, this._ctx, this.state);
		this.enterRule(localctx, 170, SQLiteParser.RULE_error_message);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 1996;
				this.match(SQLiteParser.STRING_LITERAL);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public module_argument(): Module_argumentContext {
		let localctx: Module_argumentContext = new Module_argumentContext(this, this._ctx, this.state);
		this.enterRule(localctx, 172, SQLiteParser.RULE_module_argument);
		try {
			this.state = 2000;
			this._errHandler.sync(this);
			switch (this._interp.adaptivePredict(this._input, 295, this._ctx)) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 1998;
						this.expr(0);
					}
					break;
				case 2:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 1999;
						this.column_def();
					}
					break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public column_alias(): Column_aliasContext {
		let localctx: Column_aliasContext = new Column_aliasContext(this, this._ctx, this.state);
		this.enterRule(localctx, 174, SQLiteParser.RULE_column_alias);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2002;
				_la = this._input.LA(1);
				if (!(_la === 185 || _la === 188)) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public keyword(): KeywordContext {
		let localctx: KeywordContext = new KeywordContext(this, this._ctx, this.state);
		this.enterRule(localctx, 176, SQLiteParser.RULE_keyword);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2004;
				_la = this._input.LA(1);
				if (!(((((_la - 25)) & ~0x1F) === 0 && ((1 << (_la - 25)) & 4294967295) !== 0) || ((((_la - 57)) & ~0x1F) === 0 && ((1 << (_la - 57)) & 4294967295) !== 0) || ((((_la - 89)) & ~0x1F) === 0 && ((1 << (_la - 89)) & 4294967295) !== 0) || ((((_la - 121)) & ~0x1F) === 0 && ((1 << (_la - 121)) & 4294967287) !== 0) || ((((_la - 153)) & ~0x1F) === 0 && ((1 << (_la - 153)) & 268435455) !== 0))) {
					this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
					this.consume();
				}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public name(): NameContext {
		let localctx: NameContext = new NameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 178, SQLiteParser.RULE_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2006;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public function_name(): Function_nameContext {
		let localctx: Function_nameContext = new Function_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 180, SQLiteParser.RULE_function_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2008;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public schema_name(): Schema_nameContext {
		let localctx: Schema_nameContext = new Schema_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 182, SQLiteParser.RULE_schema_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2010;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public table_name(): Table_nameContext {
		let localctx: Table_nameContext = new Table_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 184, SQLiteParser.RULE_table_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2012;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public table_or_index_name(): Table_or_index_nameContext {
		let localctx: Table_or_index_nameContext = new Table_or_index_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 186, SQLiteParser.RULE_table_or_index_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2014;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public column_name(): Column_nameContext {
		let localctx: Column_nameContext = new Column_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 188, SQLiteParser.RULE_column_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2016;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public collation_name(): Collation_nameContext {
		let localctx: Collation_nameContext = new Collation_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 190, SQLiteParser.RULE_collation_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2018;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public foreign_table(): Foreign_tableContext {
		let localctx: Foreign_tableContext = new Foreign_tableContext(this, this._ctx, this.state);
		this.enterRule(localctx, 192, SQLiteParser.RULE_foreign_table);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2020;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public index_name(): Index_nameContext {
		let localctx: Index_nameContext = new Index_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 194, SQLiteParser.RULE_index_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2022;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public trigger_name(): Trigger_nameContext {
		let localctx: Trigger_nameContext = new Trigger_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 196, SQLiteParser.RULE_trigger_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2024;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public view_name(): View_nameContext {
		let localctx: View_nameContext = new View_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 198, SQLiteParser.RULE_view_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2026;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public module_name(): Module_nameContext {
		let localctx: Module_nameContext = new Module_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 200, SQLiteParser.RULE_module_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2028;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pragma_name(): Pragma_nameContext {
		let localctx: Pragma_nameContext = new Pragma_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 202, SQLiteParser.RULE_pragma_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2030;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public savepoint_name(): Savepoint_nameContext {
		let localctx: Savepoint_nameContext = new Savepoint_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 204, SQLiteParser.RULE_savepoint_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2032;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public table_alias(): Table_aliasContext {
		let localctx: Table_aliasContext = new Table_aliasContext(this, this._ctx, this.state);
		this.enterRule(localctx, 206, SQLiteParser.RULE_table_alias);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2034;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public transaction_name(): Transaction_nameContext {
		let localctx: Transaction_nameContext = new Transaction_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 208, SQLiteParser.RULE_transaction_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2036;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public window_name(): Window_nameContext {
		let localctx: Window_nameContext = new Window_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 210, SQLiteParser.RULE_window_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2038;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public alias(): AliasContext {
		let localctx: AliasContext = new AliasContext(this, this._ctx, this.state);
		this.enterRule(localctx, 212, SQLiteParser.RULE_alias);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2040;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public filename(): FilenameContext {
		let localctx: FilenameContext = new FilenameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 214, SQLiteParser.RULE_filename);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2042;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public base_window_name(): Base_window_nameContext {
		let localctx: Base_window_nameContext = new Base_window_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 216, SQLiteParser.RULE_base_window_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2044;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public simple_func(): Simple_funcContext {
		let localctx: Simple_funcContext = new Simple_funcContext(this, this._ctx, this.state);
		this.enterRule(localctx, 218, SQLiteParser.RULE_simple_func);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2046;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public aggregate_func(): Aggregate_funcContext {
		let localctx: Aggregate_funcContext = new Aggregate_funcContext(this, this._ctx, this.state);
		this.enterRule(localctx, 220, SQLiteParser.RULE_aggregate_func);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2048;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public table_function_name(): Table_function_nameContext {
		let localctx: Table_function_nameContext = new Table_function_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 222, SQLiteParser.RULE_table_function_name);
		try {
			this.enterOuterAlt(localctx, 1);
			{
				this.state = 2050;
				this.any_name();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public any_name(): Any_nameContext {
		let localctx: Any_nameContext = new Any_nameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 224, SQLiteParser.RULE_any_name);
		try {
			this.state = 2059;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 185:
					this.enterOuterAlt(localctx, 1);
					{
						this.state = 2052;
						this.match(SQLiteParser.IDENTIFIER);
					}
					break;
				case 25:
				case 26:
				case 27:
				case 28:
				case 29:
				case 30:
				case 31:
				case 32:
				case 33:
				case 34:
				case 35:
				case 36:
				case 37:
				case 38:
				case 39:
				case 40:
				case 41:
				case 42:
				case 43:
				case 44:
				case 45:
				case 46:
				case 47:
				case 48:
				case 49:
				case 50:
				case 51:
				case 52:
				case 53:
				case 54:
				case 55:
				case 56:
				case 57:
				case 58:
				case 59:
				case 60:
				case 61:
				case 62:
				case 63:
				case 64:
				case 65:
				case 66:
				case 67:
				case 68:
				case 69:
				case 70:
				case 71:
				case 72:
				case 73:
				case 74:
				case 75:
				case 76:
				case 77:
				case 78:
				case 79:
				case 80:
				case 81:
				case 82:
				case 83:
				case 84:
				case 85:
				case 86:
				case 87:
				case 88:
				case 89:
				case 90:
				case 91:
				case 92:
				case 93:
				case 94:
				case 95:
				case 96:
				case 97:
				case 98:
				case 99:
				case 100:
				case 101:
				case 102:
				case 103:
				case 104:
				case 105:
				case 106:
				case 107:
				case 108:
				case 109:
				case 110:
				case 111:
				case 112:
				case 113:
				case 114:
				case 115:
				case 116:
				case 117:
				case 118:
				case 119:
				case 120:
				case 121:
				case 122:
				case 123:
				case 125:
				case 126:
				case 127:
				case 128:
				case 129:
				case 130:
				case 131:
				case 132:
				case 133:
				case 134:
				case 135:
				case 136:
				case 137:
				case 138:
				case 139:
				case 140:
				case 141:
				case 142:
				case 143:
				case 144:
				case 145:
				case 146:
				case 147:
				case 148:
				case 149:
				case 150:
				case 151:
				case 152:
				case 153:
				case 154:
				case 155:
				case 156:
				case 157:
				case 158:
				case 159:
				case 160:
				case 161:
				case 162:
				case 163:
				case 164:
				case 165:
				case 166:
				case 167:
				case 168:
				case 169:
				case 170:
				case 171:
				case 172:
				case 173:
				case 174:
				case 175:
				case 176:
				case 177:
				case 178:
				case 179:
				case 180:
					this.enterOuterAlt(localctx, 2);
					{
						this.state = 2053;
						this.keyword();
					}
					break;
				case 188:
					this.enterOuterAlt(localctx, 3);
					{
						this.state = 2054;
						this.match(SQLiteParser.STRING_LITERAL);
					}
					break;
				case 3:
					this.enterOuterAlt(localctx, 4);
					{
						this.state = 2055;
						this.match(SQLiteParser.OPEN_PAR);
						this.state = 2056;
						this.any_name();
						this.state = 2057;
						this.match(SQLiteParser.CLOSE_PAR);
					}
					break;
				default:
					throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}

	public sempred(localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
		switch (ruleIndex) {
			case 32:
				return this.expr_sempred(localctx as ExprContext, predIndex);
		}
		return true;
	}
	private expr_sempred(localctx: ExprContext, predIndex: number): boolean {
		switch (predIndex) {
			case 0:
				return this.precpred(this._ctx, 20);
			case 1:
				return this.precpred(this._ctx, 19);
			case 2:
				return this.precpred(this._ctx, 18);
			case 3:
				return this.precpred(this._ctx, 17);
			case 4:
				return this.precpred(this._ctx, 16);
			case 5:
				return this.precpred(this._ctx, 15);
			case 6:
				return this.precpred(this._ctx, 14);
			case 7:
				return this.precpred(this._ctx, 13);
			case 8:
				return this.precpred(this._ctx, 6);
			case 9:
				return this.precpred(this._ctx, 5);
			case 10:
				return this.precpred(this._ctx, 9);
			case 11:
				return this.precpred(this._ctx, 8);
			case 12:
				return this.precpred(this._ctx, 7);
			case 13:
				return this.precpred(this._ctx, 4);
		}
		return true;
	}

	public static readonly _serializedATN: number[] = [4, 1, 193, 2062, 2, 0, 7, 0,
		2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9,
		2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2,
		17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24,
		7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7,
		31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38,
		2, 39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2,
		46, 7, 46, 2, 47, 7, 47, 2, 48, 7, 48, 2, 49, 7, 49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 2, 53,
		7, 53, 2, 54, 7, 54, 2, 55, 7, 55, 2, 56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7,
		60, 2, 61, 7, 61, 2, 62, 7, 62, 2, 63, 7, 63, 2, 64, 7, 64, 2, 65, 7, 65, 2, 66, 7, 66, 2, 67, 7, 67,
		2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2, 72, 7, 72, 2, 73, 7, 73, 2, 74, 7, 74, 2,
		75, 7, 75, 2, 76, 7, 76, 2, 77, 7, 77, 2, 78, 7, 78, 2, 79, 7, 79, 2, 80, 7, 80, 2, 81, 7, 81, 2, 82,
		7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87, 2, 88, 7, 88, 2, 89, 7,
		89, 2, 90, 7, 90, 2, 91, 7, 91, 2, 92, 7, 92, 2, 93, 7, 93, 2, 94, 7, 94, 2, 95, 7, 95, 2, 96, 7, 96,
		2, 97, 7, 97, 2, 98, 7, 98, 2, 99, 7, 99, 2, 100, 7, 100, 2, 101, 7, 101, 2, 102, 7, 102, 2, 103,
		7, 103, 2, 104, 7, 104, 2, 105, 7, 105, 2, 106, 7, 106, 2, 107, 7, 107, 2, 108, 7, 108, 2, 109,
		7, 109, 2, 110, 7, 110, 2, 111, 7, 111, 2, 112, 7, 112, 1, 0, 5, 0, 228, 8, 0, 10, 0, 12, 0, 231,
		9, 0, 1, 0, 1, 0, 1, 1, 5, 1, 236, 8, 1, 10, 1, 12, 1, 239, 9, 1, 1, 1, 1, 1, 4, 1, 243, 8, 1, 11, 1,
		12, 1, 244, 1, 1, 5, 1, 248, 8, 1, 10, 1, 12, 1, 251, 9, 1, 1, 1, 5, 1, 254, 8, 1, 10, 1, 12, 1, 257,
		9, 1, 1, 2, 1, 2, 1, 2, 3, 2, 262, 8, 2, 3, 2, 264, 8, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2,
		1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 290,
		8, 2, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 3, 3, 297, 8, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 3, 3, 304, 8, 3, 1, 3,
		1, 3, 1, 3, 1, 3, 3, 3, 310, 8, 3, 1, 3, 1, 3, 3, 3, 314, 8, 3, 1, 3, 1, 3, 1, 3, 3, 3, 319, 8, 3, 1, 3,
		3, 3, 322, 8, 3, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 3, 4, 329, 8, 4, 1, 4, 3, 4, 332, 8, 4, 1, 5, 1, 5, 3, 5,
		336, 8, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 3, 6, 344, 8, 6, 1, 6, 1, 6, 3, 6, 348, 8, 6, 3, 6, 350,
		8, 6, 1, 7, 1, 7, 3, 7, 354, 8, 7, 1, 8, 1, 8, 3, 8, 358, 8, 8, 1, 8, 1, 8, 3, 8, 362, 8, 8, 1, 8, 3, 8,
		365, 8, 8, 1, 9, 1, 9, 1, 9, 1, 10, 1, 10, 3, 10, 372, 8, 10, 1, 10, 1, 10, 1, 11, 1, 11, 3, 11, 378,
		8, 11, 1, 11, 1, 11, 1, 11, 1, 11, 3, 11, 384, 8, 11, 1, 11, 1, 11, 1, 11, 3, 11, 389, 8, 11, 1, 11,
		1, 11, 1, 11, 1, 11, 1, 11, 1, 11, 1, 11, 5, 11, 398, 8, 11, 10, 11, 12, 11, 401, 9, 11, 1, 11, 1,
		11, 1, 11, 3, 11, 406, 8, 11, 1, 12, 1, 12, 3, 12, 410, 8, 12, 1, 12, 1, 12, 3, 12, 414, 8, 12, 1,
		12, 3, 12, 417, 8, 12, 1, 13, 1, 13, 3, 13, 421, 8, 13, 1, 13, 1, 13, 1, 13, 1, 13, 3, 13, 427, 8,
		13, 1, 13, 1, 13, 1, 13, 3, 13, 432, 8, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 5, 13, 439, 8, 13,
		10, 13, 12, 13, 442, 9, 13, 1, 13, 1, 13, 5, 13, 446, 8, 13, 10, 13, 12, 13, 449, 9, 13, 1, 13,
		1, 13, 1, 13, 3, 13, 454, 8, 13, 1, 13, 1, 13, 3, 13, 458, 8, 13, 1, 14, 1, 14, 3, 14, 462, 8, 14,
		1, 14, 5, 14, 465, 8, 14, 10, 14, 12, 14, 468, 9, 14, 1, 15, 4, 15, 471, 8, 15, 11, 15, 12, 15,
		472, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 3, 15, 485, 8, 15, 1, 16,
		1, 16, 3, 16, 489, 8, 16, 1, 16, 1, 16, 1, 16, 3, 16, 494, 8, 16, 1, 16, 3, 16, 497, 8, 16, 1, 16,
		3, 16, 500, 8, 16, 1, 16, 3, 16, 503, 8, 16, 1, 16, 1, 16, 3, 16, 507, 8, 16, 1, 16, 3, 16, 510,
		8, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3, 16, 524,
		8, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3, 16, 531, 8, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3,
		16, 538, 8, 16, 3, 16, 540, 8, 16, 1, 17, 3, 17, 543, 8, 17, 1, 17, 1, 17, 1, 18, 1, 18, 3, 18, 549,
		8, 18, 1, 18, 1, 18, 1, 18, 3, 18, 554, 8, 18, 1, 18, 1, 18, 1, 18, 1, 18, 5, 18, 560, 8, 18, 10,
		18, 12, 18, 563, 9, 18, 1, 18, 1, 18, 3, 18, 567, 8, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18,
		1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 5, 18, 580, 8, 18, 10, 18, 12, 18, 583, 9, 18, 1, 18, 1, 18, 1,
		18, 3, 18, 588, 8, 18, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 5, 19, 596, 8, 19, 10, 19, 12, 19,
		599, 9, 19, 1, 19, 1, 19, 3, 19, 603, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19,
		3, 19, 613, 8, 19, 1, 19, 1, 19, 5, 19, 617, 8, 19, 10, 19, 12, 19, 620, 9, 19, 1, 19, 3, 19, 623,
		8, 19, 1, 19, 1, 19, 1, 19, 3, 19, 628, 8, 19, 3, 19, 630, 8, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 21,
		1, 21, 3, 21, 638, 8, 21, 1, 21, 1, 21, 1, 21, 1, 21, 3, 21, 644, 8, 21, 1, 21, 1, 21, 1, 21, 3, 21,
		649, 8, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 3, 21, 656, 8, 21, 1, 21, 1, 21, 1, 21, 1, 21, 1, 21,
		1, 21, 1, 21, 5, 21, 665, 8, 21, 10, 21, 12, 21, 668, 9, 21, 3, 21, 670, 8, 21, 3, 21, 672, 8, 21,
		1, 21, 1, 21, 1, 21, 1, 21, 1, 21, 3, 21, 679, 8, 21, 1, 21, 1, 21, 3, 21, 683, 8, 21, 1, 21, 1, 21,
		1, 21, 1, 21, 1, 21, 3, 21, 690, 8, 21, 1, 21, 1, 21, 4, 21, 694, 8, 21, 11, 21, 12, 21, 695, 1,
		21, 1, 21, 1, 22, 1, 22, 3, 22, 702, 8, 22, 1, 22, 1, 22, 1, 22, 1, 22, 3, 22, 708, 8, 22, 1, 22,
		1, 22, 1, 22, 3, 22, 713, 8, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 5, 22, 720, 8, 22, 10, 22, 12,
		22, 723, 9, 22, 1, 22, 1, 22, 3, 22, 727, 8, 22, 1, 22, 1, 22, 1, 22, 1, 23, 1, 23, 1, 23, 1, 23,
		1, 23, 1, 23, 3, 23, 738, 8, 23, 1, 23, 1, 23, 1, 23, 3, 23, 743, 8, 23, 1, 23, 1, 23, 1, 23, 1, 23,
		1, 23, 1, 23, 1, 23, 5, 23, 752, 8, 23, 10, 23, 12, 23, 755, 9, 23, 1, 23, 1, 23, 3, 23, 759, 8,
		23, 1, 24, 1, 24, 3, 24, 763, 8, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24,
		1, 24, 1, 24, 1, 24, 5, 24, 777, 8, 24, 10, 24, 12, 24, 780, 9, 24, 1, 25, 1, 25, 1, 25, 1, 25, 1,
		25, 5, 25, 787, 8, 25, 10, 25, 12, 25, 790, 9, 25, 1, 25, 1, 25, 3, 25, 794, 8, 25, 1, 26, 1, 26,
		1, 26, 1, 26, 1, 26, 1, 26, 3, 26, 802, 8, 26, 1, 26, 1, 26, 1, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1,
		27, 5, 27, 812, 8, 27, 10, 27, 12, 27, 815, 9, 27, 1, 27, 1, 27, 3, 27, 819, 8, 27, 1, 27, 1, 27,
		1, 27, 1, 27, 1, 27, 1, 28, 3, 28, 827, 8, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 3, 28, 834, 8, 28,
		1, 28, 3, 28, 837, 8, 28, 1, 29, 3, 29, 840, 8, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 3, 29, 847,
		8, 29, 1, 29, 3, 29, 850, 8, 29, 1, 29, 3, 29, 853, 8, 29, 1, 29, 3, 29, 856, 8, 29, 1, 30, 1, 30,
		3, 30, 860, 8, 30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1, 31, 3, 31, 868, 8, 31, 1, 31, 1, 31, 1, 31,
		3, 31, 873, 8, 31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 883, 8, 32, 1, 32,
		1, 32, 1, 32, 3, 32, 888, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 897, 8, 32,
		1, 32, 1, 32, 1, 32, 5, 32, 902, 8, 32, 10, 32, 12, 32, 905, 9, 32, 1, 32, 3, 32, 908, 8, 32, 1,
		32, 1, 32, 3, 32, 912, 8, 32, 1, 32, 3, 32, 915, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 5, 32, 921, 8,
		32, 10, 32, 12, 32, 924, 9, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1,
		32, 3, 32, 936, 8, 32, 1, 32, 3, 32, 939, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32,
		947, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 4, 32, 954, 8, 32, 11, 32, 12, 32, 955, 1, 32, 1,
		32, 3, 32, 960, 8, 32, 1, 32, 1, 32, 1, 32, 3, 32, 965, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32,
		1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1,
		32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 992, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32,
		1, 32, 3, 32, 1001, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3,
		32, 1013, 8, 32, 1, 32, 1, 32, 1, 32, 3, 32, 1018, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32,
		1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 1030, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 1036, 8, 32, 1,
		32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 1043, 8, 32, 1, 32, 1, 32, 3, 32, 1047, 8, 32, 1, 32, 1, 32,
		1, 32, 1, 32, 1, 32, 1, 32, 5, 32, 1055, 8, 32, 10, 32, 12, 32, 1058, 9, 32, 3, 32, 1060, 8, 32,
		1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 1066, 8, 32, 1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 1072, 8, 32, 1,
		32, 1, 32, 1, 32, 1, 32, 1, 32, 5, 32, 1079, 8, 32, 10, 32, 12, 32, 1082, 9, 32, 3, 32, 1084, 8,
		32, 1, 32, 1, 32, 3, 32, 1088, 8, 32, 5, 32, 1090, 8, 32, 10, 32, 12, 32, 1093, 9, 32, 1, 33, 1,
		33, 1, 33, 1, 33, 1, 33, 1, 33, 3, 33, 1101, 8, 33, 1, 33, 1, 33, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35,
		1, 35, 5, 35, 1111, 8, 35, 10, 35, 12, 35, 1114, 9, 35, 1, 35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 36,
		5, 36, 1122, 8, 36, 10, 36, 12, 36, 1125, 9, 36, 1, 37, 3, 37, 1128, 8, 37, 1, 37, 1, 37, 1, 37,
		1, 37, 1, 37, 3, 37, 1135, 8, 37, 1, 37, 1, 37, 1, 37, 1, 37, 3, 37, 1141, 8, 37, 1, 37, 1, 37, 1,
		37, 3, 37, 1146, 8, 37, 1, 37, 1, 37, 1, 37, 1, 37, 5, 37, 1152, 8, 37, 10, 37, 12, 37, 1155, 9,
		37, 1, 37, 1, 37, 3, 37, 1159, 8, 37, 1, 37, 1, 37, 3, 37, 1163, 8, 37, 1, 37, 3, 37, 1166, 8, 37,
		1, 37, 1, 37, 3, 37, 1170, 8, 37, 1, 37, 3, 37, 1173, 8, 37, 1, 38, 1, 38, 1, 38, 1, 38, 5, 38, 1179,
		8, 38, 10, 38, 12, 38, 1182, 9, 38, 1, 39, 1, 39, 1, 39, 1, 39, 1, 39, 1, 39, 5, 39, 1190, 8, 39,
		10, 39, 12, 39, 1193, 9, 39, 1, 39, 1, 39, 1, 39, 3, 39, 1198, 8, 39, 3, 39, 1200, 8, 39, 1, 39,
		1, 39, 1, 39, 1, 39, 1, 39, 1, 39, 3, 39, 1208, 8, 39, 1, 39, 1, 39, 1, 39, 1, 39, 1, 39, 3, 39, 1215,
		8, 39, 1, 39, 1, 39, 1, 39, 5, 39, 1220, 8, 39, 10, 39, 12, 39, 1223, 9, 39, 1, 39, 1, 39, 3, 39,
		1227, 8, 39, 3, 39, 1229, 8, 39, 1, 40, 1, 40, 1, 40, 1, 40, 3, 40, 1235, 8, 40, 1, 40, 1, 40, 1,
		40, 1, 40, 1, 40, 1, 40, 1, 40, 3, 40, 1244, 8, 40, 1, 41, 1, 41, 1, 41, 3, 41, 1249, 8, 41, 1, 42,
		1, 42, 1, 42, 1, 42, 1, 42, 3, 42, 1256, 8, 42, 1, 42, 1, 42, 3, 42, 1260, 8, 42, 3, 42, 1262, 8,
		42, 1, 43, 3, 43, 1265, 8, 43, 1, 43, 1, 43, 1, 43, 1, 43, 5, 43, 1271, 8, 43, 10, 43, 12, 43, 1274,
		9, 43, 1, 43, 3, 43, 1277, 8, 43, 1, 43, 3, 43, 1280, 8, 43, 1, 44, 1, 44, 1, 44, 1, 44, 3, 44, 1286,
		8, 44, 5, 44, 1288, 8, 44, 10, 44, 12, 44, 1291, 9, 44, 1, 45, 1, 45, 3, 45, 1295, 8, 45, 1, 45,
		1, 45, 1, 45, 5, 45, 1300, 8, 45, 10, 45, 12, 45, 1303, 9, 45, 1, 45, 1, 45, 1, 45, 1, 45, 5, 45,
		1309, 8, 45, 10, 45, 12, 45, 1312, 9, 45, 1, 45, 3, 45, 1315, 8, 45, 3, 45, 1317, 8, 45, 1, 45,
		1, 45, 3, 45, 1321, 8, 45, 1, 45, 1, 45, 1, 45, 1, 45, 1, 45, 5, 45, 1328, 8, 45, 10, 45, 12, 45,
		1331, 9, 45, 1, 45, 1, 45, 3, 45, 1335, 8, 45, 3, 45, 1337, 8, 45, 1, 45, 1, 45, 1, 45, 1, 45, 1,
		45, 1, 45, 1, 45, 1, 45, 1, 45, 5, 45, 1348, 8, 45, 10, 45, 12, 45, 1351, 9, 45, 3, 45, 1353, 8,
		45, 1, 45, 3, 45, 1356, 8, 45, 1, 46, 1, 46, 1, 47, 3, 47, 1361, 8, 47, 1, 47, 1, 47, 3, 47, 1365,
		8, 47, 1, 47, 3, 47, 1368, 8, 47, 1, 48, 3, 48, 1371, 8, 48, 1, 48, 1, 48, 1, 48, 3, 48, 1376, 8,
		48, 1, 48, 1, 48, 3, 48, 1380, 8, 48, 1, 48, 4, 48, 1383, 8, 48, 11, 48, 12, 48, 1384, 1, 48, 3,
		48, 1388, 8, 48, 1, 48, 3, 48, 1391, 8, 48, 1, 49, 1, 49, 1, 49, 3, 49, 1396, 8, 49, 1, 49, 1, 49,
		3, 49, 1400, 8, 49, 1, 49, 3, 49, 1403, 8, 49, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 3, 49, 1410, 8,
		49, 1, 49, 1, 49, 1, 49, 3, 49, 1415, 8, 49, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 5, 49, 1422, 8, 49,
		10, 49, 12, 49, 1425, 9, 49, 1, 49, 1, 49, 3, 49, 1429, 8, 49, 1, 49, 3, 49, 1432, 8, 49, 1, 49,
		1, 49, 1, 49, 1, 49, 5, 49, 1438, 8, 49, 10, 49, 12, 49, 1441, 9, 49, 1, 49, 3, 49, 1444, 8, 49,
		1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 3, 49, 1452, 8, 49, 1, 49, 3, 49, 1455, 8, 49, 3, 49, 1457,
		8, 49, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 3, 50, 1466, 8, 50, 1, 50, 3, 50, 1469, 8,
		50, 3, 50, 1471, 8, 50, 1, 51, 1, 51, 3, 51, 1475, 8, 51, 1, 51, 1, 51, 3, 51, 1479, 8, 51, 1, 51,
		1, 51, 3, 51, 1483, 8, 51, 1, 51, 3, 51, 1486, 8, 51, 1, 52, 1, 52, 1, 52, 1, 52, 1, 52, 1, 52, 1,
		52, 5, 52, 1495, 8, 52, 10, 52, 12, 52, 1498, 9, 52, 1, 52, 1, 52, 3, 52, 1502, 8, 52, 1, 53, 1,
		53, 3, 53, 1506, 8, 53, 1, 53, 1, 53, 3, 53, 1510, 8, 53, 1, 54, 3, 54, 1513, 8, 54, 1, 54, 1, 54,
		1, 54, 3, 54, 1518, 8, 54, 1, 54, 1, 54, 1, 54, 1, 54, 3, 54, 1524, 8, 54, 1, 54, 1, 54, 1, 54, 1,
		54, 1, 54, 3, 54, 1531, 8, 54, 1, 54, 1, 54, 1, 54, 5, 54, 1536, 8, 54, 10, 54, 12, 54, 1539, 9,
		54, 1, 54, 1, 54, 1, 54, 1, 54, 5, 54, 1545, 8, 54, 10, 54, 12, 54, 1548, 9, 54, 1, 54, 3, 54, 1551,
		8, 54, 3, 54, 1553, 8, 54, 1, 54, 1, 54, 3, 54, 1557, 8, 54, 1, 54, 3, 54, 1560, 8, 54, 1, 55, 1,
		55, 1, 55, 1, 55, 5, 55, 1566, 8, 55, 10, 55, 12, 55, 1569, 9, 55, 1, 55, 1, 55, 1, 56, 3, 56, 1574,
		8, 56, 1, 56, 1, 56, 1, 56, 3, 56, 1579, 8, 56, 1, 56, 1, 56, 1, 56, 1, 56, 3, 56, 1585, 8, 56, 1,
		56, 1, 56, 1, 56, 1, 56, 1, 56, 3, 56, 1592, 8, 56, 1, 56, 1, 56, 1, 56, 5, 56, 1597, 8, 56, 10,
		56, 12, 56, 1600, 9, 56, 1, 56, 1, 56, 3, 56, 1604, 8, 56, 1, 56, 3, 56, 1607, 8, 56, 1, 56, 3,
		56, 1610, 8, 56, 1, 56, 3, 56, 1613, 8, 56, 1, 57, 1, 57, 1, 57, 3, 57, 1618, 8, 57, 1, 57, 1, 57,
		1, 57, 3, 57, 1623, 8, 57, 1, 57, 1, 57, 1, 57, 1, 57, 1, 57, 3, 57, 1630, 8, 57, 1, 58, 1, 58, 3,
		58, 1634, 8, 58, 1, 58, 1, 58, 3, 58, 1638, 8, 58, 1, 59, 1, 59, 1, 59, 1, 59, 1, 59, 1, 59, 1, 60,
		1, 60, 3, 60, 1648, 8, 60, 1, 60, 1, 60, 1, 60, 1, 60, 1, 60, 5, 60, 1655, 8, 60, 10, 60, 12, 60,
		1658, 9, 60, 3, 60, 1660, 8, 60, 1, 60, 1, 60, 1, 60, 1, 60, 1, 60, 5, 60, 1667, 8, 60, 10, 60,
		12, 60, 1670, 9, 60, 1, 60, 3, 60, 1673, 8, 60, 1, 60, 1, 60, 1, 61, 1, 61, 1, 61, 1, 61, 3, 61,
		1681, 8, 61, 1, 61, 1, 61, 1, 61, 1, 61, 1, 61, 5, 61, 1688, 8, 61, 10, 61, 12, 61, 1691, 9, 61,
		3, 61, 1693, 8, 61, 1, 61, 1, 61, 1, 61, 1, 61, 1, 61, 5, 61, 1700, 8, 61, 10, 61, 12, 61, 1703,
		9, 61, 3, 61, 1705, 8, 61, 1, 61, 3, 61, 1708, 8, 61, 1, 61, 3, 61, 1711, 8, 61, 1, 62, 1, 62, 1,
		62, 1, 62, 1, 62, 1, 62, 1, 62, 1, 62, 3, 62, 1721, 8, 62, 3, 62, 1723, 8, 62, 1, 63, 1, 63, 1, 63,
		1, 63, 1, 63, 1, 63, 1, 63, 3, 63, 1732, 8, 63, 1, 64, 1, 64, 1, 64, 1, 64, 1, 64, 5, 64, 1739, 8,
		64, 10, 64, 12, 64, 1742, 9, 64, 1, 64, 3, 64, 1745, 8, 64, 1, 64, 1, 64, 1, 65, 1, 65, 1, 65, 3,
		65, 1752, 8, 65, 1, 65, 1, 65, 1, 65, 5, 65, 1757, 8, 65, 10, 65, 12, 65, 1760, 9, 65, 1, 65, 3,
		65, 1763, 8, 65, 1, 65, 1, 65, 3, 65, 1767, 8, 65, 1, 66, 1, 66, 1, 66, 1, 66, 1, 66, 5, 66, 1774,
		8, 66, 10, 66, 12, 66, 1777, 9, 66, 1, 66, 3, 66, 1780, 8, 66, 1, 66, 1, 66, 3, 66, 1784, 8, 66,
		1, 66, 1, 66, 1, 66, 3, 66, 1789, 8, 66, 1, 67, 1, 67, 3, 67, 1793, 8, 67, 1, 67, 1, 67, 1, 67, 5,
		67, 1798, 8, 67, 10, 67, 12, 67, 1801, 9, 67, 1, 68, 1, 68, 1, 68, 1, 68, 1, 68, 5, 68, 1808, 8,
		68, 10, 68, 12, 68, 1811, 9, 68, 1, 69, 1, 69, 1, 69, 1, 69, 3, 69, 1817, 8, 69, 1, 70, 1, 70, 1,
		70, 3, 70, 1822, 8, 70, 1, 70, 3, 70, 1825, 8, 70, 1, 70, 1, 70, 3, 70, 1829, 8, 70, 1, 71, 1, 71,
		1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 3, 72, 1843, 8, 72, 1, 73, 1,
		73, 1, 73, 1, 73, 1, 73, 1, 73, 1, 73, 1, 73, 1, 73, 1, 73, 3, 73, 1855, 8, 73, 1, 74, 1, 74, 1, 74,
		1, 74, 1, 74, 1, 74, 1, 74, 3, 74, 1864, 8, 74, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 3,
		75, 1873, 8, 75, 1, 75, 1, 75, 3, 75, 1877, 8, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75,
		1, 75, 3, 75, 1887, 8, 75, 1, 75, 3, 75, 1890, 8, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1,
		75, 3, 75, 1899, 8, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 3, 75, 1908, 8, 75, 1, 75,
		3, 75, 1911, 8, 75, 1, 75, 1, 75, 1, 75, 1, 75, 3, 75, 1917, 8, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1,
		75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 3, 75, 1931, 8, 75, 1, 75, 1, 75, 3, 75, 1935,
		8, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 3, 75, 1946, 8, 75, 1, 75, 1,
		75, 1, 75, 3, 75, 1951, 8, 75, 1, 76, 1, 76, 1, 76, 1, 77, 1, 77, 1, 77, 1, 78, 1, 78, 1, 78, 4, 78,
		1962, 8, 78, 11, 78, 12, 78, 1963, 1, 79, 1, 79, 1, 79, 4, 79, 1969, 8, 79, 11, 79, 12, 79, 1970,
		1, 80, 1, 80, 1, 80, 1, 80, 1, 81, 1, 81, 3, 81, 1979, 8, 81, 1, 81, 1, 81, 1, 81, 3, 81, 1984, 8,
		81, 5, 81, 1986, 8, 81, 10, 81, 12, 81, 1989, 9, 81, 1, 82, 1, 82, 1, 83, 1, 83, 1, 84, 1, 84, 1,
		85, 1, 85, 1, 86, 1, 86, 3, 86, 2001, 8, 86, 1, 87, 1, 87, 1, 88, 1, 88, 1, 89, 1, 89, 1, 90, 1, 90,
		1, 91, 1, 91, 1, 92, 1, 92, 1, 93, 1, 93, 1, 94, 1, 94, 1, 95, 1, 95, 1, 96, 1, 96, 1, 97, 1, 97, 1,
		98, 1, 98, 1, 99, 1, 99, 1, 100, 1, 100, 1, 101, 1, 101, 1, 102, 1, 102, 1, 103, 1, 103, 1, 104,
		1, 104, 1, 105, 1, 105, 1, 106, 1, 106, 1, 107, 1, 107, 1, 108, 1, 108, 1, 109, 1, 109, 1, 110,
		1, 110, 1, 111, 1, 111, 1, 112, 1, 112, 1, 112, 1, 112, 1, 112, 1, 112, 1, 112, 3, 112, 2060,
		8, 112, 1, 112, 2, 440, 472, 1, 64, 113, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28,
		30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76,
		78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
		120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154,
		156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190,
		192, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 222, 224, 0, 29,
		3, 0, 58, 58, 69, 69, 82, 82, 2, 0, 47, 47, 66, 66, 1, 0, 133, 134, 2, 0, 146, 146, 171, 171, 1,
		0, 8, 9, 2, 0, 59, 59, 141, 141, 2, 0, 56, 56, 104, 104, 2, 0, 58, 58, 82, 82, 5, 0, 25, 25, 72,
		72, 81, 81, 122, 122, 126, 126, 4, 0, 84, 84, 132, 132, 138, 138, 145, 145, 2, 0, 7, 7, 12, 13,
		1, 0, 14, 17, 1, 0, 18, 21, 4, 0, 77, 77, 97, 97, 99, 99, 118, 118, 3, 0, 25, 25, 72, 72, 126, 126,
		5, 0, 52, 54, 104, 104, 172, 173, 186, 186, 188, 189, 2, 0, 29, 29, 62, 62, 3, 0, 76, 76, 96,
		96, 125, 125, 3, 0, 128, 128, 154, 154, 179, 179, 2, 0, 5, 5, 106, 106, 1, 0, 176, 177, 2, 0,
		34, 34, 60, 60, 2, 0, 151, 151, 162, 162, 2, 0, 159, 159, 166, 166, 2, 0, 160, 160, 167, 168,
		2, 0, 161, 161, 163, 163, 2, 0, 8, 10, 102, 102, 2, 0, 185, 185, 188, 188, 2, 0, 25, 123, 125,
		180, 2346, 0, 229, 1, 0, 0, 0, 2, 237, 1, 0, 0, 0, 4, 263, 1, 0, 0, 0, 6, 291, 1, 0, 0, 0, 8, 323,
		1, 0, 0, 0, 10, 333, 1, 0, 0, 0, 12, 341, 1, 0, 0, 0, 14, 351, 1, 0, 0, 0, 16, 355, 1, 0, 0, 0, 18,
		366, 1, 0, 0, 0, 20, 369, 1, 0, 0, 0, 22, 375, 1, 0, 0, 0, 24, 409, 1, 0, 0, 0, 26, 418, 1, 0, 0, 0,
		28, 459, 1, 0, 0, 0, 30, 470, 1, 0, 0, 0, 32, 488, 1, 0, 0, 0, 34, 542, 1, 0, 0, 0, 36, 548, 1, 0,
		0, 0, 38, 589, 1, 0, 0, 0, 40, 631, 1, 0, 0, 0, 42, 635, 1, 0, 0, 0, 44, 699, 1, 0, 0, 0, 46, 731,
		1, 0, 0, 0, 48, 760, 1, 0, 0, 0, 50, 781, 1, 0, 0, 0, 52, 795, 1, 0, 0, 0, 54, 806, 1, 0, 0, 0, 56,
		826, 1, 0, 0, 0, 58, 839, 1, 0, 0, 0, 60, 857, 1, 0, 0, 0, 62, 863, 1, 0, 0, 0, 64, 964, 1, 0, 0, 0,
		66, 1094, 1, 0, 0, 0, 68, 1104, 1, 0, 0, 0, 70, 1106, 1, 0, 0, 0, 72, 1117, 1, 0, 0, 0, 74, 1127,
		1, 0, 0, 0, 76, 1174, 1, 0, 0, 0, 78, 1183, 1, 0, 0, 0, 80, 1230, 1, 0, 0, 0, 82, 1248, 1, 0, 0, 0,
		84, 1250, 1, 0, 0, 0, 86, 1264, 1, 0, 0, 0, 88, 1281, 1, 0, 0, 0, 90, 1355, 1, 0, 0, 0, 92, 1357,
		1, 0, 0, 0, 94, 1360, 1, 0, 0, 0, 96, 1370, 1, 0, 0, 0, 98, 1456, 1, 0, 0, 0, 100, 1470, 1, 0, 0,
		0, 102, 1485, 1, 0, 0, 0, 104, 1501, 1, 0, 0, 0, 106, 1509, 1, 0, 0, 0, 108, 1512, 1, 0, 0, 0, 110,
		1561, 1, 0, 0, 0, 112, 1573, 1, 0, 0, 0, 114, 1617, 1, 0, 0, 0, 116, 1631, 1, 0, 0, 0, 118, 1639,
		1, 0, 0, 0, 120, 1645, 1, 0, 0, 0, 122, 1676, 1, 0, 0, 0, 124, 1712, 1, 0, 0, 0, 126, 1724, 1, 0,
		0, 0, 128, 1733, 1, 0, 0, 0, 130, 1748, 1, 0, 0, 0, 132, 1768, 1, 0, 0, 0, 134, 1790, 1, 0, 0, 0,
		136, 1802, 1, 0, 0, 0, 138, 1812, 1, 0, 0, 0, 140, 1818, 1, 0, 0, 0, 142, 1830, 1, 0, 0, 0, 144,
		1842, 1, 0, 0, 0, 146, 1854, 1, 0, 0, 0, 148, 1863, 1, 0, 0, 0, 150, 1950, 1, 0, 0, 0, 152, 1952,
		1, 0, 0, 0, 154, 1955, 1, 0, 0, 0, 156, 1958, 1, 0, 0, 0, 158, 1965, 1, 0, 0, 0, 160, 1972, 1, 0,
		0, 0, 162, 1976, 1, 0, 0, 0, 164, 1990, 1, 0, 0, 0, 166, 1992, 1, 0, 0, 0, 168, 1994, 1, 0, 0, 0,
		170, 1996, 1, 0, 0, 0, 172, 2000, 1, 0, 0, 0, 174, 2002, 1, 0, 0, 0, 176, 2004, 1, 0, 0, 0, 178,
		2006, 1, 0, 0, 0, 180, 2008, 1, 0, 0, 0, 182, 2010, 1, 0, 0, 0, 184, 2012, 1, 0, 0, 0, 186, 2014,
		1, 0, 0, 0, 188, 2016, 1, 0, 0, 0, 190, 2018, 1, 0, 0, 0, 192, 2020, 1, 0, 0, 0, 194, 2022, 1, 0,
		0, 0, 196, 2024, 1, 0, 0, 0, 198, 2026, 1, 0, 0, 0, 200, 2028, 1, 0, 0, 0, 202, 2030, 1, 0, 0, 0,
		204, 2032, 1, 0, 0, 0, 206, 2034, 1, 0, 0, 0, 208, 2036, 1, 0, 0, 0, 210, 2038, 1, 0, 0, 0, 212,
		2040, 1, 0, 0, 0, 214, 2042, 1, 0, 0, 0, 216, 2044, 1, 0, 0, 0, 218, 2046, 1, 0, 0, 0, 220, 2048,
		1, 0, 0, 0, 222, 2050, 1, 0, 0, 0, 224, 2059, 1, 0, 0, 0, 226, 228, 3, 2, 1, 0, 227, 226, 1, 0, 0,
		0, 228, 231, 1, 0, 0, 0, 229, 227, 1, 0, 0, 0, 229, 230, 1, 0, 0, 0, 230, 232, 1, 0, 0, 0, 231, 229,
		1, 0, 0, 0, 232, 233, 5, 0, 0, 1, 233, 1, 1, 0, 0, 0, 234, 236, 5, 1, 0, 0, 235, 234, 1, 0, 0, 0, 236,
		239, 1, 0, 0, 0, 237, 235, 1, 0, 0, 0, 237, 238, 1, 0, 0, 0, 238, 240, 1, 0, 0, 0, 239, 237, 1, 0,
		0, 0, 240, 249, 3, 4, 2, 0, 241, 243, 5, 1, 0, 0, 242, 241, 1, 0, 0, 0, 243, 244, 1, 0, 0, 0, 244,
		242, 1, 0, 0, 0, 244, 245, 1, 0, 0, 0, 245, 246, 1, 0, 0, 0, 246, 248, 3, 4, 2, 0, 247, 242, 1, 0,
		0, 0, 248, 251, 1, 0, 0, 0, 249, 247, 1, 0, 0, 0, 249, 250, 1, 0, 0, 0, 250, 255, 1, 0, 0, 0, 251,
		249, 1, 0, 0, 0, 252, 254, 5, 1, 0, 0, 253, 252, 1, 0, 0, 0, 254, 257, 1, 0, 0, 0, 255, 253, 1, 0,
		0, 0, 255, 256, 1, 0, 0, 0, 256, 3, 1, 0, 0, 0, 257, 255, 1, 0, 0, 0, 258, 261, 5, 71, 0, 0, 259,
		260, 5, 114, 0, 0, 260, 262, 5, 111, 0, 0, 261, 259, 1, 0, 0, 0, 261, 262, 1, 0, 0, 0, 262, 264,
		1, 0, 0, 0, 263, 258, 1, 0, 0, 0, 263, 264, 1, 0, 0, 0, 264, 289, 1, 0, 0, 0, 265, 290, 3, 6, 3, 0,
		266, 290, 3, 8, 4, 0, 267, 290, 3, 10, 5, 0, 268, 290, 3, 12, 6, 0, 269, 290, 3, 14, 7, 0, 270,
		290, 3, 22, 11, 0, 271, 290, 3, 26, 13, 0, 272, 290, 3, 42, 21, 0, 273, 290, 3, 44, 22, 0, 274,
		290, 3, 46, 23, 0, 275, 290, 3, 56, 28, 0, 276, 290, 3, 58, 29, 0, 277, 290, 3, 60, 30, 0, 278,
		290, 3, 62, 31, 0, 279, 290, 3, 74, 37, 0, 280, 290, 3, 80, 40, 0, 281, 290, 3, 84, 42, 0, 282,
		290, 3, 20, 10, 0, 283, 290, 3, 16, 8, 0, 284, 290, 3, 18, 9, 0, 285, 290, 3, 86, 43, 0, 286, 290,
		3, 108, 54, 0, 287, 290, 3, 112, 56, 0, 288, 290, 3, 116, 58, 0, 289, 265, 1, 0, 0, 0, 289, 266,
		1, 0, 0, 0, 289, 267, 1, 0, 0, 0, 289, 268, 1, 0, 0, 0, 289, 269, 1, 0, 0, 0, 289, 270, 1, 0, 0, 0,
		289, 271, 1, 0, 0, 0, 289, 272, 1, 0, 0, 0, 289, 273, 1, 0, 0, 0, 289, 274, 1, 0, 0, 0, 289, 275,
		1, 0, 0, 0, 289, 276, 1, 0, 0, 0, 289, 277, 1, 0, 0, 0, 289, 278, 1, 0, 0, 0, 289, 279, 1, 0, 0, 0,
		289, 280, 1, 0, 0, 0, 289, 281, 1, 0, 0, 0, 289, 282, 1, 0, 0, 0, 289, 283, 1, 0, 0, 0, 289, 284,
		1, 0, 0, 0, 289, 285, 1, 0, 0, 0, 289, 286, 1, 0, 0, 0, 289, 287, 1, 0, 0, 0, 289, 288, 1, 0, 0, 0,
		290, 5, 1, 0, 0, 0, 291, 292, 5, 30, 0, 0, 292, 296, 5, 132, 0, 0, 293, 294, 3, 182, 91, 0, 294,
		295, 5, 2, 0, 0, 295, 297, 1, 0, 0, 0, 296, 293, 1, 0, 0, 0, 296, 297, 1, 0, 0, 0, 297, 298, 1, 0,
		0, 0, 298, 321, 3, 184, 92, 0, 299, 309, 5, 121, 0, 0, 300, 301, 5, 136, 0, 0, 301, 310, 3, 184,
		92, 0, 302, 304, 5, 46, 0, 0, 303, 302, 1, 0, 0, 0, 303, 304, 1, 0, 0, 0, 304, 305, 1, 0, 0, 0, 305,
		306, 3, 188, 94, 0, 306, 307, 5, 136, 0, 0, 307, 308, 3, 188, 94, 0, 308, 310, 1, 0, 0, 0, 309,
		300, 1, 0, 0, 0, 309, 303, 1, 0, 0, 0, 310, 322, 1, 0, 0, 0, 311, 313, 5, 27, 0, 0, 312, 314, 5,
		46, 0, 0, 313, 312, 1, 0, 0, 0, 313, 314, 1, 0, 0, 0, 314, 315, 1, 0, 0, 0, 315, 322, 3, 28, 14,
		0, 316, 318, 5, 63, 0, 0, 317, 319, 5, 46, 0, 0, 318, 317, 1, 0, 0, 0, 318, 319, 1, 0, 0, 0, 319,
		320, 1, 0, 0, 0, 320, 322, 3, 188, 94, 0, 321, 299, 1, 0, 0, 0, 321, 311, 1, 0, 0, 0, 321, 316,
		1, 0, 0, 0, 322, 7, 1, 0, 0, 0, 323, 331, 5, 31, 0, 0, 324, 332, 3, 182, 91, 0, 325, 326, 3, 182,
		91, 0, 326, 327, 5, 2, 0, 0, 327, 329, 1, 0, 0, 0, 328, 325, 1, 0, 0, 0, 328, 329, 1, 0, 0, 0, 329,
		330, 1, 0, 0, 0, 330, 332, 3, 186, 93, 0, 331, 324, 1, 0, 0, 0, 331, 328, 1, 0, 0, 0, 331, 332,
		1, 0, 0, 0, 332, 9, 1, 0, 0, 0, 333, 335, 5, 35, 0, 0, 334, 336, 5, 55, 0, 0, 335, 334, 1, 0, 0, 0,
		335, 336, 1, 0, 0, 0, 336, 337, 1, 0, 0, 0, 337, 338, 3, 64, 32, 0, 338, 339, 5, 33, 0, 0, 339,
		340, 3, 182, 91, 0, 340, 11, 1, 0, 0, 0, 341, 343, 5, 38, 0, 0, 342, 344, 7, 0, 0, 0, 343, 342,
		1, 0, 0, 0, 343, 344, 1, 0, 0, 0, 344, 349, 1, 0, 0, 0, 345, 347, 5, 137, 0, 0, 346, 348, 3, 208,
		104, 0, 347, 346, 1, 0, 0, 0, 347, 348, 1, 0, 0, 0, 348, 350, 1, 0, 0, 0, 349, 345, 1, 0, 0, 0, 349,
		350, 1, 0, 0, 0, 350, 13, 1, 0, 0, 0, 351, 353, 7, 1, 0, 0, 352, 354, 5, 137, 0, 0, 353, 352, 1,
		0, 0, 0, 353, 354, 1, 0, 0, 0, 354, 15, 1, 0, 0, 0, 355, 357, 5, 126, 0, 0, 356, 358, 5, 137, 0,
		0, 357, 356, 1, 0, 0, 0, 357, 358, 1, 0, 0, 0, 358, 364, 1, 0, 0, 0, 359, 361, 5, 136, 0, 0, 360,
		362, 5, 129, 0, 0, 361, 360, 1, 0, 0, 0, 361, 362, 1, 0, 0, 0, 362, 363, 1, 0, 0, 0, 363, 365, 3,
		204, 102, 0, 364, 359, 1, 0, 0, 0, 364, 365, 1, 0, 0, 0, 365, 17, 1, 0, 0, 0, 366, 367, 5, 129,
		0, 0, 367, 368, 3, 204, 102, 0, 368, 19, 1, 0, 0, 0, 369, 371, 5, 120, 0, 0, 370, 372, 5, 129,
		0, 0, 371, 370, 1, 0, 0, 0, 371, 372, 1, 0, 0, 0, 372, 373, 1, 0, 0, 0, 373, 374, 3, 204, 102, 0,
		374, 21, 1, 0, 0, 0, 375, 377, 5, 50, 0, 0, 376, 378, 5, 140, 0, 0, 377, 376, 1, 0, 0, 0, 377, 378,
		1, 0, 0, 0, 378, 379, 1, 0, 0, 0, 379, 383, 5, 84, 0, 0, 380, 381, 5, 80, 0, 0, 381, 382, 5, 102,
		0, 0, 382, 384, 5, 70, 0, 0, 383, 380, 1, 0, 0, 0, 383, 384, 1, 0, 0, 0, 384, 388, 1, 0, 0, 0, 385,
		386, 3, 182, 91, 0, 386, 387, 5, 2, 0, 0, 387, 389, 1, 0, 0, 0, 388, 385, 1, 0, 0, 0, 388, 389,
		1, 0, 0, 0, 389, 390, 1, 0, 0, 0, 390, 391, 3, 194, 97, 0, 391, 392, 5, 107, 0, 0, 392, 393, 3,
		184, 92, 0, 393, 394, 5, 3, 0, 0, 394, 399, 3, 24, 12, 0, 395, 396, 5, 5, 0, 0, 396, 398, 3, 24,
		12, 0, 397, 395, 1, 0, 0, 0, 398, 401, 1, 0, 0, 0, 399, 397, 1, 0, 0, 0, 399, 400, 1, 0, 0, 0, 400,
		402, 1, 0, 0, 0, 401, 399, 1, 0, 0, 0, 402, 405, 5, 4, 0, 0, 403, 404, 5, 148, 0, 0, 404, 406, 3,
		64, 32, 0, 405, 403, 1, 0, 0, 0, 405, 406, 1, 0, 0, 0, 406, 23, 1, 0, 0, 0, 407, 410, 3, 188, 94,
		0, 408, 410, 3, 64, 32, 0, 409, 407, 1, 0, 0, 0, 409, 408, 1, 0, 0, 0, 410, 413, 1, 0, 0, 0, 411,
		412, 5, 45, 0, 0, 412, 414, 3, 190, 95, 0, 413, 411, 1, 0, 0, 0, 413, 414, 1, 0, 0, 0, 414, 416,
		1, 0, 0, 0, 415, 417, 3, 142, 71, 0, 416, 415, 1, 0, 0, 0, 416, 417, 1, 0, 0, 0, 417, 25, 1, 0, 0,
		0, 418, 420, 5, 50, 0, 0, 419, 421, 7, 2, 0, 0, 420, 419, 1, 0, 0, 0, 420, 421, 1, 0, 0, 0, 421,
		422, 1, 0, 0, 0, 422, 426, 5, 132, 0, 0, 423, 424, 5, 80, 0, 0, 424, 425, 5, 102, 0, 0, 425, 427,
		5, 70, 0, 0, 426, 423, 1, 0, 0, 0, 426, 427, 1, 0, 0, 0, 427, 431, 1, 0, 0, 0, 428, 429, 3, 182,
		91, 0, 429, 430, 5, 2, 0, 0, 430, 432, 1, 0, 0, 0, 431, 428, 1, 0, 0, 0, 431, 432, 1, 0, 0, 0, 432,
		433, 1, 0, 0, 0, 433, 457, 3, 184, 92, 0, 434, 435, 5, 3, 0, 0, 435, 440, 3, 28, 14, 0, 436, 437,
		5, 5, 0, 0, 437, 439, 3, 28, 14, 0, 438, 436, 1, 0, 0, 0, 439, 442, 1, 0, 0, 0, 440, 441, 1, 0, 0,
		0, 440, 438, 1, 0, 0, 0, 441, 447, 1, 0, 0, 0, 442, 440, 1, 0, 0, 0, 443, 444, 5, 5, 0, 0, 444, 446,
		3, 36, 18, 0, 445, 443, 1, 0, 0, 0, 446, 449, 1, 0, 0, 0, 447, 445, 1, 0, 0, 0, 447, 448, 1, 0, 0,
		0, 448, 450, 1, 0, 0, 0, 449, 447, 1, 0, 0, 0, 450, 453, 5, 4, 0, 0, 451, 452, 5, 150, 0, 0, 452,
		454, 5, 185, 0, 0, 453, 451, 1, 0, 0, 0, 453, 454, 1, 0, 0, 0, 454, 458, 1, 0, 0, 0, 455, 456, 5,
		33, 0, 0, 456, 458, 3, 86, 43, 0, 457, 434, 1, 0, 0, 0, 457, 455, 1, 0, 0, 0, 458, 27, 1, 0, 0, 0,
		459, 461, 3, 188, 94, 0, 460, 462, 3, 30, 15, 0, 461, 460, 1, 0, 0, 0, 461, 462, 1, 0, 0, 0, 462,
		466, 1, 0, 0, 0, 463, 465, 3, 32, 16, 0, 464, 463, 1, 0, 0, 0, 465, 468, 1, 0, 0, 0, 466, 464, 1,
		0, 0, 0, 466, 467, 1, 0, 0, 0, 467, 29, 1, 0, 0, 0, 468, 466, 1, 0, 0, 0, 469, 471, 3, 178, 89, 0,
		470, 469, 1, 0, 0, 0, 471, 472, 1, 0, 0, 0, 472, 473, 1, 0, 0, 0, 472, 470, 1, 0, 0, 0, 473, 484,
		1, 0, 0, 0, 474, 475, 5, 3, 0, 0, 475, 476, 3, 34, 17, 0, 476, 477, 5, 4, 0, 0, 477, 485, 1, 0, 0,
		0, 478, 479, 5, 3, 0, 0, 479, 480, 3, 34, 17, 0, 480, 481, 5, 5, 0, 0, 481, 482, 3, 34, 17, 0, 482,
		483, 5, 4, 0, 0, 483, 485, 1, 0, 0, 0, 484, 474, 1, 0, 0, 0, 484, 478, 1, 0, 0, 0, 484, 485, 1, 0,
		0, 0, 485, 31, 1, 0, 0, 0, 486, 487, 5, 49, 0, 0, 487, 489, 3, 178, 89, 0, 488, 486, 1, 0, 0, 0,
		488, 489, 1, 0, 0, 0, 489, 539, 1, 0, 0, 0, 490, 491, 5, 113, 0, 0, 491, 493, 5, 95, 0, 0, 492,
		494, 3, 142, 71, 0, 493, 492, 1, 0, 0, 0, 493, 494, 1, 0, 0, 0, 494, 496, 1, 0, 0, 0, 495, 497,
		3, 40, 20, 0, 496, 495, 1, 0, 0, 0, 496, 497, 1, 0, 0, 0, 497, 499, 1, 0, 0, 0, 498, 500, 5, 36,
		0, 0, 499, 498, 1, 0, 0, 0, 499, 500, 1, 0, 0, 0, 500, 540, 1, 0, 0, 0, 501, 503, 5, 102, 0, 0, 502,
		501, 1, 0, 0, 0, 502, 503, 1, 0, 0, 0, 503, 504, 1, 0, 0, 0, 504, 507, 5, 104, 0, 0, 505, 507, 5,
		140, 0, 0, 506, 502, 1, 0, 0, 0, 506, 505, 1, 0, 0, 0, 507, 509, 1, 0, 0, 0, 508, 510, 3, 40, 20,
		0, 509, 508, 1, 0, 0, 0, 509, 510, 1, 0, 0, 0, 510, 540, 1, 0, 0, 0, 511, 512, 5, 44, 0, 0, 512,
		513, 5, 3, 0, 0, 513, 514, 3, 64, 32, 0, 514, 515, 5, 4, 0, 0, 515, 540, 1, 0, 0, 0, 516, 523, 5,
		56, 0, 0, 517, 524, 3, 34, 17, 0, 518, 524, 3, 68, 34, 0, 519, 520, 5, 3, 0, 0, 520, 521, 3, 64,
		32, 0, 521, 522, 5, 4, 0, 0, 522, 524, 1, 0, 0, 0, 523, 517, 1, 0, 0, 0, 523, 518, 1, 0, 0, 0, 523,
		519, 1, 0, 0, 0, 524, 540, 1, 0, 0, 0, 525, 526, 5, 45, 0, 0, 526, 540, 3, 190, 95, 0, 527, 540,
		3, 38, 19, 0, 528, 529, 5, 169, 0, 0, 529, 531, 5, 170, 0, 0, 530, 528, 1, 0, 0, 0, 530, 531, 1,
		0, 0, 0, 531, 532, 1, 0, 0, 0, 532, 533, 5, 33, 0, 0, 533, 534, 5, 3, 0, 0, 534, 535, 3, 64, 32,
		0, 535, 537, 5, 4, 0, 0, 536, 538, 7, 3, 0, 0, 537, 536, 1, 0, 0, 0, 537, 538, 1, 0, 0, 0, 538, 540,
		1, 0, 0, 0, 539, 490, 1, 0, 0, 0, 539, 506, 1, 0, 0, 0, 539, 511, 1, 0, 0, 0, 539, 516, 1, 0, 0, 0,
		539, 525, 1, 0, 0, 0, 539, 527, 1, 0, 0, 0, 539, 530, 1, 0, 0, 0, 540, 33, 1, 0, 0, 0, 541, 543,
		7, 4, 0, 0, 542, 541, 1, 0, 0, 0, 542, 543, 1, 0, 0, 0, 543, 544, 1, 0, 0, 0, 544, 545, 5, 186, 0,
		0, 545, 35, 1, 0, 0, 0, 546, 547, 5, 49, 0, 0, 547, 549, 3, 178, 89, 0, 548, 546, 1, 0, 0, 0, 548,
		549, 1, 0, 0, 0, 549, 587, 1, 0, 0, 0, 550, 551, 5, 113, 0, 0, 551, 554, 5, 95, 0, 0, 552, 554,
		5, 140, 0, 0, 553, 550, 1, 0, 0, 0, 553, 552, 1, 0, 0, 0, 554, 555, 1, 0, 0, 0, 555, 556, 5, 3, 0,
		0, 556, 561, 3, 24, 12, 0, 557, 558, 5, 5, 0, 0, 558, 560, 3, 24, 12, 0, 559, 557, 1, 0, 0, 0, 560,
		563, 1, 0, 0, 0, 561, 559, 1, 0, 0, 0, 561, 562, 1, 0, 0, 0, 562, 564, 1, 0, 0, 0, 563, 561, 1, 0,
		0, 0, 564, 566, 5, 4, 0, 0, 565, 567, 3, 40, 20, 0, 566, 565, 1, 0, 0, 0, 566, 567, 1, 0, 0, 0, 567,
		588, 1, 0, 0, 0, 568, 569, 5, 44, 0, 0, 569, 570, 5, 3, 0, 0, 570, 571, 3, 64, 32, 0, 571, 572,
		5, 4, 0, 0, 572, 588, 1, 0, 0, 0, 573, 574, 5, 74, 0, 0, 574, 575, 5, 95, 0, 0, 575, 576, 5, 3, 0,
		0, 576, 581, 3, 188, 94, 0, 577, 578, 5, 5, 0, 0, 578, 580, 3, 188, 94, 0, 579, 577, 1, 0, 0, 0,
		580, 583, 1, 0, 0, 0, 581, 579, 1, 0, 0, 0, 581, 582, 1, 0, 0, 0, 582, 584, 1, 0, 0, 0, 583, 581,
		1, 0, 0, 0, 584, 585, 5, 4, 0, 0, 585, 586, 3, 38, 19, 0, 586, 588, 1, 0, 0, 0, 587, 553, 1, 0, 0,
		0, 587, 568, 1, 0, 0, 0, 587, 573, 1, 0, 0, 0, 588, 37, 1, 0, 0, 0, 589, 590, 5, 117, 0, 0, 590,
		602, 3, 192, 96, 0, 591, 592, 5, 3, 0, 0, 592, 597, 3, 188, 94, 0, 593, 594, 5, 5, 0, 0, 594, 596,
		3, 188, 94, 0, 595, 593, 1, 0, 0, 0, 596, 599, 1, 0, 0, 0, 597, 595, 1, 0, 0, 0, 597, 598, 1, 0,
		0, 0, 598, 600, 1, 0, 0, 0, 599, 597, 1, 0, 0, 0, 600, 601, 5, 4, 0, 0, 601, 603, 1, 0, 0, 0, 602,
		591, 1, 0, 0, 0, 602, 603, 1, 0, 0, 0, 603, 618, 1, 0, 0, 0, 604, 605, 5, 107, 0, 0, 605, 612, 7,
		5, 0, 0, 606, 607, 5, 131, 0, 0, 607, 613, 7, 6, 0, 0, 608, 613, 5, 41, 0, 0, 609, 613, 5, 123,
		0, 0, 610, 611, 5, 101, 0, 0, 611, 613, 5, 26, 0, 0, 612, 606, 1, 0, 0, 0, 612, 608, 1, 0, 0, 0,
		612, 609, 1, 0, 0, 0, 612, 610, 1, 0, 0, 0, 613, 617, 1, 0, 0, 0, 614, 615, 5, 99, 0, 0, 615, 617,
		3, 178, 89, 0, 616, 604, 1, 0, 0, 0, 616, 614, 1, 0, 0, 0, 617, 620, 1, 0, 0, 0, 618, 616, 1, 0,
		0, 0, 618, 619, 1, 0, 0, 0, 619, 629, 1, 0, 0, 0, 620, 618, 1, 0, 0, 0, 621, 623, 5, 102, 0, 0, 622,
		621, 1, 0, 0, 0, 622, 623, 1, 0, 0, 0, 623, 624, 1, 0, 0, 0, 624, 627, 5, 57, 0, 0, 625, 626, 5,
		86, 0, 0, 626, 628, 7, 7, 0, 0, 627, 625, 1, 0, 0, 0, 627, 628, 1, 0, 0, 0, 628, 630, 1, 0, 0, 0,
		629, 622, 1, 0, 0, 0, 629, 630, 1, 0, 0, 0, 630, 39, 1, 0, 0, 0, 631, 632, 5, 107, 0, 0, 632, 633,
		5, 48, 0, 0, 633, 634, 7, 8, 0, 0, 634, 41, 1, 0, 0, 0, 635, 637, 5, 50, 0, 0, 636, 638, 7, 2, 0,
		0, 637, 636, 1, 0, 0, 0, 637, 638, 1, 0, 0, 0, 638, 639, 1, 0, 0, 0, 639, 643, 5, 138, 0, 0, 640,
		641, 5, 80, 0, 0, 641, 642, 5, 102, 0, 0, 642, 644, 5, 70, 0, 0, 643, 640, 1, 0, 0, 0, 643, 644,
		1, 0, 0, 0, 644, 648, 1, 0, 0, 0, 645, 646, 3, 182, 91, 0, 646, 647, 5, 2, 0, 0, 647, 649, 1, 0,
		0, 0, 648, 645, 1, 0, 0, 0, 648, 649, 1, 0, 0, 0, 649, 650, 1, 0, 0, 0, 650, 655, 3, 196, 98, 0,
		651, 656, 5, 37, 0, 0, 652, 656, 5, 28, 0, 0, 653, 654, 5, 89, 0, 0, 654, 656, 5, 105, 0, 0, 655,
		651, 1, 0, 0, 0, 655, 652, 1, 0, 0, 0, 655, 653, 1, 0, 0, 0, 655, 656, 1, 0, 0, 0, 656, 671, 1, 0,
		0, 0, 657, 672, 5, 59, 0, 0, 658, 672, 5, 88, 0, 0, 659, 669, 5, 141, 0, 0, 660, 661, 5, 105, 0,
		0, 661, 666, 3, 188, 94, 0, 662, 663, 5, 5, 0, 0, 663, 665, 3, 188, 94, 0, 664, 662, 1, 0, 0, 0,
		665, 668, 1, 0, 0, 0, 666, 664, 1, 0, 0, 0, 666, 667, 1, 0, 0, 0, 667, 670, 1, 0, 0, 0, 668, 666,
		1, 0, 0, 0, 669, 660, 1, 0, 0, 0, 669, 670, 1, 0, 0, 0, 670, 672, 1, 0, 0, 0, 671, 657, 1, 0, 0, 0,
		671, 658, 1, 0, 0, 0, 671, 659, 1, 0, 0, 0, 672, 673, 1, 0, 0, 0, 673, 674, 5, 107, 0, 0, 674, 678,
		3, 184, 92, 0, 675, 676, 5, 73, 0, 0, 676, 677, 5, 64, 0, 0, 677, 679, 5, 127, 0, 0, 678, 675,
		1, 0, 0, 0, 678, 679, 1, 0, 0, 0, 679, 682, 1, 0, 0, 0, 680, 681, 5, 147, 0, 0, 681, 683, 3, 64,
		32, 0, 682, 680, 1, 0, 0, 0, 682, 683, 1, 0, 0, 0, 683, 684, 1, 0, 0, 0, 684, 693, 5, 38, 0, 0, 685,
		690, 3, 108, 54, 0, 686, 690, 3, 74, 37, 0, 687, 690, 3, 56, 28, 0, 688, 690, 3, 86, 43, 0, 689,
		685, 1, 0, 0, 0, 689, 686, 1, 0, 0, 0, 689, 687, 1, 0, 0, 0, 689, 688, 1, 0, 0, 0, 690, 691, 1, 0,
		0, 0, 691, 692, 5, 1, 0, 0, 692, 694, 1, 0, 0, 0, 693, 689, 1, 0, 0, 0, 694, 695, 1, 0, 0, 0, 695,
		693, 1, 0, 0, 0, 695, 696, 1, 0, 0, 0, 696, 697, 1, 0, 0, 0, 697, 698, 5, 66, 0, 0, 698, 43, 1, 0,
		0, 0, 699, 701, 5, 50, 0, 0, 700, 702, 7, 2, 0, 0, 701, 700, 1, 0, 0, 0, 701, 702, 1, 0, 0, 0, 702,
		703, 1, 0, 0, 0, 703, 707, 5, 145, 0, 0, 704, 705, 5, 80, 0, 0, 705, 706, 5, 102, 0, 0, 706, 708,
		5, 70, 0, 0, 707, 704, 1, 0, 0, 0, 707, 708, 1, 0, 0, 0, 708, 712, 1, 0, 0, 0, 709, 710, 3, 182,
		91, 0, 710, 711, 5, 2, 0, 0, 711, 713, 1, 0, 0, 0, 712, 709, 1, 0, 0, 0, 712, 713, 1, 0, 0, 0, 713,
		714, 1, 0, 0, 0, 714, 726, 3, 198, 99, 0, 715, 716, 5, 3, 0, 0, 716, 721, 3, 188, 94, 0, 717, 718,
		5, 5, 0, 0, 718, 720, 3, 188, 94, 0, 719, 717, 1, 0, 0, 0, 720, 723, 1, 0, 0, 0, 721, 719, 1, 0,
		0, 0, 721, 722, 1, 0, 0, 0, 722, 724, 1, 0, 0, 0, 723, 721, 1, 0, 0, 0, 724, 725, 5, 4, 0, 0, 725,
		727, 1, 0, 0, 0, 726, 715, 1, 0, 0, 0, 726, 727, 1, 0, 0, 0, 727, 728, 1, 0, 0, 0, 728, 729, 5, 33,
		0, 0, 729, 730, 3, 86, 43, 0, 730, 45, 1, 0, 0, 0, 731, 732, 5, 50, 0, 0, 732, 733, 5, 146, 0, 0,
		733, 737, 5, 132, 0, 0, 734, 735, 5, 80, 0, 0, 735, 736, 5, 102, 0, 0, 736, 738, 5, 70, 0, 0, 737,
		734, 1, 0, 0, 0, 737, 738, 1, 0, 0, 0, 738, 742, 1, 0, 0, 0, 739, 740, 3, 182, 91, 0, 740, 741,
		5, 2, 0, 0, 741, 743, 1, 0, 0, 0, 742, 739, 1, 0, 0, 0, 742, 743, 1, 0, 0, 0, 743, 744, 1, 0, 0, 0,
		744, 745, 3, 184, 92, 0, 745, 746, 5, 142, 0, 0, 746, 758, 3, 200, 100, 0, 747, 748, 5, 3, 0,
		0, 748, 753, 3, 172, 86, 0, 749, 750, 5, 5, 0, 0, 750, 752, 3, 172, 86, 0, 751, 749, 1, 0, 0, 0,
		752, 755, 1, 0, 0, 0, 753, 751, 1, 0, 0, 0, 753, 754, 1, 0, 0, 0, 754, 756, 1, 0, 0, 0, 755, 753,
		1, 0, 0, 0, 756, 757, 5, 4, 0, 0, 757, 759, 1, 0, 0, 0, 758, 747, 1, 0, 0, 0, 758, 759, 1, 0, 0, 0,
		759, 47, 1, 0, 0, 0, 760, 762, 5, 149, 0, 0, 761, 763, 5, 116, 0, 0, 762, 761, 1, 0, 0, 0, 762,
		763, 1, 0, 0, 0, 763, 764, 1, 0, 0, 0, 764, 765, 3, 50, 25, 0, 765, 766, 5, 33, 0, 0, 766, 767,
		5, 3, 0, 0, 767, 768, 3, 86, 43, 0, 768, 778, 5, 4, 0, 0, 769, 770, 5, 5, 0, 0, 770, 771, 3, 50,
		25, 0, 771, 772, 5, 33, 0, 0, 772, 773, 5, 3, 0, 0, 773, 774, 3, 86, 43, 0, 774, 775, 5, 4, 0, 0,
		775, 777, 1, 0, 0, 0, 776, 769, 1, 0, 0, 0, 777, 780, 1, 0, 0, 0, 778, 776, 1, 0, 0, 0, 778, 779,
		1, 0, 0, 0, 779, 49, 1, 0, 0, 0, 780, 778, 1, 0, 0, 0, 781, 793, 3, 184, 92, 0, 782, 783, 5, 3, 0,
		0, 783, 788, 3, 188, 94, 0, 784, 785, 5, 5, 0, 0, 785, 787, 3, 188, 94, 0, 786, 784, 1, 0, 0, 0,
		787, 790, 1, 0, 0, 0, 788, 786, 1, 0, 0, 0, 788, 789, 1, 0, 0, 0, 789, 791, 1, 0, 0, 0, 790, 788,
		1, 0, 0, 0, 791, 792, 5, 4, 0, 0, 792, 794, 1, 0, 0, 0, 793, 782, 1, 0, 0, 0, 793, 794, 1, 0, 0, 0,
		794, 51, 1, 0, 0, 0, 795, 796, 3, 50, 25, 0, 796, 797, 5, 33, 0, 0, 797, 798, 5, 3, 0, 0, 798, 799,
		3, 164, 82, 0, 799, 801, 5, 139, 0, 0, 800, 802, 5, 29, 0, 0, 801, 800, 1, 0, 0, 0, 801, 802, 1,
		0, 0, 0, 802, 803, 1, 0, 0, 0, 803, 804, 3, 166, 83, 0, 804, 805, 5, 4, 0, 0, 805, 53, 1, 0, 0, 0,
		806, 818, 3, 184, 92, 0, 807, 808, 5, 3, 0, 0, 808, 813, 3, 188, 94, 0, 809, 810, 5, 5, 0, 0, 810,
		812, 3, 188, 94, 0, 811, 809, 1, 0, 0, 0, 812, 815, 1, 0, 0, 0, 813, 811, 1, 0, 0, 0, 813, 814,
		1, 0, 0, 0, 814, 816, 1, 0, 0, 0, 815, 813, 1, 0, 0, 0, 816, 817, 5, 4, 0, 0, 817, 819, 1, 0, 0, 0,
		818, 807, 1, 0, 0, 0, 818, 819, 1, 0, 0, 0, 819, 820, 1, 0, 0, 0, 820, 821, 5, 33, 0, 0, 821, 822,
		5, 3, 0, 0, 822, 823, 3, 86, 43, 0, 823, 824, 5, 4, 0, 0, 824, 55, 1, 0, 0, 0, 825, 827, 3, 48, 24,
		0, 826, 825, 1, 0, 0, 0, 826, 827, 1, 0, 0, 0, 827, 828, 1, 0, 0, 0, 828, 829, 5, 59, 0, 0, 829,
		830, 5, 75, 0, 0, 830, 833, 3, 114, 57, 0, 831, 832, 5, 148, 0, 0, 832, 834, 3, 64, 32, 0, 833,
		831, 1, 0, 0, 0, 833, 834, 1, 0, 0, 0, 834, 836, 1, 0, 0, 0, 835, 837, 3, 76, 38, 0, 836, 835, 1,
		0, 0, 0, 836, 837, 1, 0, 0, 0, 837, 57, 1, 0, 0, 0, 838, 840, 3, 48, 24, 0, 839, 838, 1, 0, 0, 0,
		839, 840, 1, 0, 0, 0, 840, 841, 1, 0, 0, 0, 841, 842, 5, 59, 0, 0, 842, 843, 5, 75, 0, 0, 843, 846,
		3, 114, 57, 0, 844, 845, 5, 148, 0, 0, 845, 847, 3, 64, 32, 0, 846, 844, 1, 0, 0, 0, 846, 847,
		1, 0, 0, 0, 847, 849, 1, 0, 0, 0, 848, 850, 3, 76, 38, 0, 849, 848, 1, 0, 0, 0, 849, 850, 1, 0, 0,
		0, 850, 855, 1, 0, 0, 0, 851, 853, 3, 136, 68, 0, 852, 851, 1, 0, 0, 0, 852, 853, 1, 0, 0, 0, 853,
		854, 1, 0, 0, 0, 854, 856, 3, 138, 69, 0, 855, 852, 1, 0, 0, 0, 855, 856, 1, 0, 0, 0, 856, 59, 1,
		0, 0, 0, 857, 859, 5, 61, 0, 0, 858, 860, 5, 55, 0, 0, 859, 858, 1, 0, 0, 0, 859, 860, 1, 0, 0, 0,
		860, 861, 1, 0, 0, 0, 861, 862, 3, 182, 91, 0, 862, 61, 1, 0, 0, 0, 863, 864, 5, 63, 0, 0, 864,
		867, 7, 9, 0, 0, 865, 866, 5, 80, 0, 0, 866, 868, 5, 70, 0, 0, 867, 865, 1, 0, 0, 0, 867, 868, 1,
		0, 0, 0, 868, 872, 1, 0, 0, 0, 869, 870, 3, 182, 91, 0, 870, 871, 5, 2, 0, 0, 871, 873, 1, 0, 0,
		0, 872, 869, 1, 0, 0, 0, 872, 873, 1, 0, 0, 0, 873, 874, 1, 0, 0, 0, 874, 875, 3, 224, 112, 0, 875,
		63, 1, 0, 0, 0, 876, 877, 6, 32, -1, 0, 877, 965, 3, 68, 34, 0, 878, 965, 5, 187, 0, 0, 879, 880,
		3, 182, 91, 0, 880, 881, 5, 2, 0, 0, 881, 883, 1, 0, 0, 0, 882, 879, 1, 0, 0, 0, 882, 883, 1, 0,
		0, 0, 883, 884, 1, 0, 0, 0, 884, 885, 3, 184, 92, 0, 885, 886, 5, 2, 0, 0, 886, 888, 1, 0, 0, 0,
		887, 882, 1, 0, 0, 0, 887, 888, 1, 0, 0, 0, 888, 889, 1, 0, 0, 0, 889, 965, 3, 188, 94, 0, 890,
		891, 3, 168, 84, 0, 891, 892, 3, 64, 32, 21, 892, 965, 1, 0, 0, 0, 893, 894, 3, 180, 90, 0, 894,
		907, 5, 3, 0, 0, 895, 897, 5, 62, 0, 0, 896, 895, 1, 0, 0, 0, 896, 897, 1, 0, 0, 0, 897, 898, 1,
		0, 0, 0, 898, 903, 3, 64, 32, 0, 899, 900, 5, 5, 0, 0, 900, 902, 3, 64, 32, 0, 901, 899, 1, 0, 0,
		0, 902, 905, 1, 0, 0, 0, 903, 901, 1, 0, 0, 0, 903, 904, 1, 0, 0, 0, 904, 908, 1, 0, 0, 0, 905, 903,
		1, 0, 0, 0, 906, 908, 5, 7, 0, 0, 907, 896, 1, 0, 0, 0, 907, 906, 1, 0, 0, 0, 907, 908, 1, 0, 0, 0,
		908, 909, 1, 0, 0, 0, 909, 911, 5, 4, 0, 0, 910, 912, 3, 118, 59, 0, 911, 910, 1, 0, 0, 0, 911,
		912, 1, 0, 0, 0, 912, 914, 1, 0, 0, 0, 913, 915, 3, 122, 61, 0, 914, 913, 1, 0, 0, 0, 914, 915,
		1, 0, 0, 0, 915, 965, 1, 0, 0, 0, 916, 917, 5, 3, 0, 0, 917, 922, 3, 64, 32, 0, 918, 919, 5, 5, 0,
		0, 919, 921, 3, 64, 32, 0, 920, 918, 1, 0, 0, 0, 921, 924, 1, 0, 0, 0, 922, 920, 1, 0, 0, 0, 922,
		923, 1, 0, 0, 0, 923, 925, 1, 0, 0, 0, 924, 922, 1, 0, 0, 0, 925, 926, 5, 4, 0, 0, 926, 965, 1, 0,
		0, 0, 927, 928, 5, 43, 0, 0, 928, 929, 5, 3, 0, 0, 929, 930, 3, 64, 32, 0, 930, 931, 5, 33, 0, 0,
		931, 932, 3, 30, 15, 0, 932, 933, 5, 4, 0, 0, 933, 965, 1, 0, 0, 0, 934, 936, 5, 102, 0, 0, 935,
		934, 1, 0, 0, 0, 935, 936, 1, 0, 0, 0, 936, 937, 1, 0, 0, 0, 937, 939, 5, 70, 0, 0, 938, 935, 1,
		0, 0, 0, 938, 939, 1, 0, 0, 0, 939, 940, 1, 0, 0, 0, 940, 941, 5, 3, 0, 0, 941, 942, 3, 86, 43, 0,
		942, 943, 5, 4, 0, 0, 943, 965, 1, 0, 0, 0, 944, 946, 5, 42, 0, 0, 945, 947, 3, 64, 32, 0, 946,
		945, 1, 0, 0, 0, 946, 947, 1, 0, 0, 0, 947, 953, 1, 0, 0, 0, 948, 949, 5, 147, 0, 0, 949, 950, 3,
		64, 32, 0, 950, 951, 5, 135, 0, 0, 951, 952, 3, 64, 32, 0, 952, 954, 1, 0, 0, 0, 953, 948, 1, 0,
		0, 0, 954, 955, 1, 0, 0, 0, 955, 953, 1, 0, 0, 0, 955, 956, 1, 0, 0, 0, 956, 959, 1, 0, 0, 0, 957,
		958, 5, 65, 0, 0, 958, 960, 3, 64, 32, 0, 959, 957, 1, 0, 0, 0, 959, 960, 1, 0, 0, 0, 960, 961,
		1, 0, 0, 0, 961, 962, 5, 66, 0, 0, 962, 965, 1, 0, 0, 0, 963, 965, 3, 66, 33, 0, 964, 876, 1, 0,
		0, 0, 964, 878, 1, 0, 0, 0, 964, 887, 1, 0, 0, 0, 964, 890, 1, 0, 0, 0, 964, 893, 1, 0, 0, 0, 964,
		916, 1, 0, 0, 0, 964, 927, 1, 0, 0, 0, 964, 938, 1, 0, 0, 0, 964, 944, 1, 0, 0, 0, 964, 963, 1, 0,
		0, 0, 965, 1091, 1, 0, 0, 0, 966, 967, 10, 20, 0, 0, 967, 968, 5, 11, 0, 0, 968, 1090, 3, 64, 32,
		21, 969, 970, 10, 19, 0, 0, 970, 971, 7, 10, 0, 0, 971, 1090, 3, 64, 32, 20, 972, 973, 10, 18,
		0, 0, 973, 974, 7, 4, 0, 0, 974, 1090, 3, 64, 32, 19, 975, 976, 10, 17, 0, 0, 976, 977, 7, 11,
		0, 0, 977, 1090, 3, 64, 32, 18, 978, 979, 10, 16, 0, 0, 979, 980, 7, 12, 0, 0, 980, 1090, 3, 64,
		32, 17, 981, 1000, 10, 15, 0, 0, 982, 1001, 5, 6, 0, 0, 983, 1001, 5, 22, 0, 0, 984, 1001, 5,
		23, 0, 0, 985, 1001, 5, 24, 0, 0, 986, 1001, 5, 92, 0, 0, 987, 988, 5, 92, 0, 0, 988, 1001, 5,
		102, 0, 0, 989, 991, 5, 92, 0, 0, 990, 992, 5, 102, 0, 0, 991, 990, 1, 0, 0, 0, 991, 992, 1, 0,
		0, 0, 992, 993, 1, 0, 0, 0, 993, 994, 5, 62, 0, 0, 994, 1001, 5, 75, 0, 0, 995, 1001, 5, 83, 0,
		0, 996, 1001, 5, 97, 0, 0, 997, 1001, 5, 77, 0, 0, 998, 1001, 5, 99, 0, 0, 999, 1001, 5, 118,
		0, 0, 1000, 982, 1, 0, 0, 0, 1000, 983, 1, 0, 0, 0, 1000, 984, 1, 0, 0, 0, 1000, 985, 1, 0, 0, 0,
		1000, 986, 1, 0, 0, 0, 1000, 987, 1, 0, 0, 0, 1000, 989, 1, 0, 0, 0, 1000, 995, 1, 0, 0, 0, 1000,
		996, 1, 0, 0, 0, 1000, 997, 1, 0, 0, 0, 1000, 998, 1, 0, 0, 0, 1000, 999, 1, 0, 0, 0, 1001, 1002,
		1, 0, 0, 0, 1002, 1090, 3, 64, 32, 16, 1003, 1004, 10, 14, 0, 0, 1004, 1005, 5, 32, 0, 0, 1005,
		1090, 3, 64, 32, 15, 1006, 1007, 10, 13, 0, 0, 1007, 1008, 5, 108, 0, 0, 1008, 1090, 3, 64,
		32, 14, 1009, 1010, 10, 6, 0, 0, 1010, 1012, 5, 92, 0, 0, 1011, 1013, 5, 102, 0, 0, 1012, 1011,
		1, 0, 0, 0, 1012, 1013, 1, 0, 0, 0, 1013, 1014, 1, 0, 0, 0, 1014, 1090, 3, 64, 32, 7, 1015, 1017,
		10, 5, 0, 0, 1016, 1018, 5, 102, 0, 0, 1017, 1016, 1, 0, 0, 0, 1017, 1018, 1, 0, 0, 0, 1018, 1019,
		1, 0, 0, 0, 1019, 1020, 5, 39, 0, 0, 1020, 1021, 3, 64, 32, 0, 1021, 1022, 5, 32, 0, 0, 1022,
		1023, 3, 64, 32, 6, 1023, 1090, 1, 0, 0, 0, 1024, 1025, 10, 9, 0, 0, 1025, 1026, 5, 45, 0, 0,
		1026, 1090, 3, 190, 95, 0, 1027, 1029, 10, 8, 0, 0, 1028, 1030, 5, 102, 0, 0, 1029, 1028, 1,
		0, 0, 0, 1029, 1030, 1, 0, 0, 0, 1030, 1031, 1, 0, 0, 0, 1031, 1032, 7, 13, 0, 0, 1032, 1035,
		3, 64, 32, 0, 1033, 1034, 5, 67, 0, 0, 1034, 1036, 3, 64, 32, 0, 1035, 1033, 1, 0, 0, 0, 1035,
		1036, 1, 0, 0, 0, 1036, 1090, 1, 0, 0, 0, 1037, 1042, 10, 7, 0, 0, 1038, 1043, 5, 93, 0, 0, 1039,
		1043, 5, 103, 0, 0, 1040, 1041, 5, 102, 0, 0, 1041, 1043, 5, 104, 0, 0, 1042, 1038, 1, 0, 0,
		0, 1042, 1039, 1, 0, 0, 0, 1042, 1040, 1, 0, 0, 0, 1043, 1090, 1, 0, 0, 0, 1044, 1046, 10, 4,
		0, 0, 1045, 1047, 5, 102, 0, 0, 1046, 1045, 1, 0, 0, 0, 1046, 1047, 1, 0, 0, 0, 1047, 1048, 1,
		0, 0, 0, 1048, 1087, 5, 83, 0, 0, 1049, 1059, 5, 3, 0, 0, 1050, 1060, 3, 86, 43, 0, 1051, 1056,
		3, 64, 32, 0, 1052, 1053, 5, 5, 0, 0, 1053, 1055, 3, 64, 32, 0, 1054, 1052, 1, 0, 0, 0, 1055,
		1058, 1, 0, 0, 0, 1056, 1054, 1, 0, 0, 0, 1056, 1057, 1, 0, 0, 0, 1057, 1060, 1, 0, 0, 0, 1058,
		1056, 1, 0, 0, 0, 1059, 1050, 1, 0, 0, 0, 1059, 1051, 1, 0, 0, 0, 1059, 1060, 1, 0, 0, 0, 1060,
		1061, 1, 0, 0, 0, 1061, 1088, 5, 4, 0, 0, 1062, 1063, 3, 182, 91, 0, 1063, 1064, 5, 2, 0, 0, 1064,
		1066, 1, 0, 0, 0, 1065, 1062, 1, 0, 0, 0, 1065, 1066, 1, 0, 0, 0, 1066, 1067, 1, 0, 0, 0, 1067,
		1088, 3, 184, 92, 0, 1068, 1069, 3, 182, 91, 0, 1069, 1070, 5, 2, 0, 0, 1070, 1072, 1, 0, 0,
		0, 1071, 1068, 1, 0, 0, 0, 1071, 1072, 1, 0, 0, 0, 1072, 1073, 1, 0, 0, 0, 1073, 1074, 3, 222,
		111, 0, 1074, 1083, 5, 3, 0, 0, 1075, 1080, 3, 64, 32, 0, 1076, 1077, 5, 5, 0, 0, 1077, 1079,
		3, 64, 32, 0, 1078, 1076, 1, 0, 0, 0, 1079, 1082, 1, 0, 0, 0, 1080, 1078, 1, 0, 0, 0, 1080, 1081,
		1, 0, 0, 0, 1081, 1084, 1, 0, 0, 0, 1082, 1080, 1, 0, 0, 0, 1083, 1075, 1, 0, 0, 0, 1083, 1084,
		1, 0, 0, 0, 1084, 1085, 1, 0, 0, 0, 1085, 1086, 5, 4, 0, 0, 1086, 1088, 1, 0, 0, 0, 1087, 1049,
		1, 0, 0, 0, 1087, 1065, 1, 0, 0, 0, 1087, 1071, 1, 0, 0, 0, 1088, 1090, 1, 0, 0, 0, 1089, 966,
		1, 0, 0, 0, 1089, 969, 1, 0, 0, 0, 1089, 972, 1, 0, 0, 0, 1089, 975, 1, 0, 0, 0, 1089, 978, 1, 0,
		0, 0, 1089, 981, 1, 0, 0, 0, 1089, 1003, 1, 0, 0, 0, 1089, 1006, 1, 0, 0, 0, 1089, 1009, 1, 0,
		0, 0, 1089, 1015, 1, 0, 0, 0, 1089, 1024, 1, 0, 0, 0, 1089, 1027, 1, 0, 0, 0, 1089, 1037, 1, 0,
		0, 0, 1089, 1044, 1, 0, 0, 0, 1090, 1093, 1, 0, 0, 0, 1091, 1089, 1, 0, 0, 0, 1091, 1092, 1, 0,
		0, 0, 1092, 65, 1, 0, 0, 0, 1093, 1091, 1, 0, 0, 0, 1094, 1095, 5, 115, 0, 0, 1095, 1100, 5, 3,
		0, 0, 1096, 1101, 5, 81, 0, 0, 1097, 1098, 7, 14, 0, 0, 1098, 1099, 5, 5, 0, 0, 1099, 1101, 3,
		170, 85, 0, 1100, 1096, 1, 0, 0, 0, 1100, 1097, 1, 0, 0, 0, 1101, 1102, 1, 0, 0, 0, 1102, 1103,
		5, 4, 0, 0, 1103, 67, 1, 0, 0, 0, 1104, 1105, 7, 15, 0, 0, 1105, 69, 1, 0, 0, 0, 1106, 1107, 5,
		3, 0, 0, 1107, 1112, 3, 64, 32, 0, 1108, 1109, 5, 5, 0, 0, 1109, 1111, 3, 64, 32, 0, 1110, 1108,
		1, 0, 0, 0, 1111, 1114, 1, 0, 0, 0, 1112, 1110, 1, 0, 0, 0, 1112, 1113, 1, 0, 0, 0, 1113, 1115,
		1, 0, 0, 0, 1114, 1112, 1, 0, 0, 0, 1115, 1116, 5, 4, 0, 0, 1116, 71, 1, 0, 0, 0, 1117, 1118, 5,
		144, 0, 0, 1118, 1123, 3, 70, 35, 0, 1119, 1120, 5, 5, 0, 0, 1120, 1122, 3, 70, 35, 0, 1121,
		1119, 1, 0, 0, 0, 1122, 1125, 1, 0, 0, 0, 1123, 1121, 1, 0, 0, 0, 1123, 1124, 1, 0, 0, 0, 1124,
		73, 1, 0, 0, 0, 1125, 1123, 1, 0, 0, 0, 1126, 1128, 3, 48, 24, 0, 1127, 1126, 1, 0, 0, 0, 1127,
		1128, 1, 0, 0, 0, 1128, 1134, 1, 0, 0, 0, 1129, 1135, 5, 88, 0, 0, 1130, 1135, 5, 122, 0, 0, 1131,
		1132, 5, 88, 0, 0, 1132, 1133, 5, 108, 0, 0, 1133, 1135, 7, 8, 0, 0, 1134, 1129, 1, 0, 0, 0, 1134,
		1130, 1, 0, 0, 0, 1134, 1131, 1, 0, 0, 0, 1135, 1136, 1, 0, 0, 0, 1136, 1140, 5, 91, 0, 0, 1137,
		1138, 3, 182, 91, 0, 1138, 1139, 5, 2, 0, 0, 1139, 1141, 1, 0, 0, 0, 1140, 1137, 1, 0, 0, 0, 1140,
		1141, 1, 0, 0, 0, 1141, 1142, 1, 0, 0, 0, 1142, 1145, 3, 184, 92, 0, 1143, 1144, 5, 33, 0, 0,
		1144, 1146, 3, 206, 103, 0, 1145, 1143, 1, 0, 0, 0, 1145, 1146, 1, 0, 0, 0, 1146, 1158, 1, 0,
		0, 0, 1147, 1148, 5, 3, 0, 0, 1148, 1153, 3, 188, 94, 0, 1149, 1150, 5, 5, 0, 0, 1150, 1152,
		3, 188, 94, 0, 1151, 1149, 1, 0, 0, 0, 1152, 1155, 1, 0, 0, 0, 1153, 1151, 1, 0, 0, 0, 1153, 1154,
		1, 0, 0, 0, 1154, 1156, 1, 0, 0, 0, 1155, 1153, 1, 0, 0, 0, 1156, 1157, 5, 4, 0, 0, 1157, 1159,
		1, 0, 0, 0, 1158, 1147, 1, 0, 0, 0, 1158, 1159, 1, 0, 0, 0, 1159, 1169, 1, 0, 0, 0, 1160, 1163,
		3, 72, 36, 0, 1161, 1163, 3, 86, 43, 0, 1162, 1160, 1, 0, 0, 0, 1162, 1161, 1, 0, 0, 0, 1163,
		1165, 1, 0, 0, 0, 1164, 1166, 3, 78, 39, 0, 1165, 1164, 1, 0, 0, 0, 1165, 1166, 1, 0, 0, 0, 1166,
		1170, 1, 0, 0, 0, 1167, 1168, 5, 56, 0, 0, 1168, 1170, 5, 144, 0, 0, 1169, 1162, 1, 0, 0, 0, 1169,
		1167, 1, 0, 0, 0, 1170, 1172, 1, 0, 0, 0, 1171, 1173, 3, 76, 38, 0, 1172, 1171, 1, 0, 0, 0, 1172,
		1173, 1, 0, 0, 0, 1173, 75, 1, 0, 0, 0, 1174, 1175, 5, 124, 0, 0, 1175, 1180, 3, 100, 50, 0, 1176,
		1177, 5, 5, 0, 0, 1177, 1179, 3, 100, 50, 0, 1178, 1176, 1, 0, 0, 0, 1179, 1182, 1, 0, 0, 0, 1180,
		1178, 1, 0, 0, 0, 1180, 1181, 1, 0, 0, 0, 1181, 77, 1, 0, 0, 0, 1182, 1180, 1, 0, 0, 0, 1183, 1184,
		5, 107, 0, 0, 1184, 1199, 5, 48, 0, 0, 1185, 1186, 5, 3, 0, 0, 1186, 1191, 3, 24, 12, 0, 1187,
		1188, 5, 5, 0, 0, 1188, 1190, 3, 24, 12, 0, 1189, 1187, 1, 0, 0, 0, 1190, 1193, 1, 0, 0, 0, 1191,
		1189, 1, 0, 0, 0, 1191, 1192, 1, 0, 0, 0, 1192, 1194, 1, 0, 0, 0, 1193, 1191, 1, 0, 0, 0, 1194,
		1197, 5, 4, 0, 0, 1195, 1196, 5, 148, 0, 0, 1196, 1198, 3, 64, 32, 0, 1197, 1195, 1, 0, 0, 0,
		1197, 1198, 1, 0, 0, 0, 1198, 1200, 1, 0, 0, 0, 1199, 1185, 1, 0, 0, 0, 1199, 1200, 1, 0, 0, 0,
		1200, 1201, 1, 0, 0, 0, 1201, 1228, 5, 183, 0, 0, 1202, 1229, 5, 184, 0, 0, 1203, 1204, 5, 141,
		0, 0, 1204, 1207, 5, 131, 0, 0, 1205, 1208, 3, 188, 94, 0, 1206, 1208, 3, 110, 55, 0, 1207,
		1205, 1, 0, 0, 0, 1207, 1206, 1, 0, 0, 0, 1208, 1209, 1, 0, 0, 0, 1209, 1210, 5, 6, 0, 0, 1210,
		1221, 3, 64, 32, 0, 1211, 1214, 5, 5, 0, 0, 1212, 1215, 3, 188, 94, 0, 1213, 1215, 3, 110, 55,
		0, 1214, 1212, 1, 0, 0, 0, 1214, 1213, 1, 0, 0, 0, 1215, 1216, 1, 0, 0, 0, 1216, 1217, 5, 6, 0,
		0, 1217, 1218, 3, 64, 32, 0, 1218, 1220, 1, 0, 0, 0, 1219, 1211, 1, 0, 0, 0, 1220, 1223, 1, 0,
		0, 0, 1221, 1219, 1, 0, 0, 0, 1221, 1222, 1, 0, 0, 0, 1222, 1226, 1, 0, 0, 0, 1223, 1221, 1, 0,
		0, 0, 1224, 1225, 5, 148, 0, 0, 1225, 1227, 3, 64, 32, 0, 1226, 1224, 1, 0, 0, 0, 1226, 1227,
		1, 0, 0, 0, 1227, 1229, 1, 0, 0, 0, 1228, 1202, 1, 0, 0, 0, 1228, 1203, 1, 0, 0, 0, 1229, 79, 1,
		0, 0, 0, 1230, 1234, 5, 112, 0, 0, 1231, 1232, 3, 182, 91, 0, 1232, 1233, 5, 2, 0, 0, 1233, 1235,
		1, 0, 0, 0, 1234, 1231, 1, 0, 0, 0, 1234, 1235, 1, 0, 0, 0, 1235, 1236, 1, 0, 0, 0, 1236, 1243,
		3, 202, 101, 0, 1237, 1238, 5, 6, 0, 0, 1238, 1244, 3, 82, 41, 0, 1239, 1240, 5, 3, 0, 0, 1240,
		1241, 3, 82, 41, 0, 1241, 1242, 5, 4, 0, 0, 1242, 1244, 1, 0, 0, 0, 1243, 1237, 1, 0, 0, 0, 1243,
		1239, 1, 0, 0, 0, 1243, 1244, 1, 0, 0, 0, 1244, 81, 1, 0, 0, 0, 1245, 1249, 3, 34, 17, 0, 1246,
		1249, 3, 178, 89, 0, 1247, 1249, 5, 188, 0, 0, 1248, 1245, 1, 0, 0, 0, 1248, 1246, 1, 0, 0, 0,
		1248, 1247, 1, 0, 0, 0, 1249, 83, 1, 0, 0, 0, 1250, 1261, 5, 119, 0, 0, 1251, 1262, 3, 190, 95,
		0, 1252, 1253, 3, 182, 91, 0, 1253, 1254, 5, 2, 0, 0, 1254, 1256, 1, 0, 0, 0, 1255, 1252, 1,
		0, 0, 0, 1255, 1256, 1, 0, 0, 0, 1256, 1259, 1, 0, 0, 0, 1257, 1260, 3, 184, 92, 0, 1258, 1260,
		3, 194, 97, 0, 1259, 1257, 1, 0, 0, 0, 1259, 1258, 1, 0, 0, 0, 1260, 1262, 1, 0, 0, 0, 1261, 1251,
		1, 0, 0, 0, 1261, 1255, 1, 0, 0, 0, 1261, 1262, 1, 0, 0, 0, 1262, 85, 1, 0, 0, 0, 1263, 1265, 3,
		134, 67, 0, 1264, 1263, 1, 0, 0, 0, 1264, 1265, 1, 0, 0, 0, 1265, 1266, 1, 0, 0, 0, 1266, 1272,
		3, 90, 45, 0, 1267, 1268, 3, 106, 53, 0, 1268, 1269, 3, 90, 45, 0, 1269, 1271, 1, 0, 0, 0, 1270,
		1267, 1, 0, 0, 0, 1271, 1274, 1, 0, 0, 0, 1272, 1270, 1, 0, 0, 0, 1272, 1273, 1, 0, 0, 0, 1273,
		1276, 1, 0, 0, 0, 1274, 1272, 1, 0, 0, 0, 1275, 1277, 3, 136, 68, 0, 1276, 1275, 1, 0, 0, 0, 1276,
		1277, 1, 0, 0, 0, 1277, 1279, 1, 0, 0, 0, 1278, 1280, 3, 138, 69, 0, 1279, 1278, 1, 0, 0, 0, 1279,
		1280, 1, 0, 0, 0, 1280, 87, 1, 0, 0, 0, 1281, 1289, 3, 98, 49, 0, 1282, 1283, 3, 102, 51, 0, 1283,
		1285, 3, 98, 49, 0, 1284, 1286, 3, 104, 52, 0, 1285, 1284, 1, 0, 0, 0, 1285, 1286, 1, 0, 0, 0,
		1286, 1288, 1, 0, 0, 0, 1287, 1282, 1, 0, 0, 0, 1288, 1291, 1, 0, 0, 0, 1289, 1287, 1, 0, 0, 0,
		1289, 1290, 1, 0, 0, 0, 1290, 89, 1, 0, 0, 0, 1291, 1289, 1, 0, 0, 0, 1292, 1294, 5, 130, 0, 0,
		1293, 1295, 7, 16, 0, 0, 1294, 1293, 1, 0, 0, 0, 1294, 1295, 1, 0, 0, 0, 1295, 1296, 1, 0, 0,
		0, 1296, 1301, 3, 100, 50, 0, 1297, 1298, 5, 5, 0, 0, 1298, 1300, 3, 100, 50, 0, 1299, 1297,
		1, 0, 0, 0, 1300, 1303, 1, 0, 0, 0, 1301, 1299, 1, 0, 0, 0, 1301, 1302, 1, 0, 0, 0, 1302, 1316,
		1, 0, 0, 0, 1303, 1301, 1, 0, 0, 0, 1304, 1314, 5, 75, 0, 0, 1305, 1310, 3, 98, 49, 0, 1306, 1307,
		5, 5, 0, 0, 1307, 1309, 3, 98, 49, 0, 1308, 1306, 1, 0, 0, 0, 1309, 1312, 1, 0, 0, 0, 1310, 1308,
		1, 0, 0, 0, 1310, 1311, 1, 0, 0, 0, 1311, 1315, 1, 0, 0, 0, 1312, 1310, 1, 0, 0, 0, 1313, 1315,
		3, 88, 44, 0, 1314, 1305, 1, 0, 0, 0, 1314, 1313, 1, 0, 0, 0, 1315, 1317, 1, 0, 0, 0, 1316, 1304,
		1, 0, 0, 0, 1316, 1317, 1, 0, 0, 0, 1317, 1320, 1, 0, 0, 0, 1318, 1319, 5, 148, 0, 0, 1319, 1321,
		3, 64, 32, 0, 1320, 1318, 1, 0, 0, 0, 1320, 1321, 1, 0, 0, 0, 1321, 1336, 1, 0, 0, 0, 1322, 1323,
		5, 78, 0, 0, 1323, 1324, 5, 40, 0, 0, 1324, 1329, 3, 64, 32, 0, 1325, 1326, 5, 5, 0, 0, 1326,
		1328, 3, 64, 32, 0, 1327, 1325, 1, 0, 0, 0, 1328, 1331, 1, 0, 0, 0, 1329, 1327, 1, 0, 0, 0, 1329,
		1330, 1, 0, 0, 0, 1330, 1334, 1, 0, 0, 0, 1331, 1329, 1, 0, 0, 0, 1332, 1333, 5, 79, 0, 0, 1333,
		1335, 3, 64, 32, 0, 1334, 1332, 1, 0, 0, 0, 1334, 1335, 1, 0, 0, 0, 1335, 1337, 1, 0, 0, 0, 1336,
		1322, 1, 0, 0, 0, 1336, 1337, 1, 0, 0, 0, 1337, 1352, 1, 0, 0, 0, 1338, 1339, 5, 174, 0, 0, 1339,
		1340, 3, 210, 105, 0, 1340, 1341, 5, 33, 0, 0, 1341, 1349, 3, 120, 60, 0, 1342, 1343, 5, 5,
		0, 0, 1343, 1344, 3, 210, 105, 0, 1344, 1345, 5, 33, 0, 0, 1345, 1346, 3, 120, 60, 0, 1346,
		1348, 1, 0, 0, 0, 1347, 1342, 1, 0, 0, 0, 1348, 1351, 1, 0, 0, 0, 1349, 1347, 1, 0, 0, 0, 1349,
		1350, 1, 0, 0, 0, 1350, 1353, 1, 0, 0, 0, 1351, 1349, 1, 0, 0, 0, 1352, 1338, 1, 0, 0, 0, 1352,
		1353, 1, 0, 0, 0, 1353, 1356, 1, 0, 0, 0, 1354, 1356, 3, 72, 36, 0, 1355, 1292, 1, 0, 0, 0, 1355,
		1354, 1, 0, 0, 0, 1356, 91, 1, 0, 0, 0, 1357, 1358, 3, 86, 43, 0, 1358, 93, 1, 0, 0, 0, 1359, 1361,
		3, 134, 67, 0, 1360, 1359, 1, 0, 0, 0, 1360, 1361, 1, 0, 0, 0, 1361, 1362, 1, 0, 0, 0, 1362, 1364,
		3, 90, 45, 0, 1363, 1365, 3, 136, 68, 0, 1364, 1363, 1, 0, 0, 0, 1364, 1365, 1, 0, 0, 0, 1365,
		1367, 1, 0, 0, 0, 1366, 1368, 3, 138, 69, 0, 1367, 1366, 1, 0, 0, 0, 1367, 1368, 1, 0, 0, 0, 1368,
		95, 1, 0, 0, 0, 1369, 1371, 3, 134, 67, 0, 1370, 1369, 1, 0, 0, 0, 1370, 1371, 1, 0, 0, 0, 1371,
		1372, 1, 0, 0, 0, 1372, 1382, 3, 90, 45, 0, 1373, 1375, 5, 139, 0, 0, 1374, 1376, 5, 29, 0, 0,
		1375, 1374, 1, 0, 0, 0, 1375, 1376, 1, 0, 0, 0, 1376, 1380, 1, 0, 0, 0, 1377, 1380, 5, 90, 0,
		0, 1378, 1380, 5, 68, 0, 0, 1379, 1373, 1, 0, 0, 0, 1379, 1377, 1, 0, 0, 0, 1379, 1378, 1, 0,
		0, 0, 1380, 1381, 1, 0, 0, 0, 1381, 1383, 3, 90, 45, 0, 1382, 1379, 1, 0, 0, 0, 1383, 1384, 1,
		0, 0, 0, 1384, 1382, 1, 0, 0, 0, 1384, 1385, 1, 0, 0, 0, 1385, 1387, 1, 0, 0, 0, 1386, 1388, 3,
		136, 68, 0, 1387, 1386, 1, 0, 0, 0, 1387, 1388, 1, 0, 0, 0, 1388, 1390, 1, 0, 0, 0, 1389, 1391,
		3, 138, 69, 0, 1390, 1389, 1, 0, 0, 0, 1390, 1391, 1, 0, 0, 0, 1391, 97, 1, 0, 0, 0, 1392, 1393,
		3, 182, 91, 0, 1393, 1394, 5, 2, 0, 0, 1394, 1396, 1, 0, 0, 0, 1395, 1392, 1, 0, 0, 0, 1395, 1396,
		1, 0, 0, 0, 1396, 1397, 1, 0, 0, 0, 1397, 1402, 3, 184, 92, 0, 1398, 1400, 5, 33, 0, 0, 1399,
		1398, 1, 0, 0, 0, 1399, 1400, 1, 0, 0, 0, 1400, 1401, 1, 0, 0, 0, 1401, 1403, 3, 206, 103, 0,
		1402, 1399, 1, 0, 0, 0, 1402, 1403, 1, 0, 0, 0, 1403, 1409, 1, 0, 0, 0, 1404, 1405, 5, 85, 0,
		0, 1405, 1406, 5, 40, 0, 0, 1406, 1410, 3, 194, 97, 0, 1407, 1408, 5, 102, 0, 0, 1408, 1410,
		5, 85, 0, 0, 1409, 1404, 1, 0, 0, 0, 1409, 1407, 1, 0, 0, 0, 1409, 1410, 1, 0, 0, 0, 1410, 1457,
		1, 0, 0, 0, 1411, 1412, 3, 182, 91, 0, 1412, 1413, 5, 2, 0, 0, 1413, 1415, 1, 0, 0, 0, 1414, 1411,
		1, 0, 0, 0, 1414, 1415, 1, 0, 0, 0, 1415, 1416, 1, 0, 0, 0, 1416, 1417, 3, 222, 111, 0, 1417,
		1418, 5, 3, 0, 0, 1418, 1423, 3, 64, 32, 0, 1419, 1420, 5, 5, 0, 0, 1420, 1422, 3, 64, 32, 0,
		1421, 1419, 1, 0, 0, 0, 1422, 1425, 1, 0, 0, 0, 1423, 1421, 1, 0, 0, 0, 1423, 1424, 1, 0, 0, 0,
		1424, 1426, 1, 0, 0, 0, 1425, 1423, 1, 0, 0, 0, 1426, 1431, 5, 4, 0, 0, 1427, 1429, 5, 33, 0,
		0, 1428, 1427, 1, 0, 0, 0, 1428, 1429, 1, 0, 0, 0, 1429, 1430, 1, 0, 0, 0, 1430, 1432, 3, 206,
		103, 0, 1431, 1428, 1, 0, 0, 0, 1431, 1432, 1, 0, 0, 0, 1432, 1457, 1, 0, 0, 0, 1433, 1443, 5,
		3, 0, 0, 1434, 1439, 3, 98, 49, 0, 1435, 1436, 5, 5, 0, 0, 1436, 1438, 3, 98, 49, 0, 1437, 1435,
		1, 0, 0, 0, 1438, 1441, 1, 0, 0, 0, 1439, 1437, 1, 0, 0, 0, 1439, 1440, 1, 0, 0, 0, 1440, 1444,
		1, 0, 0, 0, 1441, 1439, 1, 0, 0, 0, 1442, 1444, 3, 88, 44, 0, 1443, 1434, 1, 0, 0, 0, 1443, 1442,
		1, 0, 0, 0, 1444, 1445, 1, 0, 0, 0, 1445, 1446, 5, 4, 0, 0, 1446, 1457, 1, 0, 0, 0, 1447, 1448,
		5, 3, 0, 0, 1448, 1449, 3, 86, 43, 0, 1449, 1454, 5, 4, 0, 0, 1450, 1452, 5, 33, 0, 0, 1451, 1450,
		1, 0, 0, 0, 1451, 1452, 1, 0, 0, 0, 1452, 1453, 1, 0, 0, 0, 1453, 1455, 3, 206, 103, 0, 1454,
		1451, 1, 0, 0, 0, 1454, 1455, 1, 0, 0, 0, 1455, 1457, 1, 0, 0, 0, 1456, 1395, 1, 0, 0, 0, 1456,
		1414, 1, 0, 0, 0, 1456, 1433, 1, 0, 0, 0, 1456, 1447, 1, 0, 0, 0, 1457, 99, 1, 0, 0, 0, 1458, 1471,
		5, 7, 0, 0, 1459, 1460, 3, 184, 92, 0, 1460, 1461, 5, 2, 0, 0, 1461, 1462, 5, 7, 0, 0, 1462, 1471,
		1, 0, 0, 0, 1463, 1468, 3, 64, 32, 0, 1464, 1466, 5, 33, 0, 0, 1465, 1464, 1, 0, 0, 0, 1465, 1466,
		1, 0, 0, 0, 1466, 1467, 1, 0, 0, 0, 1467, 1469, 3, 174, 87, 0, 1468, 1465, 1, 0, 0, 0, 1468, 1469,
		1, 0, 0, 0, 1469, 1471, 1, 0, 0, 0, 1470, 1458, 1, 0, 0, 0, 1470, 1459, 1, 0, 0, 0, 1470, 1463,
		1, 0, 0, 0, 1471, 101, 1, 0, 0, 0, 1472, 1486, 5, 5, 0, 0, 1473, 1475, 5, 100, 0, 0, 1474, 1473,
		1, 0, 0, 0, 1474, 1475, 1, 0, 0, 0, 1475, 1482, 1, 0, 0, 0, 1476, 1478, 7, 17, 0, 0, 1477, 1479,
		5, 110, 0, 0, 1478, 1477, 1, 0, 0, 0, 1478, 1479, 1, 0, 0, 0, 1479, 1483, 1, 0, 0, 0, 1480, 1483,
		5, 87, 0, 0, 1481, 1483, 5, 51, 0, 0, 1482, 1476, 1, 0, 0, 0, 1482, 1480, 1, 0, 0, 0, 1482, 1481,
		1, 0, 0, 0, 1482, 1483, 1, 0, 0, 0, 1483, 1484, 1, 0, 0, 0, 1484, 1486, 5, 94, 0, 0, 1485, 1472,
		1, 0, 0, 0, 1485, 1474, 1, 0, 0, 0, 1486, 103, 1, 0, 0, 0, 1487, 1488, 5, 107, 0, 0, 1488, 1502,
		3, 64, 32, 0, 1489, 1490, 5, 142, 0, 0, 1490, 1491, 5, 3, 0, 0, 1491, 1496, 3, 188, 94, 0, 1492,
		1493, 5, 5, 0, 0, 1493, 1495, 3, 188, 94, 0, 1494, 1492, 1, 0, 0, 0, 1495, 1498, 1, 0, 0, 0, 1496,
		1494, 1, 0, 0, 0, 1496, 1497, 1, 0, 0, 0, 1497, 1499, 1, 0, 0, 0, 1498, 1496, 1, 0, 0, 0, 1499,
		1500, 5, 4, 0, 0, 1500, 1502, 1, 0, 0, 0, 1501, 1487, 1, 0, 0, 0, 1501, 1489, 1, 0, 0, 0, 1502,
		105, 1, 0, 0, 0, 1503, 1505, 5, 139, 0, 0, 1504, 1506, 5, 29, 0, 0, 1505, 1504, 1, 0, 0, 0, 1505,
		1506, 1, 0, 0, 0, 1506, 1510, 1, 0, 0, 0, 1507, 1510, 5, 90, 0, 0, 1508, 1510, 5, 68, 0, 0, 1509,
		1503, 1, 0, 0, 0, 1509, 1507, 1, 0, 0, 0, 1509, 1508, 1, 0, 0, 0, 1510, 107, 1, 0, 0, 0, 1511,
		1513, 3, 48, 24, 0, 1512, 1511, 1, 0, 0, 0, 1512, 1513, 1, 0, 0, 0, 1513, 1514, 1, 0, 0, 0, 1514,
		1517, 5, 141, 0, 0, 1515, 1516, 5, 108, 0, 0, 1516, 1518, 7, 8, 0, 0, 1517, 1515, 1, 0, 0, 0,
		1517, 1518, 1, 0, 0, 0, 1518, 1519, 1, 0, 0, 0, 1519, 1520, 3, 114, 57, 0, 1520, 1523, 5, 131,
		0, 0, 1521, 1524, 3, 188, 94, 0, 1522, 1524, 3, 110, 55, 0, 1523, 1521, 1, 0, 0, 0, 1523, 1522,
		1, 0, 0, 0, 1524, 1525, 1, 0, 0, 0, 1525, 1526, 5, 6, 0, 0, 1526, 1537, 3, 64, 32, 0, 1527, 1530,
		5, 5, 0, 0, 1528, 1531, 3, 188, 94, 0, 1529, 1531, 3, 110, 55, 0, 1530, 1528, 1, 0, 0, 0, 1530,
		1529, 1, 0, 0, 0, 1531, 1532, 1, 0, 0, 0, 1532, 1533, 5, 6, 0, 0, 1533, 1534, 3, 64, 32, 0, 1534,
		1536, 1, 0, 0, 0, 1535, 1527, 1, 0, 0, 0, 1536, 1539, 1, 0, 0, 0, 1537, 1535, 1, 0, 0, 0, 1537,
		1538, 1, 0, 0, 0, 1538, 1552, 1, 0, 0, 0, 1539, 1537, 1, 0, 0, 0, 1540, 1550, 5, 75, 0, 0, 1541,
		1546, 3, 98, 49, 0, 1542, 1543, 5, 5, 0, 0, 1543, 1545, 3, 98, 49, 0, 1544, 1542, 1, 0, 0, 0,
		1545, 1548, 1, 0, 0, 0, 1546, 1544, 1, 0, 0, 0, 1546, 1547, 1, 0, 0, 0, 1547, 1551, 1, 0, 0, 0,
		1548, 1546, 1, 0, 0, 0, 1549, 1551, 3, 88, 44, 0, 1550, 1541, 1, 0, 0, 0, 1550, 1549, 1, 0, 0,
		0, 1551, 1553, 1, 0, 0, 0, 1552, 1540, 1, 0, 0, 0, 1552, 1553, 1, 0, 0, 0, 1553, 1556, 1, 0, 0,
		0, 1554, 1555, 5, 148, 0, 0, 1555, 1557, 3, 64, 32, 0, 1556, 1554, 1, 0, 0, 0, 1556, 1557, 1,
		0, 0, 0, 1557, 1559, 1, 0, 0, 0, 1558, 1560, 3, 76, 38, 0, 1559, 1558, 1, 0, 0, 0, 1559, 1560,
		1, 0, 0, 0, 1560, 109, 1, 0, 0, 0, 1561, 1562, 5, 3, 0, 0, 1562, 1567, 3, 188, 94, 0, 1563, 1564,
		5, 5, 0, 0, 1564, 1566, 3, 188, 94, 0, 1565, 1563, 1, 0, 0, 0, 1566, 1569, 1, 0, 0, 0, 1567, 1565,
		1, 0, 0, 0, 1567, 1568, 1, 0, 0, 0, 1568, 1570, 1, 0, 0, 0, 1569, 1567, 1, 0, 0, 0, 1570, 1571,
		5, 4, 0, 0, 1571, 111, 1, 0, 0, 0, 1572, 1574, 3, 48, 24, 0, 1573, 1572, 1, 0, 0, 0, 1573, 1574,
		1, 0, 0, 0, 1574, 1575, 1, 0, 0, 0, 1575, 1578, 5, 141, 0, 0, 1576, 1577, 5, 108, 0, 0, 1577,
		1579, 7, 8, 0, 0, 1578, 1576, 1, 0, 0, 0, 1578, 1579, 1, 0, 0, 0, 1579, 1580, 1, 0, 0, 0, 1580,
		1581, 3, 114, 57, 0, 1581, 1584, 5, 131, 0, 0, 1582, 1585, 3, 188, 94, 0, 1583, 1585, 3, 110,
		55, 0, 1584, 1582, 1, 0, 0, 0, 1584, 1583, 1, 0, 0, 0, 1585, 1586, 1, 0, 0, 0, 1586, 1587, 5,
		6, 0, 0, 1587, 1598, 3, 64, 32, 0, 1588, 1591, 5, 5, 0, 0, 1589, 1592, 3, 188, 94, 0, 1590, 1592,
		3, 110, 55, 0, 1591, 1589, 1, 0, 0, 0, 1591, 1590, 1, 0, 0, 0, 1592, 1593, 1, 0, 0, 0, 1593, 1594,
		5, 6, 0, 0, 1594, 1595, 3, 64, 32, 0, 1595, 1597, 1, 0, 0, 0, 1596, 1588, 1, 0, 0, 0, 1597, 1600,
		1, 0, 0, 0, 1598, 1596, 1, 0, 0, 0, 1598, 1599, 1, 0, 0, 0, 1599, 1603, 1, 0, 0, 0, 1600, 1598,
		1, 0, 0, 0, 1601, 1602, 5, 148, 0, 0, 1602, 1604, 3, 64, 32, 0, 1603, 1601, 1, 0, 0, 0, 1603,
		1604, 1, 0, 0, 0, 1604, 1606, 1, 0, 0, 0, 1605, 1607, 3, 76, 38, 0, 1606, 1605, 1, 0, 0, 0, 1606,
		1607, 1, 0, 0, 0, 1607, 1612, 1, 0, 0, 0, 1608, 1610, 3, 136, 68, 0, 1609, 1608, 1, 0, 0, 0, 1609,
		1610, 1, 0, 0, 0, 1610, 1611, 1, 0, 0, 0, 1611, 1613, 3, 138, 69, 0, 1612, 1609, 1, 0, 0, 0, 1612,
		1613, 1, 0, 0, 0, 1613, 113, 1, 0, 0, 0, 1614, 1615, 3, 182, 91, 0, 1615, 1616, 5, 2, 0, 0, 1616,
		1618, 1, 0, 0, 0, 1617, 1614, 1, 0, 0, 0, 1617, 1618, 1, 0, 0, 0, 1618, 1619, 1, 0, 0, 0, 1619,
		1622, 3, 184, 92, 0, 1620, 1621, 5, 33, 0, 0, 1621, 1623, 3, 212, 106, 0, 1622, 1620, 1, 0,
		0, 0, 1622, 1623, 1, 0, 0, 0, 1623, 1629, 1, 0, 0, 0, 1624, 1625, 5, 85, 0, 0, 1625, 1626, 5,
		40, 0, 0, 1626, 1630, 3, 194, 97, 0, 1627, 1628, 5, 102, 0, 0, 1628, 1630, 5, 85, 0, 0, 1629,
		1624, 1, 0, 0, 0, 1629, 1627, 1, 0, 0, 0, 1629, 1630, 1, 0, 0, 0, 1630, 115, 1, 0, 0, 0, 1631,
		1633, 5, 143, 0, 0, 1632, 1634, 3, 182, 91, 0, 1633, 1632, 1, 0, 0, 0, 1633, 1634, 1, 0, 0, 0,
		1634, 1637, 1, 0, 0, 0, 1635, 1636, 5, 91, 0, 0, 1636, 1638, 3, 214, 107, 0, 1637, 1635, 1,
		0, 0, 0, 1637, 1638, 1, 0, 0, 0, 1638, 117, 1, 0, 0, 0, 1639, 1640, 5, 178, 0, 0, 1640, 1641,
		5, 3, 0, 0, 1641, 1642, 5, 148, 0, 0, 1642, 1643, 3, 64, 32, 0, 1643, 1644, 5, 4, 0, 0, 1644,
		119, 1, 0, 0, 0, 1645, 1647, 5, 3, 0, 0, 1646, 1648, 3, 216, 108, 0, 1647, 1646, 1, 0, 0, 0, 1647,
		1648, 1, 0, 0, 0, 1648, 1659, 1, 0, 0, 0, 1649, 1650, 5, 153, 0, 0, 1650, 1651, 5, 40, 0, 0, 1651,
		1656, 3, 64, 32, 0, 1652, 1653, 5, 5, 0, 0, 1653, 1655, 3, 64, 32, 0, 1654, 1652, 1, 0, 0, 0,
		1655, 1658, 1, 0, 0, 0, 1656, 1654, 1, 0, 0, 0, 1656, 1657, 1, 0, 0, 0, 1657, 1660, 1, 0, 0, 0,
		1658, 1656, 1, 0, 0, 0, 1659, 1649, 1, 0, 0, 0, 1659, 1660, 1, 0, 0, 0, 1660, 1661, 1, 0, 0, 0,
		1661, 1662, 5, 109, 0, 0, 1662, 1663, 5, 40, 0, 0, 1663, 1668, 3, 140, 70, 0, 1664, 1665, 5,
		5, 0, 0, 1665, 1667, 3, 140, 70, 0, 1666, 1664, 1, 0, 0, 0, 1667, 1670, 1, 0, 0, 0, 1668, 1666,
		1, 0, 0, 0, 1668, 1669, 1, 0, 0, 0, 1669, 1672, 1, 0, 0, 0, 1670, 1668, 1, 0, 0, 0, 1671, 1673,
		3, 124, 62, 0, 1672, 1671, 1, 0, 0, 0, 1672, 1673, 1, 0, 0, 0, 1673, 1674, 1, 0, 0, 0, 1674, 1675,
		5, 4, 0, 0, 1675, 121, 1, 0, 0, 0, 1676, 1710, 5, 152, 0, 0, 1677, 1711, 3, 210, 105, 0, 1678,
		1680, 5, 3, 0, 0, 1679, 1681, 3, 216, 108, 0, 1680, 1679, 1, 0, 0, 0, 1680, 1681, 1, 0, 0, 0,
		1681, 1692, 1, 0, 0, 0, 1682, 1683, 5, 153, 0, 0, 1683, 1684, 5, 40, 0, 0, 1684, 1689, 3, 64,
		32, 0, 1685, 1686, 5, 5, 0, 0, 1686, 1688, 3, 64, 32, 0, 1687, 1685, 1, 0, 0, 0, 1688, 1691,
		1, 0, 0, 0, 1689, 1687, 1, 0, 0, 0, 1689, 1690, 1, 0, 0, 0, 1690, 1693, 1, 0, 0, 0, 1691, 1689,
		1, 0, 0, 0, 1692, 1682, 1, 0, 0, 0, 1692, 1693, 1, 0, 0, 0, 1693, 1704, 1, 0, 0, 0, 1694, 1695,
		5, 109, 0, 0, 1695, 1696, 5, 40, 0, 0, 1696, 1701, 3, 140, 70, 0, 1697, 1698, 5, 5, 0, 0, 1698,
		1700, 3, 140, 70, 0, 1699, 1697, 1, 0, 0, 0, 1700, 1703, 1, 0, 0, 0, 1701, 1699, 1, 0, 0, 0, 1701,
		1702, 1, 0, 0, 0, 1702, 1705, 1, 0, 0, 0, 1703, 1701, 1, 0, 0, 0, 1704, 1694, 1, 0, 0, 0, 1704,
		1705, 1, 0, 0, 0, 1705, 1707, 1, 0, 0, 0, 1706, 1708, 3, 124, 62, 0, 1707, 1706, 1, 0, 0, 0, 1707,
		1708, 1, 0, 0, 0, 1708, 1709, 1, 0, 0, 0, 1709, 1711, 5, 4, 0, 0, 1710, 1677, 1, 0, 0, 0, 1710,
		1678, 1, 0, 0, 0, 1711, 123, 1, 0, 0, 0, 1712, 1722, 3, 126, 63, 0, 1713, 1720, 5, 180, 0, 0,
		1714, 1715, 5, 101, 0, 0, 1715, 1721, 5, 182, 0, 0, 1716, 1717, 5, 157, 0, 0, 1717, 1721, 5,
		127, 0, 0, 1718, 1721, 5, 78, 0, 0, 1719, 1721, 5, 181, 0, 0, 1720, 1714, 1, 0, 0, 0, 1720, 1716,
		1, 0, 0, 0, 1720, 1718, 1, 0, 0, 0, 1720, 1719, 1, 0, 0, 0, 1721, 1723, 1, 0, 0, 0, 1722, 1713,
		1, 0, 0, 0, 1722, 1723, 1, 0, 0, 0, 1723, 125, 1, 0, 0, 0, 1724, 1731, 7, 18, 0, 0, 1725, 1732,
		3, 148, 74, 0, 1726, 1727, 5, 39, 0, 0, 1727, 1728, 3, 144, 72, 0, 1728, 1729, 5, 32, 0, 0, 1729,
		1730, 3, 146, 73, 0, 1730, 1732, 1, 0, 0, 0, 1731, 1725, 1, 0, 0, 0, 1731, 1726, 1, 0, 0, 0, 1732,
		127, 1, 0, 0, 0, 1733, 1734, 3, 218, 109, 0, 1734, 1744, 5, 3, 0, 0, 1735, 1740, 3, 64, 32, 0,
		1736, 1737, 5, 5, 0, 0, 1737, 1739, 3, 64, 32, 0, 1738, 1736, 1, 0, 0, 0, 1739, 1742, 1, 0, 0,
		0, 1740, 1738, 1, 0, 0, 0, 1740, 1741, 1, 0, 0, 0, 1741, 1745, 1, 0, 0, 0, 1742, 1740, 1, 0, 0,
		0, 1743, 1745, 5, 7, 0, 0, 1744, 1735, 1, 0, 0, 0, 1744, 1743, 1, 0, 0, 0, 1745, 1746, 1, 0, 0,
		0, 1746, 1747, 5, 4, 0, 0, 1747, 129, 1, 0, 0, 0, 1748, 1749, 3, 220, 110, 0, 1749, 1762, 5,
		3, 0, 0, 1750, 1752, 5, 62, 0, 0, 1751, 1750, 1, 0, 0, 0, 1751, 1752, 1, 0, 0, 0, 1752, 1753,
		1, 0, 0, 0, 1753, 1758, 3, 64, 32, 0, 1754, 1755, 5, 5, 0, 0, 1755, 1757, 3, 64, 32, 0, 1756,
		1754, 1, 0, 0, 0, 1757, 1760, 1, 0, 0, 0, 1758, 1756, 1, 0, 0, 0, 1758, 1759, 1, 0, 0, 0, 1759,
		1763, 1, 0, 0, 0, 1760, 1758, 1, 0, 0, 0, 1761, 1763, 5, 7, 0, 0, 1762, 1751, 1, 0, 0, 0, 1762,
		1761, 1, 0, 0, 0, 1762, 1763, 1, 0, 0, 0, 1763, 1764, 1, 0, 0, 0, 1764, 1766, 5, 4, 0, 0, 1765,
		1767, 3, 118, 59, 0, 1766, 1765, 1, 0, 0, 0, 1766, 1767, 1, 0, 0, 0, 1767, 131, 1, 0, 0, 0, 1768,
		1769, 3, 150, 75, 0, 1769, 1779, 5, 3, 0, 0, 1770, 1775, 3, 64, 32, 0, 1771, 1772, 5, 5, 0, 0,
		1772, 1774, 3, 64, 32, 0, 1773, 1771, 1, 0, 0, 0, 1774, 1777, 1, 0, 0, 0, 1775, 1773, 1, 0, 0,
		0, 1775, 1776, 1, 0, 0, 0, 1776, 1780, 1, 0, 0, 0, 1777, 1775, 1, 0, 0, 0, 1778, 1780, 5, 7, 0,
		0, 1779, 1770, 1, 0, 0, 0, 1779, 1778, 1, 0, 0, 0, 1779, 1780, 1, 0, 0, 0, 1780, 1781, 1, 0, 0,
		0, 1781, 1783, 5, 4, 0, 0, 1782, 1784, 3, 118, 59, 0, 1783, 1782, 1, 0, 0, 0, 1783, 1784, 1,
		0, 0, 0, 1784, 1785, 1, 0, 0, 0, 1785, 1788, 5, 152, 0, 0, 1786, 1789, 3, 120, 60, 0, 1787, 1789,
		3, 210, 105, 0, 1788, 1786, 1, 0, 0, 0, 1788, 1787, 1, 0, 0, 0, 1789, 133, 1, 0, 0, 0, 1790, 1792,
		5, 149, 0, 0, 1791, 1793, 5, 116, 0, 0, 1792, 1791, 1, 0, 0, 0, 1792, 1793, 1, 0, 0, 0, 1793,
		1794, 1, 0, 0, 0, 1794, 1799, 3, 54, 27, 0, 1795, 1796, 5, 5, 0, 0, 1796, 1798, 3, 54, 27, 0,
		1797, 1795, 1, 0, 0, 0, 1798, 1801, 1, 0, 0, 0, 1799, 1797, 1, 0, 0, 0, 1799, 1800, 1, 0, 0, 0,
		1800, 135, 1, 0, 0, 0, 1801, 1799, 1, 0, 0, 0, 1802, 1803, 5, 109, 0, 0, 1803, 1804, 5, 40, 0,
		0, 1804, 1809, 3, 140, 70, 0, 1805, 1806, 5, 5, 0, 0, 1806, 1808, 3, 140, 70, 0, 1807, 1805,
		1, 0, 0, 0, 1808, 1811, 1, 0, 0, 0, 1809, 1807, 1, 0, 0, 0, 1809, 1810, 1, 0, 0, 0, 1810, 137,
		1, 0, 0, 0, 1811, 1809, 1, 0, 0, 0, 1812, 1813, 5, 98, 0, 0, 1813, 1816, 3, 64, 32, 0, 1814, 1815,
		7, 19, 0, 0, 1815, 1817, 3, 64, 32, 0, 1816, 1814, 1, 0, 0, 0, 1816, 1817, 1, 0, 0, 0, 1817, 139,
		1, 0, 0, 0, 1818, 1821, 3, 64, 32, 0, 1819, 1820, 5, 45, 0, 0, 1820, 1822, 3, 190, 95, 0, 1821,
		1819, 1, 0, 0, 0, 1821, 1822, 1, 0, 0, 0, 1822, 1824, 1, 0, 0, 0, 1823, 1825, 3, 142, 71, 0, 1824,
		1823, 1, 0, 0, 0, 1824, 1825, 1, 0, 0, 0, 1825, 1828, 1, 0, 0, 0, 1826, 1827, 5, 175, 0, 0, 1827,
		1829, 7, 20, 0, 0, 1828, 1826, 1, 0, 0, 0, 1828, 1829, 1, 0, 0, 0, 1829, 141, 1, 0, 0, 0, 1830,
		1831, 7, 21, 0, 0, 1831, 143, 1, 0, 0, 0, 1832, 1833, 3, 64, 32, 0, 1833, 1834, 5, 155, 0, 0,
		1834, 1843, 1, 0, 0, 0, 1835, 1836, 3, 64, 32, 0, 1836, 1837, 5, 158, 0, 0, 1837, 1843, 1, 0,
		0, 0, 1838, 1839, 5, 157, 0, 0, 1839, 1843, 5, 127, 0, 0, 1840, 1841, 5, 156, 0, 0, 1841, 1843,
		5, 155, 0, 0, 1842, 1832, 1, 0, 0, 0, 1842, 1835, 1, 0, 0, 0, 1842, 1838, 1, 0, 0, 0, 1842, 1840,
		1, 0, 0, 0, 1843, 145, 1, 0, 0, 0, 1844, 1845, 3, 64, 32, 0, 1845, 1846, 5, 155, 0, 0, 1846, 1855,
		1, 0, 0, 0, 1847, 1848, 3, 64, 32, 0, 1848, 1849, 5, 158, 0, 0, 1849, 1855, 1, 0, 0, 0, 1850,
		1851, 5, 157, 0, 0, 1851, 1855, 5, 127, 0, 0, 1852, 1853, 5, 156, 0, 0, 1853, 1855, 5, 158,
		0, 0, 1854, 1844, 1, 0, 0, 0, 1854, 1847, 1, 0, 0, 0, 1854, 1850, 1, 0, 0, 0, 1854, 1852, 1, 0,
		0, 0, 1855, 147, 1, 0, 0, 0, 1856, 1857, 3, 64, 32, 0, 1857, 1858, 5, 155, 0, 0, 1858, 1864,
		1, 0, 0, 0, 1859, 1860, 5, 156, 0, 0, 1860, 1864, 5, 155, 0, 0, 1861, 1862, 5, 157, 0, 0, 1862,
		1864, 5, 127, 0, 0, 1863, 1856, 1, 0, 0, 0, 1863, 1859, 1, 0, 0, 0, 1863, 1861, 1, 0, 0, 0, 1864,
		149, 1, 0, 0, 0, 1865, 1866, 7, 22, 0, 0, 1866, 1867, 5, 3, 0, 0, 1867, 1868, 3, 64, 32, 0, 1868,
		1869, 5, 4, 0, 0, 1869, 1870, 5, 152, 0, 0, 1870, 1872, 5, 3, 0, 0, 1871, 1873, 3, 156, 78, 0,
		1872, 1871, 1, 0, 0, 0, 1872, 1873, 1, 0, 0, 0, 1873, 1874, 1, 0, 0, 0, 1874, 1876, 3, 160, 80,
		0, 1875, 1877, 3, 126, 63, 0, 1876, 1875, 1, 0, 0, 0, 1876, 1877, 1, 0, 0, 0, 1877, 1878, 1,
		0, 0, 0, 1878, 1879, 5, 4, 0, 0, 1879, 1951, 1, 0, 0, 0, 1880, 1881, 7, 23, 0, 0, 1881, 1882,
		5, 3, 0, 0, 1882, 1883, 5, 4, 0, 0, 1883, 1884, 5, 152, 0, 0, 1884, 1886, 5, 3, 0, 0, 1885, 1887,
		3, 156, 78, 0, 1886, 1885, 1, 0, 0, 0, 1886, 1887, 1, 0, 0, 0, 1887, 1889, 1, 0, 0, 0, 1888, 1890,
		3, 158, 79, 0, 1889, 1888, 1, 0, 0, 0, 1889, 1890, 1, 0, 0, 0, 1890, 1891, 1, 0, 0, 0, 1891, 1951,
		5, 4, 0, 0, 1892, 1893, 7, 24, 0, 0, 1893, 1894, 5, 3, 0, 0, 1894, 1895, 5, 4, 0, 0, 1895, 1896,
		5, 152, 0, 0, 1896, 1898, 5, 3, 0, 0, 1897, 1899, 3, 156, 78, 0, 1898, 1897, 1, 0, 0, 0, 1898,
		1899, 1, 0, 0, 0, 1899, 1900, 1, 0, 0, 0, 1900, 1901, 3, 160, 80, 0, 1901, 1902, 5, 4, 0, 0, 1902,
		1951, 1, 0, 0, 0, 1903, 1904, 7, 25, 0, 0, 1904, 1905, 5, 3, 0, 0, 1905, 1907, 3, 64, 32, 0, 1906,
		1908, 3, 152, 76, 0, 1907, 1906, 1, 0, 0, 0, 1907, 1908, 1, 0, 0, 0, 1908, 1910, 1, 0, 0, 0, 1909,
		1911, 3, 154, 77, 0, 1910, 1909, 1, 0, 0, 0, 1910, 1911, 1, 0, 0, 0, 1911, 1912, 1, 0, 0, 0, 1912,
		1913, 5, 4, 0, 0, 1913, 1914, 5, 152, 0, 0, 1914, 1916, 5, 3, 0, 0, 1915, 1917, 3, 156, 78, 0,
		1916, 1915, 1, 0, 0, 0, 1916, 1917, 1, 0, 0, 0, 1917, 1918, 1, 0, 0, 0, 1918, 1919, 3, 160, 80,
		0, 1919, 1920, 5, 4, 0, 0, 1920, 1951, 1, 0, 0, 0, 1921, 1922, 5, 164, 0, 0, 1922, 1923, 5, 3,
		0, 0, 1923, 1924, 3, 64, 32, 0, 1924, 1925, 5, 5, 0, 0, 1925, 1926, 3, 34, 17, 0, 1926, 1927,
		5, 4, 0, 0, 1927, 1928, 5, 152, 0, 0, 1928, 1930, 5, 3, 0, 0, 1929, 1931, 3, 156, 78, 0, 1930,
		1929, 1, 0, 0, 0, 1930, 1931, 1, 0, 0, 0, 1931, 1932, 1, 0, 0, 0, 1932, 1934, 3, 160, 80, 0, 1933,
		1935, 3, 126, 63, 0, 1934, 1933, 1, 0, 0, 0, 1934, 1935, 1, 0, 0, 0, 1935, 1936, 1, 0, 0, 0, 1936,
		1937, 5, 4, 0, 0, 1937, 1951, 1, 0, 0, 0, 1938, 1939, 5, 165, 0, 0, 1939, 1940, 5, 3, 0, 0, 1940,
		1941, 3, 64, 32, 0, 1941, 1942, 5, 4, 0, 0, 1942, 1943, 5, 152, 0, 0, 1943, 1945, 5, 3, 0, 0,
		1944, 1946, 3, 156, 78, 0, 1945, 1944, 1, 0, 0, 0, 1945, 1946, 1, 0, 0, 0, 1946, 1947, 1, 0,
		0, 0, 1947, 1948, 3, 160, 80, 0, 1948, 1949, 5, 4, 0, 0, 1949, 1951, 1, 0, 0, 0, 1950, 1865,
		1, 0, 0, 0, 1950, 1880, 1, 0, 0, 0, 1950, 1892, 1, 0, 0, 0, 1950, 1903, 1, 0, 0, 0, 1950, 1921,
		1, 0, 0, 0, 1950, 1938, 1, 0, 0, 0, 1951, 151, 1, 0, 0, 0, 1952, 1953, 5, 5, 0, 0, 1953, 1954,
		3, 34, 17, 0, 1954, 153, 1, 0, 0, 0, 1955, 1956, 5, 5, 0, 0, 1956, 1957, 3, 34, 17, 0, 1957, 155,
		1, 0, 0, 0, 1958, 1959, 5, 153, 0, 0, 1959, 1961, 5, 40, 0, 0, 1960, 1962, 3, 64, 32, 0, 1961,
		1960, 1, 0, 0, 0, 1962, 1963, 1, 0, 0, 0, 1963, 1961, 1, 0, 0, 0, 1963, 1964, 1, 0, 0, 0, 1964,
		157, 1, 0, 0, 0, 1965, 1966, 5, 109, 0, 0, 1966, 1968, 5, 40, 0, 0, 1967, 1969, 3, 64, 32, 0,
		1968, 1967, 1, 0, 0, 0, 1969, 1970, 1, 0, 0, 0, 1970, 1968, 1, 0, 0, 0, 1970, 1971, 1, 0, 0, 0,
		1971, 159, 1, 0, 0, 0, 1972, 1973, 5, 109, 0, 0, 1973, 1974, 5, 40, 0, 0, 1974, 1975, 3, 162,
		81, 0, 1975, 161, 1, 0, 0, 0, 1976, 1978, 3, 64, 32, 0, 1977, 1979, 3, 142, 71, 0, 1978, 1977,
		1, 0, 0, 0, 1978, 1979, 1, 0, 0, 0, 1979, 1987, 1, 0, 0, 0, 1980, 1981, 5, 5, 0, 0, 1981, 1983,
		3, 64, 32, 0, 1982, 1984, 3, 142, 71, 0, 1983, 1982, 1, 0, 0, 0, 1983, 1984, 1, 0, 0, 0, 1984,
		1986, 1, 0, 0, 0, 1985, 1980, 1, 0, 0, 0, 1986, 1989, 1, 0, 0, 0, 1987, 1985, 1, 0, 0, 0, 1987,
		1988, 1, 0, 0, 0, 1988, 163, 1, 0, 0, 0, 1989, 1987, 1, 0, 0, 0, 1990, 1991, 3, 86, 43, 0, 1991,
		165, 1, 0, 0, 0, 1992, 1993, 3, 86, 43, 0, 1993, 167, 1, 0, 0, 0, 1994, 1995, 7, 26, 0, 0, 1995,
		169, 1, 0, 0, 0, 1996, 1997, 5, 188, 0, 0, 1997, 171, 1, 0, 0, 0, 1998, 2001, 3, 64, 32, 0, 1999,
		2001, 3, 28, 14, 0, 2000, 1998, 1, 0, 0, 0, 2000, 1999, 1, 0, 0, 0, 2001, 173, 1, 0, 0, 0, 2002,
		2003, 7, 27, 0, 0, 2003, 175, 1, 0, 0, 0, 2004, 2005, 7, 28, 0, 0, 2005, 177, 1, 0, 0, 0, 2006,
		2007, 3, 224, 112, 0, 2007, 179, 1, 0, 0, 0, 2008, 2009, 3, 224, 112, 0, 2009, 181, 1, 0, 0,
		0, 2010, 2011, 3, 224, 112, 0, 2011, 183, 1, 0, 0, 0, 2012, 2013, 3, 224, 112, 0, 2013, 185,
		1, 0, 0, 0, 2014, 2015, 3, 224, 112, 0, 2015, 187, 1, 0, 0, 0, 2016, 2017, 3, 224, 112, 0, 2017,
		189, 1, 0, 0, 0, 2018, 2019, 3, 224, 112, 0, 2019, 191, 1, 0, 0, 0, 2020, 2021, 3, 224, 112,
		0, 2021, 193, 1, 0, 0, 0, 2022, 2023, 3, 224, 112, 0, 2023, 195, 1, 0, 0, 0, 2024, 2025, 3, 224,
		112, 0, 2025, 197, 1, 0, 0, 0, 2026, 2027, 3, 224, 112, 0, 2027, 199, 1, 0, 0, 0, 2028, 2029,
		3, 224, 112, 0, 2029, 201, 1, 0, 0, 0, 2030, 2031, 3, 224, 112, 0, 2031, 203, 1, 0, 0, 0, 2032,
		2033, 3, 224, 112, 0, 2033, 205, 1, 0, 0, 0, 2034, 2035, 3, 224, 112, 0, 2035, 207, 1, 0, 0,
		0, 2036, 2037, 3, 224, 112, 0, 2037, 209, 1, 0, 0, 0, 2038, 2039, 3, 224, 112, 0, 2039, 211,
		1, 0, 0, 0, 2040, 2041, 3, 224, 112, 0, 2041, 213, 1, 0, 0, 0, 2042, 2043, 3, 224, 112, 0, 2043,
		215, 1, 0, 0, 0, 2044, 2045, 3, 224, 112, 0, 2045, 217, 1, 0, 0, 0, 2046, 2047, 3, 224, 112,
		0, 2047, 219, 1, 0, 0, 0, 2048, 2049, 3, 224, 112, 0, 2049, 221, 1, 0, 0, 0, 2050, 2051, 3, 224,
		112, 0, 2051, 223, 1, 0, 0, 0, 2052, 2060, 5, 185, 0, 0, 2053, 2060, 3, 176, 88, 0, 2054, 2060,
		5, 188, 0, 0, 2055, 2056, 5, 3, 0, 0, 2056, 2057, 3, 224, 112, 0, 2057, 2058, 5, 4, 0, 0, 2058,
		2060, 1, 0, 0, 0, 2059, 2052, 1, 0, 0, 0, 2059, 2053, 1, 0, 0, 0, 2059, 2054, 1, 0, 0, 0, 2059,
		2055, 1, 0, 0, 0, 2060, 225, 1, 0, 0, 0, 297, 229, 237, 244, 249, 255, 261, 263, 289, 296, 303,
		309, 313, 318, 321, 328, 331, 335, 343, 347, 349, 353, 357, 361, 364, 371, 377, 383, 388,
		399, 405, 409, 413, 416, 420, 426, 431, 440, 447, 453, 457, 461, 466, 472, 484, 488, 493,
		496, 499, 502, 506, 509, 523, 530, 537, 539, 542, 548, 553, 561, 566, 581, 587, 597, 602,
		612, 616, 618, 622, 627, 629, 637, 643, 648, 655, 666, 669, 671, 678, 682, 689, 695, 701,
		707, 712, 721, 726, 737, 742, 753, 758, 762, 778, 788, 793, 801, 813, 818, 826, 833, 836,
		839, 846, 849, 852, 855, 859, 867, 872, 882, 887, 896, 903, 907, 911, 914, 922, 935, 938,
		946, 955, 959, 964, 991, 1000, 1012, 1017, 1029, 1035, 1042, 1046, 1056, 1059, 1065, 1071,
		1080, 1083, 1087, 1089, 1091, 1100, 1112, 1123, 1127, 1134, 1140, 1145, 1153, 1158, 1162,
		1165, 1169, 1172, 1180, 1191, 1197, 1199, 1207, 1214, 1221, 1226, 1228, 1234, 1243, 1248,
		1255, 1259, 1261, 1264, 1272, 1276, 1279, 1285, 1289, 1294, 1301, 1310, 1314, 1316, 1320,
		1329, 1334, 1336, 1349, 1352, 1355, 1360, 1364, 1367, 1370, 1375, 1379, 1384, 1387, 1390,
		1395, 1399, 1402, 1409, 1414, 1423, 1428, 1431, 1439, 1443, 1451, 1454, 1456, 1465, 1468,
		1470, 1474, 1478, 1482, 1485, 1496, 1501, 1505, 1509, 1512, 1517, 1523, 1530, 1537, 1546,
		1550, 1552, 1556, 1559, 1567, 1573, 1578, 1584, 1591, 1598, 1603, 1606, 1609, 1612, 1617,
		1622, 1629, 1633, 1637, 1647, 1656, 1659, 1668, 1672, 1680, 1689, 1692, 1701, 1704, 1707,
		1710, 1720, 1722, 1731, 1740, 1744, 1751, 1758, 1762, 1766, 1775, 1779, 1783, 1788, 1792,
		1799, 1809, 1816, 1821, 1824, 1828, 1842, 1854, 1863, 1872, 1876, 1886, 1889, 1898, 1907,
		1910, 1916, 1930, 1934, 1945, 1950, 1963, 1970, 1978, 1983, 1987, 2000, 2059];

	private static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SQLiteParser.__ATN) {
			SQLiteParser.__ATN = new ATNDeserializer().deserialize(SQLiteParser._serializedATN);
		}

		return SQLiteParser.__ATN;
	}


	static DecisionsToDFA = SQLiteParser._ATN.decisionToState.map((ds: DecisionState, index: number) => new DFA(ds, index));

}

export class ParseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public EOF(): TerminalNode {
		return this.getToken(SQLiteParser.EOF, 0);
	}
	public sql_stmt_list_list(): Sql_stmt_listContext[] {
		return this.getTypedRuleContexts(Sql_stmt_listContext) as Sql_stmt_listContext[];
	}
	public sql_stmt_list(i: number): Sql_stmt_listContext {
		return this.getTypedRuleContext(Sql_stmt_listContext, i) as Sql_stmt_listContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_parse;
	}
}


export class Sql_stmt_listContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public sql_stmt_list(): Sql_stmtContext[] {
		return this.getTypedRuleContexts(Sql_stmtContext) as Sql_stmtContext[];
	}
	public sql_stmt(i: number): Sql_stmtContext {
		return this.getTypedRuleContext(Sql_stmtContext, i) as Sql_stmtContext;
	}
	public SCOL_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.SCOL);
	}
	public SCOL(i: number): TerminalNode {
		return this.getToken(SQLiteParser.SCOL, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_sql_stmt_list;
	}
}


export class Sql_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public alter_table_stmt(): Alter_table_stmtContext {
		return this.getTypedRuleContext(Alter_table_stmtContext, 0) as Alter_table_stmtContext;
	}
	public analyze_stmt(): Analyze_stmtContext {
		return this.getTypedRuleContext(Analyze_stmtContext, 0) as Analyze_stmtContext;
	}
	public attach_stmt(): Attach_stmtContext {
		return this.getTypedRuleContext(Attach_stmtContext, 0) as Attach_stmtContext;
	}
	public begin_stmt(): Begin_stmtContext {
		return this.getTypedRuleContext(Begin_stmtContext, 0) as Begin_stmtContext;
	}
	public commit_stmt(): Commit_stmtContext {
		return this.getTypedRuleContext(Commit_stmtContext, 0) as Commit_stmtContext;
	}
	public create_index_stmt(): Create_index_stmtContext {
		return this.getTypedRuleContext(Create_index_stmtContext, 0) as Create_index_stmtContext;
	}
	public create_table_stmt(): Create_table_stmtContext {
		return this.getTypedRuleContext(Create_table_stmtContext, 0) as Create_table_stmtContext;
	}
	public create_trigger_stmt(): Create_trigger_stmtContext {
		return this.getTypedRuleContext(Create_trigger_stmtContext, 0) as Create_trigger_stmtContext;
	}
	public create_view_stmt(): Create_view_stmtContext {
		return this.getTypedRuleContext(Create_view_stmtContext, 0) as Create_view_stmtContext;
	}
	public create_virtual_table_stmt(): Create_virtual_table_stmtContext {
		return this.getTypedRuleContext(Create_virtual_table_stmtContext, 0) as Create_virtual_table_stmtContext;
	}
	public delete_stmt(): Delete_stmtContext {
		return this.getTypedRuleContext(Delete_stmtContext, 0) as Delete_stmtContext;
	}
	public delete_stmt_limited(): Delete_stmt_limitedContext {
		return this.getTypedRuleContext(Delete_stmt_limitedContext, 0) as Delete_stmt_limitedContext;
	}
	public detach_stmt(): Detach_stmtContext {
		return this.getTypedRuleContext(Detach_stmtContext, 0) as Detach_stmtContext;
	}
	public drop_stmt(): Drop_stmtContext {
		return this.getTypedRuleContext(Drop_stmtContext, 0) as Drop_stmtContext;
	}
	public insert_stmt(): Insert_stmtContext {
		return this.getTypedRuleContext(Insert_stmtContext, 0) as Insert_stmtContext;
	}
	public pragma_stmt(): Pragma_stmtContext {
		return this.getTypedRuleContext(Pragma_stmtContext, 0) as Pragma_stmtContext;
	}
	public reindex_stmt(): Reindex_stmtContext {
		return this.getTypedRuleContext(Reindex_stmtContext, 0) as Reindex_stmtContext;
	}
	public release_stmt(): Release_stmtContext {
		return this.getTypedRuleContext(Release_stmtContext, 0) as Release_stmtContext;
	}
	public rollback_stmt(): Rollback_stmtContext {
		return this.getTypedRuleContext(Rollback_stmtContext, 0) as Rollback_stmtContext;
	}
	public savepoint_stmt(): Savepoint_stmtContext {
		return this.getTypedRuleContext(Savepoint_stmtContext, 0) as Savepoint_stmtContext;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public update_stmt(): Update_stmtContext {
		return this.getTypedRuleContext(Update_stmtContext, 0) as Update_stmtContext;
	}
	public update_stmt_limited(): Update_stmt_limitedContext {
		return this.getTypedRuleContext(Update_stmt_limitedContext, 0) as Update_stmt_limitedContext;
	}
	public vacuum_stmt(): Vacuum_stmtContext {
		return this.getTypedRuleContext(Vacuum_stmtContext, 0) as Vacuum_stmtContext;
	}
	public EXPLAIN_(): TerminalNode {
		return this.getToken(SQLiteParser.EXPLAIN_, 0);
	}
	public QUERY_(): TerminalNode {
		return this.getToken(SQLiteParser.QUERY_, 0);
	}
	public PLAN_(): TerminalNode {
		return this.getToken(SQLiteParser.PLAN_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_sql_stmt;
	}
}


export class Alter_table_stmtContext extends ParserRuleContext {
	public _new_table_name!: Table_nameContext;
	public _old_column_name!: Column_nameContext;
	public _new_column_name!: Column_nameContext;
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ALTER_(): TerminalNode {
		return this.getToken(SQLiteParser.ALTER_, 0);
	}
	public TABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.TABLE_, 0);
	}
	public table_name_list(): Table_nameContext[] {
		return this.getTypedRuleContexts(Table_nameContext) as Table_nameContext[];
	}
	public table_name(i: number): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, i) as Table_nameContext;
	}
	public RENAME_(): TerminalNode {
		return this.getToken(SQLiteParser.RENAME_, 0);
	}
	public ADD_(): TerminalNode {
		return this.getToken(SQLiteParser.ADD_, 0);
	}
	public column_def(): Column_defContext {
		return this.getTypedRuleContext(Column_defContext, 0) as Column_defContext;
	}
	public DROP_(): TerminalNode {
		return this.getToken(SQLiteParser.DROP_, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public TO_(): TerminalNode {
		return this.getToken(SQLiteParser.TO_, 0);
	}
	public COLUMN_(): TerminalNode {
		return this.getToken(SQLiteParser.COLUMN_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_alter_table_stmt;
	}
}


export class Analyze_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ANALYZE_(): TerminalNode {
		return this.getToken(SQLiteParser.ANALYZE_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public table_or_index_name(): Table_or_index_nameContext {
		return this.getTypedRuleContext(Table_or_index_nameContext, 0) as Table_or_index_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_analyze_stmt;
	}
}


export class Attach_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ATTACH_(): TerminalNode {
		return this.getToken(SQLiteParser.ATTACH_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DATABASE_(): TerminalNode {
		return this.getToken(SQLiteParser.DATABASE_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_attach_stmt;
	}
}


export class Begin_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public BEGIN_(): TerminalNode {
		return this.getToken(SQLiteParser.BEGIN_, 0);
	}
	public TRANSACTION_(): TerminalNode {
		return this.getToken(SQLiteParser.TRANSACTION_, 0);
	}
	public DEFERRED_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFERRED_, 0);
	}
	public IMMEDIATE_(): TerminalNode {
		return this.getToken(SQLiteParser.IMMEDIATE_, 0);
	}
	public EXCLUSIVE_(): TerminalNode {
		return this.getToken(SQLiteParser.EXCLUSIVE_, 0);
	}
	public transaction_name(): Transaction_nameContext {
		return this.getTypedRuleContext(Transaction_nameContext, 0) as Transaction_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_begin_stmt;
	}
}


export class Commit_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public COMMIT_(): TerminalNode {
		return this.getToken(SQLiteParser.COMMIT_, 0);
	}
	public END_(): TerminalNode {
		return this.getToken(SQLiteParser.END_, 0);
	}
	public TRANSACTION_(): TerminalNode {
		return this.getToken(SQLiteParser.TRANSACTION_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_commit_stmt;
	}
}


export class Rollback_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public TRANSACTION_(): TerminalNode {
		return this.getToken(SQLiteParser.TRANSACTION_, 0);
	}
	public TO_(): TerminalNode {
		return this.getToken(SQLiteParser.TO_, 0);
	}
	public savepoint_name(): Savepoint_nameContext {
		return this.getTypedRuleContext(Savepoint_nameContext, 0) as Savepoint_nameContext;
	}
	public SAVEPOINT_(): TerminalNode {
		return this.getToken(SQLiteParser.SAVEPOINT_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_rollback_stmt;
	}
}


export class Savepoint_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public SAVEPOINT_(): TerminalNode {
		return this.getToken(SQLiteParser.SAVEPOINT_, 0);
	}
	public savepoint_name(): Savepoint_nameContext {
		return this.getTypedRuleContext(Savepoint_nameContext, 0) as Savepoint_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_savepoint_stmt;
	}
}


export class Release_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public RELEASE_(): TerminalNode {
		return this.getToken(SQLiteParser.RELEASE_, 0);
	}
	public savepoint_name(): Savepoint_nameContext {
		return this.getTypedRuleContext(Savepoint_nameContext, 0) as Savepoint_nameContext;
	}
	public SAVEPOINT_(): TerminalNode {
		return this.getToken(SQLiteParser.SAVEPOINT_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_release_stmt;
	}
}


export class Create_index_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public CREATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CREATE_, 0);
	}
	public INDEX_(): TerminalNode {
		return this.getToken(SQLiteParser.INDEX_, 0);
	}
	public index_name(): Index_nameContext {
		return this.getTypedRuleContext(Index_nameContext, 0) as Index_nameContext;
	}
	public ON_(): TerminalNode {
		return this.getToken(SQLiteParser.ON_, 0);
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public indexed_column_list(): Indexed_columnContext[] {
		return this.getTypedRuleContexts(Indexed_columnContext) as Indexed_columnContext[];
	}
	public indexed_column(i: number): Indexed_columnContext {
		return this.getTypedRuleContext(Indexed_columnContext, i) as Indexed_columnContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public UNIQUE_(): TerminalNode {
		return this.getToken(SQLiteParser.UNIQUE_, 0);
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_create_index_stmt;
	}
}


export class Indexed_columnContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public column_name(): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, 0) as Column_nameContext;
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public COLLATE_(): TerminalNode {
		return this.getToken(SQLiteParser.COLLATE_, 0);
	}
	public collation_name(): Collation_nameContext {
		return this.getTypedRuleContext(Collation_nameContext, 0) as Collation_nameContext;
	}
	public asc_desc(): Asc_descContext {
		return this.getTypedRuleContext(Asc_descContext, 0) as Asc_descContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_indexed_column;
	}
}


export class Create_table_stmtContext extends ParserRuleContext {
	public _row_ROW_ID!: Token;
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public CREATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CREATE_, 0);
	}
	public TABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.TABLE_, 0);
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_def_list(): Column_defContext[] {
		return this.getTypedRuleContexts(Column_defContext) as Column_defContext[];
	}
	public column_def(i: number): Column_defContext {
		return this.getTypedRuleContext(Column_defContext, i) as Column_defContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public TEMP_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMP_, 0);
	}
	public TEMPORARY_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMPORARY_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public table_constraint_list(): Table_constraintContext[] {
		return this.getTypedRuleContexts(Table_constraintContext) as Table_constraintContext[];
	}
	public table_constraint(i: number): Table_constraintContext {
		return this.getTypedRuleContext(Table_constraintContext, i) as Table_constraintContext;
	}
	public WITHOUT_(): TerminalNode {
		return this.getToken(SQLiteParser.WITHOUT_, 0);
	}
	public IDENTIFIER(): TerminalNode {
		return this.getToken(SQLiteParser.IDENTIFIER, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_create_table_stmt;
	}
}


export class Column_defContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public column_name(): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, 0) as Column_nameContext;
	}
	public type_name(): Type_nameContext {
		return this.getTypedRuleContext(Type_nameContext, 0) as Type_nameContext;
	}
	public column_constraint_list(): Column_constraintContext[] {
		return this.getTypedRuleContexts(Column_constraintContext) as Column_constraintContext[];
	}
	public column_constraint(i: number): Column_constraintContext {
		return this.getTypedRuleContext(Column_constraintContext, i) as Column_constraintContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_column_def;
	}
}


export class Type_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public name_list(): NameContext[] {
		return this.getTypedRuleContexts(NameContext) as NameContext[];
	}
	public name(i: number): NameContext {
		return this.getTypedRuleContext(NameContext, i) as NameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public signed_number_list(): Signed_numberContext[] {
		return this.getTypedRuleContexts(Signed_numberContext) as Signed_numberContext[];
	}
	public signed_number(i: number): Signed_numberContext {
		return this.getTypedRuleContext(Signed_numberContext, i) as Signed_numberContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_type_name;
	}
}


export class Column_constraintContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public CHECK_(): TerminalNode {
		return this.getToken(SQLiteParser.CHECK_, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public DEFAULT_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFAULT_, 0);
	}
	public COLLATE_(): TerminalNode {
		return this.getToken(SQLiteParser.COLLATE_, 0);
	}
	public collation_name(): Collation_nameContext {
		return this.getTypedRuleContext(Collation_nameContext, 0) as Collation_nameContext;
	}
	public foreign_key_clause(): Foreign_key_clauseContext {
		return this.getTypedRuleContext(Foreign_key_clauseContext, 0) as Foreign_key_clauseContext;
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public CONSTRAINT_(): TerminalNode {
		return this.getToken(SQLiteParser.CONSTRAINT_, 0);
	}
	public name(): NameContext {
		return this.getTypedRuleContext(NameContext, 0) as NameContext;
	}
	public PRIMARY_(): TerminalNode {
		return this.getToken(SQLiteParser.PRIMARY_, 0);
	}
	public KEY_(): TerminalNode {
		return this.getToken(SQLiteParser.KEY_, 0);
	}
	public NULL_(): TerminalNode {
		return this.getToken(SQLiteParser.NULL_, 0);
	}
	public UNIQUE_(): TerminalNode {
		return this.getToken(SQLiteParser.UNIQUE_, 0);
	}
	public signed_number(): Signed_numberContext {
		return this.getTypedRuleContext(Signed_numberContext, 0) as Signed_numberContext;
	}
	public literal_value(): Literal_valueContext {
		return this.getTypedRuleContext(Literal_valueContext, 0) as Literal_valueContext;
	}
	public conflict_clause(): Conflict_clauseContext {
		return this.getTypedRuleContext(Conflict_clauseContext, 0) as Conflict_clauseContext;
	}
	public GENERATED_(): TerminalNode {
		return this.getToken(SQLiteParser.GENERATED_, 0);
	}
	public ALWAYS_(): TerminalNode {
		return this.getToken(SQLiteParser.ALWAYS_, 0);
	}
	public STORED_(): TerminalNode {
		return this.getToken(SQLiteParser.STORED_, 0);
	}
	public VIRTUAL_(): TerminalNode {
		return this.getToken(SQLiteParser.VIRTUAL_, 0);
	}
	public asc_desc(): Asc_descContext {
		return this.getTypedRuleContext(Asc_descContext, 0) as Asc_descContext;
	}
	public AUTOINCREMENT_(): TerminalNode {
		return this.getToken(SQLiteParser.AUTOINCREMENT_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_column_constraint;
	}
}


export class Signed_numberContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public NUMERIC_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.NUMERIC_LITERAL, 0);
	}
	public PLUS(): TerminalNode {
		return this.getToken(SQLiteParser.PLUS, 0);
	}
	public MINUS(): TerminalNode {
		return this.getToken(SQLiteParser.MINUS, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_signed_number;
	}
}


export class Table_constraintContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public indexed_column_list(): Indexed_columnContext[] {
		return this.getTypedRuleContexts(Indexed_columnContext) as Indexed_columnContext[];
	}
	public indexed_column(i: number): Indexed_columnContext {
		return this.getTypedRuleContext(Indexed_columnContext, i) as Indexed_columnContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public CHECK_(): TerminalNode {
		return this.getToken(SQLiteParser.CHECK_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public FOREIGN_(): TerminalNode {
		return this.getToken(SQLiteParser.FOREIGN_, 0);
	}
	public KEY_(): TerminalNode {
		return this.getToken(SQLiteParser.KEY_, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public foreign_key_clause(): Foreign_key_clauseContext {
		return this.getTypedRuleContext(Foreign_key_clauseContext, 0) as Foreign_key_clauseContext;
	}
	public CONSTRAINT_(): TerminalNode {
		return this.getToken(SQLiteParser.CONSTRAINT_, 0);
	}
	public name(): NameContext {
		return this.getTypedRuleContext(NameContext, 0) as NameContext;
	}
	public PRIMARY_(): TerminalNode {
		return this.getToken(SQLiteParser.PRIMARY_, 0);
	}
	public UNIQUE_(): TerminalNode {
		return this.getToken(SQLiteParser.UNIQUE_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public conflict_clause(): Conflict_clauseContext {
		return this.getTypedRuleContext(Conflict_clauseContext, 0) as Conflict_clauseContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_table_constraint;
	}
}


export class Foreign_key_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public REFERENCES_(): TerminalNode {
		return this.getToken(SQLiteParser.REFERENCES_, 0);
	}
	public foreign_table(): Foreign_tableContext {
		return this.getTypedRuleContext(Foreign_tableContext, 0) as Foreign_tableContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public ON__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.ON_);
	}
	public ON_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.ON_, i);
	}
	public MATCH__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.MATCH_);
	}
	public MATCH_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.MATCH_, i);
	}
	public name_list(): NameContext[] {
		return this.getTypedRuleContexts(NameContext) as NameContext[];
	}
	public name(i: number): NameContext {
		return this.getTypedRuleContext(NameContext, i) as NameContext;
	}
	public DEFERRABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFERRABLE_, 0);
	}
	public DELETE__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.DELETE_);
	}
	public DELETE_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.DELETE_, i);
	}
	public UPDATE__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.UPDATE_);
	}
	public UPDATE_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.UPDATE_, i);
	}
	public SET__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.SET_);
	}
	public SET_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.SET_, i);
	}
	public CASCADE__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.CASCADE_);
	}
	public CASCADE_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.CASCADE_, i);
	}
	public RESTRICT__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.RESTRICT_);
	}
	public RESTRICT_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.RESTRICT_, i);
	}
	public NO__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.NO_);
	}
	public NO_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.NO_, i);
	}
	public ACTION__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.ACTION_);
	}
	public ACTION_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.ACTION_, i);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public NULL__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.NULL_);
	}
	public NULL_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.NULL_, i);
	}
	public DEFAULT__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.DEFAULT_);
	}
	public DEFAULT_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.DEFAULT_, i);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public INITIALLY_(): TerminalNode {
		return this.getToken(SQLiteParser.INITIALLY_, 0);
	}
	public DEFERRED_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFERRED_, 0);
	}
	public IMMEDIATE_(): TerminalNode {
		return this.getToken(SQLiteParser.IMMEDIATE_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_foreign_key_clause;
	}
}


export class Conflict_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ON_(): TerminalNode {
		return this.getToken(SQLiteParser.ON_, 0);
	}
	public CONFLICT_(): TerminalNode {
		return this.getToken(SQLiteParser.CONFLICT_, 0);
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public ABORT_(): TerminalNode {
		return this.getToken(SQLiteParser.ABORT_, 0);
	}
	public FAIL_(): TerminalNode {
		return this.getToken(SQLiteParser.FAIL_, 0);
	}
	public IGNORE_(): TerminalNode {
		return this.getToken(SQLiteParser.IGNORE_, 0);
	}
	public REPLACE_(): TerminalNode {
		return this.getToken(SQLiteParser.REPLACE_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_conflict_clause;
	}
}


export class Create_trigger_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public CREATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CREATE_, 0);
	}
	public TRIGGER_(): TerminalNode {
		return this.getToken(SQLiteParser.TRIGGER_, 0);
	}
	public trigger_name(): Trigger_nameContext {
		return this.getTypedRuleContext(Trigger_nameContext, 0) as Trigger_nameContext;
	}
	public ON_(): TerminalNode {
		return this.getToken(SQLiteParser.ON_, 0);
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public BEGIN_(): TerminalNode {
		return this.getToken(SQLiteParser.BEGIN_, 0);
	}
	public END_(): TerminalNode {
		return this.getToken(SQLiteParser.END_, 0);
	}
	public DELETE_(): TerminalNode {
		return this.getToken(SQLiteParser.DELETE_, 0);
	}
	public INSERT_(): TerminalNode {
		return this.getToken(SQLiteParser.INSERT_, 0);
	}
	public UPDATE_(): TerminalNode {
		return this.getToken(SQLiteParser.UPDATE_, 0);
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public BEFORE_(): TerminalNode {
		return this.getToken(SQLiteParser.BEFORE_, 0);
	}
	public AFTER_(): TerminalNode {
		return this.getToken(SQLiteParser.AFTER_, 0);
	}
	public INSTEAD_(): TerminalNode {
		return this.getToken(SQLiteParser.INSTEAD_, 0);
	}
	public OF__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.OF_);
	}
	public OF_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.OF_, i);
	}
	public FOR_(): TerminalNode {
		return this.getToken(SQLiteParser.FOR_, 0);
	}
	public EACH_(): TerminalNode {
		return this.getToken(SQLiteParser.EACH_, 0);
	}
	public ROW_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_, 0);
	}
	public WHEN_(): TerminalNode {
		return this.getToken(SQLiteParser.WHEN_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public SCOL_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.SCOL);
	}
	public SCOL(i: number): TerminalNode {
		return this.getToken(SQLiteParser.SCOL, i);
	}
	public TEMP_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMP_, 0);
	}
	public TEMPORARY_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMPORARY_, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public update_stmt_list(): Update_stmtContext[] {
		return this.getTypedRuleContexts(Update_stmtContext) as Update_stmtContext[];
	}
	public update_stmt(i: number): Update_stmtContext {
		return this.getTypedRuleContext(Update_stmtContext, i) as Update_stmtContext;
	}
	public insert_stmt_list(): Insert_stmtContext[] {
		return this.getTypedRuleContexts(Insert_stmtContext) as Insert_stmtContext[];
	}
	public insert_stmt(i: number): Insert_stmtContext {
		return this.getTypedRuleContext(Insert_stmtContext, i) as Insert_stmtContext;
	}
	public delete_stmt_list(): Delete_stmtContext[] {
		return this.getTypedRuleContexts(Delete_stmtContext) as Delete_stmtContext[];
	}
	public delete_stmt(i: number): Delete_stmtContext {
		return this.getTypedRuleContext(Delete_stmtContext, i) as Delete_stmtContext;
	}
	public select_stmt_list(): Select_stmtContext[] {
		return this.getTypedRuleContexts(Select_stmtContext) as Select_stmtContext[];
	}
	public select_stmt(i: number): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, i) as Select_stmtContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_create_trigger_stmt;
	}
}


export class Create_view_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public CREATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CREATE_, 0);
	}
	public VIEW_(): TerminalNode {
		return this.getToken(SQLiteParser.VIEW_, 0);
	}
	public view_name(): View_nameContext {
		return this.getTypedRuleContext(View_nameContext, 0) as View_nameContext;
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public TEMP_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMP_, 0);
	}
	public TEMPORARY_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMPORARY_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_create_view_stmt;
	}
}


export class Create_virtual_table_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public CREATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CREATE_, 0);
	}
	public VIRTUAL_(): TerminalNode {
		return this.getToken(SQLiteParser.VIRTUAL_, 0);
	}
	public TABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.TABLE_, 0);
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public USING_(): TerminalNode {
		return this.getToken(SQLiteParser.USING_, 0);
	}
	public module_name(): Module_nameContext {
		return this.getTypedRuleContext(Module_nameContext, 0) as Module_nameContext;
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public module_argument_list(): Module_argumentContext[] {
		return this.getTypedRuleContexts(Module_argumentContext) as Module_argumentContext[];
	}
	public module_argument(i: number): Module_argumentContext {
		return this.getTypedRuleContext(Module_argumentContext, i) as Module_argumentContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_create_virtual_table_stmt;
	}
}


export class With_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public WITH_(): TerminalNode {
		return this.getToken(SQLiteParser.WITH_, 0);
	}
	public cte_table_name_list(): Cte_table_nameContext[] {
		return this.getTypedRuleContexts(Cte_table_nameContext) as Cte_table_nameContext[];
	}
	public cte_table_name(i: number): Cte_table_nameContext {
		return this.getTypedRuleContext(Cte_table_nameContext, i) as Cte_table_nameContext;
	}
	public AS__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.AS_);
	}
	public AS_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.AS_, i);
	}
	public OPEN_PAR_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.OPEN_PAR);
	}
	public OPEN_PAR(i: number): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, i);
	}
	public select_stmt_list(): Select_stmtContext[] {
		return this.getTypedRuleContexts(Select_stmtContext) as Select_stmtContext[];
	}
	public select_stmt(i: number): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, i) as Select_stmtContext;
	}
	public CLOSE_PAR_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.CLOSE_PAR);
	}
	public CLOSE_PAR(i: number): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, i);
	}
	public RECURSIVE_(): TerminalNode {
		return this.getToken(SQLiteParser.RECURSIVE_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_with_clause;
	}
}


export class Cte_table_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_cte_table_name;
	}
}


export class Recursive_cteContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public cte_table_name(): Cte_table_nameContext {
		return this.getTypedRuleContext(Cte_table_nameContext, 0) as Cte_table_nameContext;
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public initial_select(): Initial_selectContext {
		return this.getTypedRuleContext(Initial_selectContext, 0) as Initial_selectContext;
	}
	public UNION_(): TerminalNode {
		return this.getToken(SQLiteParser.UNION_, 0);
	}
	public recursive_select(): Recursive_selectContext {
		return this.getTypedRuleContext(Recursive_selectContext, 0) as Recursive_selectContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public ALL_(): TerminalNode {
		return this.getToken(SQLiteParser.ALL_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_recursive_cte;
	}
}


export class Common_table_expressionContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public OPEN_PAR_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.OPEN_PAR);
	}
	public OPEN_PAR(i: number): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, i);
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public CLOSE_PAR_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.CLOSE_PAR);
	}
	public CLOSE_PAR(i: number): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, i);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_common_table_expression;
	}
}


export class Delete_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public DELETE_(): TerminalNode {
		return this.getToken(SQLiteParser.DELETE_, 0);
	}
	public FROM_(): TerminalNode {
		return this.getToken(SQLiteParser.FROM_, 0);
	}
	public qualified_table_name(): Qualified_table_nameContext {
		return this.getTypedRuleContext(Qualified_table_nameContext, 0) as Qualified_table_nameContext;
	}
	public with_clause(): With_clauseContext {
		return this.getTypedRuleContext(With_clauseContext, 0) as With_clauseContext;
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public returning_clause(): Returning_clauseContext {
		return this.getTypedRuleContext(Returning_clauseContext, 0) as Returning_clauseContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_delete_stmt;
	}
}


export class Delete_stmt_limitedContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public DELETE_(): TerminalNode {
		return this.getToken(SQLiteParser.DELETE_, 0);
	}
	public FROM_(): TerminalNode {
		return this.getToken(SQLiteParser.FROM_, 0);
	}
	public qualified_table_name(): Qualified_table_nameContext {
		return this.getTypedRuleContext(Qualified_table_nameContext, 0) as Qualified_table_nameContext;
	}
	public with_clause(): With_clauseContext {
		return this.getTypedRuleContext(With_clauseContext, 0) as With_clauseContext;
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public returning_clause(): Returning_clauseContext {
		return this.getTypedRuleContext(Returning_clauseContext, 0) as Returning_clauseContext;
	}
	public limit_stmt(): Limit_stmtContext {
		return this.getTypedRuleContext(Limit_stmtContext, 0) as Limit_stmtContext;
	}
	public order_by_stmt(): Order_by_stmtContext {
		return this.getTypedRuleContext(Order_by_stmtContext, 0) as Order_by_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_delete_stmt_limited;
	}
}


export class Detach_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public DETACH_(): TerminalNode {
		return this.getToken(SQLiteParser.DETACH_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DATABASE_(): TerminalNode {
		return this.getToken(SQLiteParser.DATABASE_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_detach_stmt;
	}
}


export class Drop_stmtContext extends ParserRuleContext {
	public _object!: Token;
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public DROP_(): TerminalNode {
		return this.getToken(SQLiteParser.DROP_, 0);
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public INDEX_(): TerminalNode {
		return this.getToken(SQLiteParser.INDEX_, 0);
	}
	public TABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.TABLE_, 0);
	}
	public TRIGGER_(): TerminalNode {
		return this.getToken(SQLiteParser.TRIGGER_, 0);
	}
	public VIEW_(): TerminalNode {
		return this.getToken(SQLiteParser.VIEW_, 0);
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_drop_stmt;
	}
}


export class ExprContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public literal_value(): Literal_valueContext {
		return this.getTypedRuleContext(Literal_valueContext, 0) as Literal_valueContext;
	}
	public BIND_PARAMETER(): TerminalNode {
		return this.getToken(SQLiteParser.BIND_PARAMETER, 0);
	}
	public column_name(): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, 0) as Column_nameContext;
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public DOT_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.DOT);
	}
	public DOT(i: number): TerminalNode {
		return this.getToken(SQLiteParser.DOT, i);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public unary_operator(): Unary_operatorContext {
		return this.getTypedRuleContext(Unary_operatorContext, 0) as Unary_operatorContext;
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public function_name(): Function_nameContext {
		return this.getTypedRuleContext(Function_nameContext, 0) as Function_nameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public STAR(): TerminalNode {
		return this.getToken(SQLiteParser.STAR, 0);
	}
	public filter_clause(): Filter_clauseContext {
		return this.getTypedRuleContext(Filter_clauseContext, 0) as Filter_clauseContext;
	}
	public over_clause(): Over_clauseContext {
		return this.getTypedRuleContext(Over_clauseContext, 0) as Over_clauseContext;
	}
	public DISTINCT_(): TerminalNode {
		return this.getToken(SQLiteParser.DISTINCT_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public CAST_(): TerminalNode {
		return this.getToken(SQLiteParser.CAST_, 0);
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public type_name(): Type_nameContext {
		return this.getTypedRuleContext(Type_nameContext, 0) as Type_nameContext;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public CASE_(): TerminalNode {
		return this.getToken(SQLiteParser.CASE_, 0);
	}
	public END_(): TerminalNode {
		return this.getToken(SQLiteParser.END_, 0);
	}
	public WHEN__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.WHEN_);
	}
	public WHEN_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.WHEN_, i);
	}
	public THEN__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.THEN_);
	}
	public THEN_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.THEN_, i);
	}
	public ELSE_(): TerminalNode {
		return this.getToken(SQLiteParser.ELSE_, 0);
	}
	public raise_function(): Raise_functionContext {
		return this.getTypedRuleContext(Raise_functionContext, 0) as Raise_functionContext;
	}
	public PIPE2(): TerminalNode {
		return this.getToken(SQLiteParser.PIPE2, 0);
	}
	public DIV(): TerminalNode {
		return this.getToken(SQLiteParser.DIV, 0);
	}
	public MOD(): TerminalNode {
		return this.getToken(SQLiteParser.MOD, 0);
	}
	public PLUS(): TerminalNode {
		return this.getToken(SQLiteParser.PLUS, 0);
	}
	public MINUS(): TerminalNode {
		return this.getToken(SQLiteParser.MINUS, 0);
	}
	public LT2(): TerminalNode {
		return this.getToken(SQLiteParser.LT2, 0);
	}
	public GT2(): TerminalNode {
		return this.getToken(SQLiteParser.GT2, 0);
	}
	public AMP(): TerminalNode {
		return this.getToken(SQLiteParser.AMP, 0);
	}
	public PIPE(): TerminalNode {
		return this.getToken(SQLiteParser.PIPE, 0);
	}
	public LT(): TerminalNode {
		return this.getToken(SQLiteParser.LT, 0);
	}
	public LT_EQ(): TerminalNode {
		return this.getToken(SQLiteParser.LT_EQ, 0);
	}
	public GT(): TerminalNode {
		return this.getToken(SQLiteParser.GT, 0);
	}
	public GT_EQ(): TerminalNode {
		return this.getToken(SQLiteParser.GT_EQ, 0);
	}
	public ASSIGN(): TerminalNode {
		return this.getToken(SQLiteParser.ASSIGN, 0);
	}
	public EQ(): TerminalNode {
		return this.getToken(SQLiteParser.EQ, 0);
	}
	public NOT_EQ1(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_EQ1, 0);
	}
	public NOT_EQ2(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_EQ2, 0);
	}
	public IS_(): TerminalNode {
		return this.getToken(SQLiteParser.IS_, 0);
	}
	public FROM_(): TerminalNode {
		return this.getToken(SQLiteParser.FROM_, 0);
	}
	public IN_(): TerminalNode {
		return this.getToken(SQLiteParser.IN_, 0);
	}
	public LIKE_(): TerminalNode {
		return this.getToken(SQLiteParser.LIKE_, 0);
	}
	public GLOB_(): TerminalNode {
		return this.getToken(SQLiteParser.GLOB_, 0);
	}
	public MATCH_(): TerminalNode {
		return this.getToken(SQLiteParser.MATCH_, 0);
	}
	public REGEXP_(): TerminalNode {
		return this.getToken(SQLiteParser.REGEXP_, 0);
	}
	public AND_(): TerminalNode {
		return this.getToken(SQLiteParser.AND_, 0);
	}
	public OR_(): TerminalNode {
		return this.getToken(SQLiteParser.OR_, 0);
	}
	public BETWEEN_(): TerminalNode {
		return this.getToken(SQLiteParser.BETWEEN_, 0);
	}
	public COLLATE_(): TerminalNode {
		return this.getToken(SQLiteParser.COLLATE_, 0);
	}
	public collation_name(): Collation_nameContext {
		return this.getTypedRuleContext(Collation_nameContext, 0) as Collation_nameContext;
	}
	public ESCAPE_(): TerminalNode {
		return this.getToken(SQLiteParser.ESCAPE_, 0);
	}
	public ISNULL_(): TerminalNode {
		return this.getToken(SQLiteParser.ISNULL_, 0);
	}
	public NOTNULL_(): TerminalNode {
		return this.getToken(SQLiteParser.NOTNULL_, 0);
	}
	public NULL_(): TerminalNode {
		return this.getToken(SQLiteParser.NULL_, 0);
	}
	public table_function_name(): Table_function_nameContext {
		return this.getTypedRuleContext(Table_function_nameContext, 0) as Table_function_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_expr;
	}
}


export class Raise_functionContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public RAISE_(): TerminalNode {
		return this.getToken(SQLiteParser.RAISE_, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public IGNORE_(): TerminalNode {
		return this.getToken(SQLiteParser.IGNORE_, 0);
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public error_message(): Error_messageContext {
		return this.getTypedRuleContext(Error_messageContext, 0) as Error_messageContext;
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public ABORT_(): TerminalNode {
		return this.getToken(SQLiteParser.ABORT_, 0);
	}
	public FAIL_(): TerminalNode {
		return this.getToken(SQLiteParser.FAIL_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_raise_function;
	}
}


export class Literal_valueContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public NUMERIC_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.NUMERIC_LITERAL, 0);
	}
	public STRING_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.STRING_LITERAL, 0);
	}
	public BLOB_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.BLOB_LITERAL, 0);
	}
	public NULL_(): TerminalNode {
		return this.getToken(SQLiteParser.NULL_, 0);
	}
	public TRUE_(): TerminalNode {
		return this.getToken(SQLiteParser.TRUE_, 0);
	}
	public FALSE_(): TerminalNode {
		return this.getToken(SQLiteParser.FALSE_, 0);
	}
	public CURRENT_TIME_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_TIME_, 0);
	}
	public CURRENT_DATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_DATE_, 0);
	}
	public CURRENT_TIMESTAMP_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_TIMESTAMP_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_literal_value;
	}
}


export class Value_rowContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_value_row;
	}
}


export class Values_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public VALUES_(): TerminalNode {
		return this.getToken(SQLiteParser.VALUES_, 0);
	}
	public value_row_list(): Value_rowContext[] {
		return this.getTypedRuleContexts(Value_rowContext) as Value_rowContext[];
	}
	public value_row(i: number): Value_rowContext {
		return this.getTypedRuleContext(Value_rowContext, i) as Value_rowContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_values_clause;
	}
}


export class Insert_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public INTO_(): TerminalNode {
		return this.getToken(SQLiteParser.INTO_, 0);
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public INSERT_(): TerminalNode {
		return this.getToken(SQLiteParser.INSERT_, 0);
	}
	public REPLACE_(): TerminalNode {
		return this.getToken(SQLiteParser.REPLACE_, 0);
	}
	public OR_(): TerminalNode {
		return this.getToken(SQLiteParser.OR_, 0);
	}
	public DEFAULT_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFAULT_, 0);
	}
	public VALUES_(): TerminalNode {
		return this.getToken(SQLiteParser.VALUES_, 0);
	}
	public with_clause(): With_clauseContext {
		return this.getTypedRuleContext(With_clauseContext, 0) as With_clauseContext;
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public ABORT_(): TerminalNode {
		return this.getToken(SQLiteParser.ABORT_, 0);
	}
	public FAIL_(): TerminalNode {
		return this.getToken(SQLiteParser.FAIL_, 0);
	}
	public IGNORE_(): TerminalNode {
		return this.getToken(SQLiteParser.IGNORE_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public table_alias(): Table_aliasContext {
		return this.getTypedRuleContext(Table_aliasContext, 0) as Table_aliasContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public returning_clause(): Returning_clauseContext {
		return this.getTypedRuleContext(Returning_clauseContext, 0) as Returning_clauseContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public values_clause(): Values_clauseContext {
		return this.getTypedRuleContext(Values_clauseContext, 0) as Values_clauseContext;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public upsert_clause(): Upsert_clauseContext {
		return this.getTypedRuleContext(Upsert_clauseContext, 0) as Upsert_clauseContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_insert_stmt;
	}
}


export class Returning_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public RETURNING_(): TerminalNode {
		return this.getToken(SQLiteParser.RETURNING_, 0);
	}
	public result_column_list(): Result_columnContext[] {
		return this.getTypedRuleContexts(Result_columnContext) as Result_columnContext[];
	}
	public result_column(i: number): Result_columnContext {
		return this.getTypedRuleContext(Result_columnContext, i) as Result_columnContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_returning_clause;
	}
}


export class Upsert_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ON_(): TerminalNode {
		return this.getToken(SQLiteParser.ON_, 0);
	}
	public CONFLICT_(): TerminalNode {
		return this.getToken(SQLiteParser.CONFLICT_, 0);
	}
	public DO_(): TerminalNode {
		return this.getToken(SQLiteParser.DO_, 0);
	}
	public NOTHING_(): TerminalNode {
		return this.getToken(SQLiteParser.NOTHING_, 0);
	}
	public UPDATE_(): TerminalNode {
		return this.getToken(SQLiteParser.UPDATE_, 0);
	}
	public SET_(): TerminalNode {
		return this.getToken(SQLiteParser.SET_, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public indexed_column_list(): Indexed_columnContext[] {
		return this.getTypedRuleContexts(Indexed_columnContext) as Indexed_columnContext[];
	}
	public indexed_column(i: number): Indexed_columnContext {
		return this.getTypedRuleContext(Indexed_columnContext, i) as Indexed_columnContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public ASSIGN_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.ASSIGN);
	}
	public ASSIGN(i: number): TerminalNode {
		return this.getToken(SQLiteParser.ASSIGN, i);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public WHERE__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.WHERE_);
	}
	public WHERE_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, i);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public column_name_list_list(): Column_name_listContext[] {
		return this.getTypedRuleContexts(Column_name_listContext) as Column_name_listContext[];
	}
	public column_name_list_index(i: number): Column_name_listContext {
		return this.getTypedRuleContext(Column_name_listContext, i) as Column_name_listContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_upsert_clause;
	}
}


export class Pragma_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public PRAGMA_(): TerminalNode {
		return this.getToken(SQLiteParser.PRAGMA_, 0);
	}
	public pragma_name(): Pragma_nameContext {
		return this.getTypedRuleContext(Pragma_nameContext, 0) as Pragma_nameContext;
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public ASSIGN(): TerminalNode {
		return this.getToken(SQLiteParser.ASSIGN, 0);
	}
	public pragma_value(): Pragma_valueContext {
		return this.getTypedRuleContext(Pragma_valueContext, 0) as Pragma_valueContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_pragma_stmt;
	}
}


export class Pragma_valueContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public signed_number(): Signed_numberContext {
		return this.getTypedRuleContext(Signed_numberContext, 0) as Signed_numberContext;
	}
	public name(): NameContext {
		return this.getTypedRuleContext(NameContext, 0) as NameContext;
	}
	public STRING_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.STRING_LITERAL, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_pragma_value;
	}
}


export class Reindex_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public REINDEX_(): TerminalNode {
		return this.getToken(SQLiteParser.REINDEX_, 0);
	}
	public collation_name(): Collation_nameContext {
		return this.getTypedRuleContext(Collation_nameContext, 0) as Collation_nameContext;
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public index_name(): Index_nameContext {
		return this.getTypedRuleContext(Index_nameContext, 0) as Index_nameContext;
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_reindex_stmt;
	}
}


export class Select_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public select_core_list(): Select_coreContext[] {
		return this.getTypedRuleContexts(Select_coreContext) as Select_coreContext[];
	}
	public select_core(i: number): Select_coreContext {
		return this.getTypedRuleContext(Select_coreContext, i) as Select_coreContext;
	}
	public common_table_stmt(): Common_table_stmtContext {
		return this.getTypedRuleContext(Common_table_stmtContext, 0) as Common_table_stmtContext;
	}
	public compound_operator_list(): Compound_operatorContext[] {
		return this.getTypedRuleContexts(Compound_operatorContext) as Compound_operatorContext[];
	}
	public compound_operator(i: number): Compound_operatorContext {
		return this.getTypedRuleContext(Compound_operatorContext, i) as Compound_operatorContext;
	}
	public order_by_stmt(): Order_by_stmtContext {
		return this.getTypedRuleContext(Order_by_stmtContext, 0) as Order_by_stmtContext;
	}
	public limit_stmt(): Limit_stmtContext {
		return this.getTypedRuleContext(Limit_stmtContext, 0) as Limit_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_select_stmt;
	}
}


export class Join_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public table_or_subquery_list(): Table_or_subqueryContext[] {
		return this.getTypedRuleContexts(Table_or_subqueryContext) as Table_or_subqueryContext[];
	}
	public table_or_subquery(i: number): Table_or_subqueryContext {
		return this.getTypedRuleContext(Table_or_subqueryContext, i) as Table_or_subqueryContext;
	}
	public join_operator_list(): Join_operatorContext[] {
		return this.getTypedRuleContexts(Join_operatorContext) as Join_operatorContext[];
	}
	public join_operator(i: number): Join_operatorContext {
		return this.getTypedRuleContext(Join_operatorContext, i) as Join_operatorContext;
	}
	public join_constraint_list(): Join_constraintContext[] {
		return this.getTypedRuleContexts(Join_constraintContext) as Join_constraintContext[];
	}
	public join_constraint(i: number): Join_constraintContext {
		return this.getTypedRuleContext(Join_constraintContext, i) as Join_constraintContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_join_clause;
	}
}


export class Select_coreContext extends ParserRuleContext {
	public _whereExpr!: ExprContext;
	public _expr!: ExprContext;
	public _groupByExpr: ExprContext[] = [];
	public _havingExpr!: ExprContext;
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public SELECT_(): TerminalNode {
		return this.getToken(SQLiteParser.SELECT_, 0);
	}
	public result_column_list(): Result_columnContext[] {
		return this.getTypedRuleContexts(Result_columnContext) as Result_columnContext[];
	}
	public result_column(i: number): Result_columnContext {
		return this.getTypedRuleContext(Result_columnContext, i) as Result_columnContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public FROM_(): TerminalNode {
		return this.getToken(SQLiteParser.FROM_, 0);
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public GROUP_(): TerminalNode {
		return this.getToken(SQLiteParser.GROUP_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public WINDOW_(): TerminalNode {
		return this.getToken(SQLiteParser.WINDOW_, 0);
	}
	public window_name_list(): Window_nameContext[] {
		return this.getTypedRuleContexts(Window_nameContext) as Window_nameContext[];
	}
	public window_name(i: number): Window_nameContext {
		return this.getTypedRuleContext(Window_nameContext, i) as Window_nameContext;
	}
	public AS__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.AS_);
	}
	public AS_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.AS_, i);
	}
	public window_defn_list(): Window_defnContext[] {
		return this.getTypedRuleContexts(Window_defnContext) as Window_defnContext[];
	}
	public window_defn(i: number): Window_defnContext {
		return this.getTypedRuleContext(Window_defnContext, i) as Window_defnContext;
	}
	public DISTINCT_(): TerminalNode {
		return this.getToken(SQLiteParser.DISTINCT_, 0);
	}
	public ALL_(): TerminalNode {
		return this.getToken(SQLiteParser.ALL_, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public table_or_subquery_list(): Table_or_subqueryContext[] {
		return this.getTypedRuleContexts(Table_or_subqueryContext) as Table_or_subqueryContext[];
	}
	public table_or_subquery(i: number): Table_or_subqueryContext {
		return this.getTypedRuleContext(Table_or_subqueryContext, i) as Table_or_subqueryContext;
	}
	public join_clause(): Join_clauseContext {
		return this.getTypedRuleContext(Join_clauseContext, 0) as Join_clauseContext;
	}
	public HAVING_(): TerminalNode {
		return this.getToken(SQLiteParser.HAVING_, 0);
	}
	public values_clause(): Values_clauseContext {
		return this.getTypedRuleContext(Values_clauseContext, 0) as Values_clauseContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_select_core;
	}
}


export class Factored_select_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_factored_select_stmt;
	}
}


export class Simple_select_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public select_core(): Select_coreContext {
		return this.getTypedRuleContext(Select_coreContext, 0) as Select_coreContext;
	}
	public common_table_stmt(): Common_table_stmtContext {
		return this.getTypedRuleContext(Common_table_stmtContext, 0) as Common_table_stmtContext;
	}
	public order_by_stmt(): Order_by_stmtContext {
		return this.getTypedRuleContext(Order_by_stmtContext, 0) as Order_by_stmtContext;
	}
	public limit_stmt(): Limit_stmtContext {
		return this.getTypedRuleContext(Limit_stmtContext, 0) as Limit_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_simple_select_stmt;
	}
}


export class Compound_select_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public select_core_list(): Select_coreContext[] {
		return this.getTypedRuleContexts(Select_coreContext) as Select_coreContext[];
	}
	public select_core(i: number): Select_coreContext {
		return this.getTypedRuleContext(Select_coreContext, i) as Select_coreContext;
	}
	public common_table_stmt(): Common_table_stmtContext {
		return this.getTypedRuleContext(Common_table_stmtContext, 0) as Common_table_stmtContext;
	}
	public order_by_stmt(): Order_by_stmtContext {
		return this.getTypedRuleContext(Order_by_stmtContext, 0) as Order_by_stmtContext;
	}
	public limit_stmt(): Limit_stmtContext {
		return this.getTypedRuleContext(Limit_stmtContext, 0) as Limit_stmtContext;
	}
	public UNION__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.UNION_);
	}
	public UNION_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.UNION_, i);
	}
	public INTERSECT__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.INTERSECT_);
	}
	public INTERSECT_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.INTERSECT_, i);
	}
	public EXCEPT__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.EXCEPT_);
	}
	public EXCEPT_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.EXCEPT_, i);
	}
	public ALL__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.ALL_);
	}
	public ALL_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.ALL_, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_compound_select_stmt;
	}
}


export class Table_or_subqueryContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public table_alias(): Table_aliasContext {
		return this.getTypedRuleContext(Table_aliasContext, 0) as Table_aliasContext;
	}
	public INDEXED_(): TerminalNode {
		return this.getToken(SQLiteParser.INDEXED_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public index_name(): Index_nameContext {
		return this.getTypedRuleContext(Index_nameContext, 0) as Index_nameContext;
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public table_function_name(): Table_function_nameContext {
		return this.getTypedRuleContext(Table_function_nameContext, 0) as Table_function_nameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public table_or_subquery_list(): Table_or_subqueryContext[] {
		return this.getTypedRuleContexts(Table_or_subqueryContext) as Table_or_subqueryContext[];
	}
	public table_or_subquery(i: number): Table_or_subqueryContext {
		return this.getTypedRuleContext(Table_or_subqueryContext, i) as Table_or_subqueryContext;
	}
	public join_clause(): Join_clauseContext {
		return this.getTypedRuleContext(Join_clauseContext, 0) as Join_clauseContext;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_table_or_subquery;
	}
}


export class Result_columnContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public STAR(): TerminalNode {
		return this.getToken(SQLiteParser.STAR, 0);
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public column_alias(): Column_aliasContext {
		return this.getTypedRuleContext(Column_aliasContext, 0) as Column_aliasContext;
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_result_column;
	}
}


export class Join_operatorContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public JOIN_(): TerminalNode {
		return this.getToken(SQLiteParser.JOIN_, 0);
	}
	public NATURAL_(): TerminalNode {
		return this.getToken(SQLiteParser.NATURAL_, 0);
	}
	public INNER_(): TerminalNode {
		return this.getToken(SQLiteParser.INNER_, 0);
	}
	public CROSS_(): TerminalNode {
		return this.getToken(SQLiteParser.CROSS_, 0);
	}
	public LEFT_(): TerminalNode {
		return this.getToken(SQLiteParser.LEFT_, 0);
	}
	public RIGHT_(): TerminalNode {
		return this.getToken(SQLiteParser.RIGHT_, 0);
	}
	public FULL_(): TerminalNode {
		return this.getToken(SQLiteParser.FULL_, 0);
	}
	public OUTER_(): TerminalNode {
		return this.getToken(SQLiteParser.OUTER_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_join_operator;
	}
}


export class Join_constraintContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ON_(): TerminalNode {
		return this.getToken(SQLiteParser.ON_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public USING_(): TerminalNode {
		return this.getToken(SQLiteParser.USING_, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_join_constraint;
	}
}


export class Compound_operatorContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public UNION_(): TerminalNode {
		return this.getToken(SQLiteParser.UNION_, 0);
	}
	public ALL_(): TerminalNode {
		return this.getToken(SQLiteParser.ALL_, 0);
	}
	public INTERSECT_(): TerminalNode {
		return this.getToken(SQLiteParser.INTERSECT_, 0);
	}
	public EXCEPT_(): TerminalNode {
		return this.getToken(SQLiteParser.EXCEPT_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_compound_operator;
	}
}


export class Update_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public UPDATE_(): TerminalNode {
		return this.getToken(SQLiteParser.UPDATE_, 0);
	}
	public qualified_table_name(): Qualified_table_nameContext {
		return this.getTypedRuleContext(Qualified_table_nameContext, 0) as Qualified_table_nameContext;
	}
	public SET_(): TerminalNode {
		return this.getToken(SQLiteParser.SET_, 0);
	}
	public ASSIGN_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.ASSIGN);
	}
	public ASSIGN(i: number): TerminalNode {
		return this.getToken(SQLiteParser.ASSIGN, i);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public column_name_list_list(): Column_name_listContext[] {
		return this.getTypedRuleContexts(Column_name_listContext) as Column_name_listContext[];
	}
	public column_name_list_index(i: number): Column_name_listContext {
		return this.getTypedRuleContext(Column_name_listContext, i) as Column_name_listContext;
	}
	public with_clause(): With_clauseContext {
		return this.getTypedRuleContext(With_clauseContext, 0) as With_clauseContext;
	}
	public OR_(): TerminalNode {
		return this.getToken(SQLiteParser.OR_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public FROM_(): TerminalNode {
		return this.getToken(SQLiteParser.FROM_, 0);
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public returning_clause(): Returning_clauseContext {
		return this.getTypedRuleContext(Returning_clauseContext, 0) as Returning_clauseContext;
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public ABORT_(): TerminalNode {
		return this.getToken(SQLiteParser.ABORT_, 0);
	}
	public REPLACE_(): TerminalNode {
		return this.getToken(SQLiteParser.REPLACE_, 0);
	}
	public FAIL_(): TerminalNode {
		return this.getToken(SQLiteParser.FAIL_, 0);
	}
	public IGNORE_(): TerminalNode {
		return this.getToken(SQLiteParser.IGNORE_, 0);
	}
	public table_or_subquery_list(): Table_or_subqueryContext[] {
		return this.getTypedRuleContexts(Table_or_subqueryContext) as Table_or_subqueryContext[];
	}
	public table_or_subquery(i: number): Table_or_subqueryContext {
		return this.getTypedRuleContext(Table_or_subqueryContext, i) as Table_or_subqueryContext;
	}
	public join_clause(): Join_clauseContext {
		return this.getTypedRuleContext(Join_clauseContext, 0) as Join_clauseContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_update_stmt;
	}
}


export class Column_name_listContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_column_name_list;
	}
}


export class Update_stmt_limitedContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public UPDATE_(): TerminalNode {
		return this.getToken(SQLiteParser.UPDATE_, 0);
	}
	public qualified_table_name(): Qualified_table_nameContext {
		return this.getTypedRuleContext(Qualified_table_nameContext, 0) as Qualified_table_nameContext;
	}
	public SET_(): TerminalNode {
		return this.getToken(SQLiteParser.SET_, 0);
	}
	public ASSIGN_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.ASSIGN);
	}
	public ASSIGN(i: number): TerminalNode {
		return this.getToken(SQLiteParser.ASSIGN, i);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public column_name_list(): Column_nameContext[] {
		return this.getTypedRuleContexts(Column_nameContext) as Column_nameContext[];
	}
	public column_name(i: number): Column_nameContext {
		return this.getTypedRuleContext(Column_nameContext, i) as Column_nameContext;
	}
	public column_name_list_list(): Column_name_listContext[] {
		return this.getTypedRuleContexts(Column_name_listContext) as Column_name_listContext[];
	}
	public column_name_list_index(i: number): Column_name_listContext {
		return this.getTypedRuleContext(Column_name_listContext, i) as Column_name_listContext;
	}
	public with_clause(): With_clauseContext {
		return this.getTypedRuleContext(With_clauseContext, 0) as With_clauseContext;
	}
	public OR_(): TerminalNode {
		return this.getToken(SQLiteParser.OR_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public returning_clause(): Returning_clauseContext {
		return this.getTypedRuleContext(Returning_clauseContext, 0) as Returning_clauseContext;
	}
	public limit_stmt(): Limit_stmtContext {
		return this.getTypedRuleContext(Limit_stmtContext, 0) as Limit_stmtContext;
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public ABORT_(): TerminalNode {
		return this.getToken(SQLiteParser.ABORT_, 0);
	}
	public REPLACE_(): TerminalNode {
		return this.getToken(SQLiteParser.REPLACE_, 0);
	}
	public FAIL_(): TerminalNode {
		return this.getToken(SQLiteParser.FAIL_, 0);
	}
	public IGNORE_(): TerminalNode {
		return this.getToken(SQLiteParser.IGNORE_, 0);
	}
	public order_by_stmt(): Order_by_stmtContext {
		return this.getTypedRuleContext(Order_by_stmtContext, 0) as Order_by_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_update_stmt_limited;
	}
}


export class Qualified_table_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public table_name(): Table_nameContext {
		return this.getTypedRuleContext(Table_nameContext, 0) as Table_nameContext;
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public DOT(): TerminalNode {
		return this.getToken(SQLiteParser.DOT, 0);
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public alias(): AliasContext {
		return this.getTypedRuleContext(AliasContext, 0) as AliasContext;
	}
	public INDEXED_(): TerminalNode {
		return this.getToken(SQLiteParser.INDEXED_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public index_name(): Index_nameContext {
		return this.getTypedRuleContext(Index_nameContext, 0) as Index_nameContext;
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_qualified_table_name;
	}
}


export class Vacuum_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public VACUUM_(): TerminalNode {
		return this.getToken(SQLiteParser.VACUUM_, 0);
	}
	public schema_name(): Schema_nameContext {
		return this.getTypedRuleContext(Schema_nameContext, 0) as Schema_nameContext;
	}
	public INTO_(): TerminalNode {
		return this.getToken(SQLiteParser.INTO_, 0);
	}
	public filename(): FilenameContext {
		return this.getTypedRuleContext(FilenameContext, 0) as FilenameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_vacuum_stmt;
	}
}


export class Filter_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public FILTER_(): TerminalNode {
		return this.getToken(SQLiteParser.FILTER_, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_filter_clause;
	}
}


export class Window_defnContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public ORDER_(): TerminalNode {
		return this.getToken(SQLiteParser.ORDER_, 0);
	}
	public BY__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.BY_);
	}
	public BY_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.BY_, i);
	}
	public ordering_term_list(): Ordering_termContext[] {
		return this.getTypedRuleContexts(Ordering_termContext) as Ordering_termContext[];
	}
	public ordering_term(i: number): Ordering_termContext {
		return this.getTypedRuleContext(Ordering_termContext, i) as Ordering_termContext;
	}
	public base_window_name(): Base_window_nameContext {
		return this.getTypedRuleContext(Base_window_nameContext, 0) as Base_window_nameContext;
	}
	public PARTITION_(): TerminalNode {
		return this.getToken(SQLiteParser.PARTITION_, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public frame_spec(): Frame_specContext {
		return this.getTypedRuleContext(Frame_specContext, 0) as Frame_specContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_window_defn;
	}
}


export class Over_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public OVER_(): TerminalNode {
		return this.getToken(SQLiteParser.OVER_, 0);
	}
	public window_name(): Window_nameContext {
		return this.getTypedRuleContext(Window_nameContext, 0) as Window_nameContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public base_window_name(): Base_window_nameContext {
		return this.getTypedRuleContext(Base_window_nameContext, 0) as Base_window_nameContext;
	}
	public PARTITION_(): TerminalNode {
		return this.getToken(SQLiteParser.PARTITION_, 0);
	}
	public BY__list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.BY_);
	}
	public BY_(i: number): TerminalNode {
		return this.getToken(SQLiteParser.BY_, i);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public ORDER_(): TerminalNode {
		return this.getToken(SQLiteParser.ORDER_, 0);
	}
	public ordering_term_list(): Ordering_termContext[] {
		return this.getTypedRuleContexts(Ordering_termContext) as Ordering_termContext[];
	}
	public ordering_term(i: number): Ordering_termContext {
		return this.getTypedRuleContext(Ordering_termContext, i) as Ordering_termContext;
	}
	public frame_spec(): Frame_specContext {
		return this.getTypedRuleContext(Frame_specContext, 0) as Frame_specContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_over_clause;
	}
}


export class Frame_specContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public frame_clause(): Frame_clauseContext {
		return this.getTypedRuleContext(Frame_clauseContext, 0) as Frame_clauseContext;
	}
	public EXCLUDE_(): TerminalNode {
		return this.getToken(SQLiteParser.EXCLUDE_, 0);
	}
	public NO_(): TerminalNode {
		return this.getToken(SQLiteParser.NO_, 0);
	}
	public OTHERS_(): TerminalNode {
		return this.getToken(SQLiteParser.OTHERS_, 0);
	}
	public CURRENT_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_, 0);
	}
	public ROW_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_, 0);
	}
	public GROUP_(): TerminalNode {
		return this.getToken(SQLiteParser.GROUP_, 0);
	}
	public TIES_(): TerminalNode {
		return this.getToken(SQLiteParser.TIES_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_frame_spec;
	}
}


export class Frame_clauseContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public RANGE_(): TerminalNode {
		return this.getToken(SQLiteParser.RANGE_, 0);
	}
	public ROWS_(): TerminalNode {
		return this.getToken(SQLiteParser.ROWS_, 0);
	}
	public GROUPS_(): TerminalNode {
		return this.getToken(SQLiteParser.GROUPS_, 0);
	}
	public frame_single(): Frame_singleContext {
		return this.getTypedRuleContext(Frame_singleContext, 0) as Frame_singleContext;
	}
	public BETWEEN_(): TerminalNode {
		return this.getToken(SQLiteParser.BETWEEN_, 0);
	}
	public frame_left(): Frame_leftContext {
		return this.getTypedRuleContext(Frame_leftContext, 0) as Frame_leftContext;
	}
	public AND_(): TerminalNode {
		return this.getToken(SQLiteParser.AND_, 0);
	}
	public frame_right(): Frame_rightContext {
		return this.getTypedRuleContext(Frame_rightContext, 0) as Frame_rightContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_frame_clause;
	}
}


export class Simple_function_invocationContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public simple_func(): Simple_funcContext {
		return this.getTypedRuleContext(Simple_funcContext, 0) as Simple_funcContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public STAR(): TerminalNode {
		return this.getToken(SQLiteParser.STAR, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_simple_function_invocation;
	}
}


export class Aggregate_function_invocationContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public aggregate_func(): Aggregate_funcContext {
		return this.getTypedRuleContext(Aggregate_funcContext, 0) as Aggregate_funcContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public STAR(): TerminalNode {
		return this.getToken(SQLiteParser.STAR, 0);
	}
	public filter_clause(): Filter_clauseContext {
		return this.getTypedRuleContext(Filter_clauseContext, 0) as Filter_clauseContext;
	}
	public DISTINCT_(): TerminalNode {
		return this.getToken(SQLiteParser.DISTINCT_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_aggregate_function_invocation;
	}
}


export class Window_function_invocationContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public window_function(): Window_functionContext {
		return this.getTypedRuleContext(Window_functionContext, 0) as Window_functionContext;
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public OVER_(): TerminalNode {
		return this.getToken(SQLiteParser.OVER_, 0);
	}
	public window_defn(): Window_defnContext {
		return this.getTypedRuleContext(Window_defnContext, 0) as Window_defnContext;
	}
	public window_name(): Window_nameContext {
		return this.getTypedRuleContext(Window_nameContext, 0) as Window_nameContext;
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public STAR(): TerminalNode {
		return this.getToken(SQLiteParser.STAR, 0);
	}
	public filter_clause(): Filter_clauseContext {
		return this.getTypedRuleContext(Filter_clauseContext, 0) as Filter_clauseContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_window_function_invocation;
	}
}


export class Common_table_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public WITH_(): TerminalNode {
		return this.getToken(SQLiteParser.WITH_, 0);
	}
	public common_table_expression_list(): Common_table_expressionContext[] {
		return this.getTypedRuleContexts(Common_table_expressionContext) as Common_table_expressionContext[];
	}
	public common_table_expression(i: number): Common_table_expressionContext {
		return this.getTypedRuleContext(Common_table_expressionContext, i) as Common_table_expressionContext;
	}
	public RECURSIVE_(): TerminalNode {
		return this.getToken(SQLiteParser.RECURSIVE_, 0);
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_common_table_stmt;
	}
}


export class Order_by_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ORDER_(): TerminalNode {
		return this.getToken(SQLiteParser.ORDER_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public ordering_term_list(): Ordering_termContext[] {
		return this.getTypedRuleContexts(Ordering_termContext) as Ordering_termContext[];
	}
	public ordering_term(i: number): Ordering_termContext {
		return this.getTypedRuleContext(Ordering_termContext, i) as Ordering_termContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_order_by_stmt;
	}
}


export class Limit_stmtContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public LIMIT_(): TerminalNode {
		return this.getToken(SQLiteParser.LIMIT_, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public OFFSET_(): TerminalNode {
		return this.getToken(SQLiteParser.OFFSET_, 0);
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_limit_stmt;
	}
}


export class Ordering_termContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public COLLATE_(): TerminalNode {
		return this.getToken(SQLiteParser.COLLATE_, 0);
	}
	public collation_name(): Collation_nameContext {
		return this.getTypedRuleContext(Collation_nameContext, 0) as Collation_nameContext;
	}
	public asc_desc(): Asc_descContext {
		return this.getTypedRuleContext(Asc_descContext, 0) as Asc_descContext;
	}
	public NULLS_(): TerminalNode {
		return this.getToken(SQLiteParser.NULLS_, 0);
	}
	public FIRST_(): TerminalNode {
		return this.getToken(SQLiteParser.FIRST_, 0);
	}
	public LAST_(): TerminalNode {
		return this.getToken(SQLiteParser.LAST_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_ordering_term;
	}
}


export class Asc_descContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ASC_(): TerminalNode {
		return this.getToken(SQLiteParser.ASC_, 0);
	}
	public DESC_(): TerminalNode {
		return this.getToken(SQLiteParser.DESC_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_asc_desc;
	}
}


export class Frame_leftContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public PRECEDING_(): TerminalNode {
		return this.getToken(SQLiteParser.PRECEDING_, 0);
	}
	public FOLLOWING_(): TerminalNode {
		return this.getToken(SQLiteParser.FOLLOWING_, 0);
	}
	public CURRENT_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_, 0);
	}
	public ROW_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_, 0);
	}
	public UNBOUNDED_(): TerminalNode {
		return this.getToken(SQLiteParser.UNBOUNDED_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_frame_left;
	}
}


export class Frame_rightContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public PRECEDING_(): TerminalNode {
		return this.getToken(SQLiteParser.PRECEDING_, 0);
	}
	public FOLLOWING_(): TerminalNode {
		return this.getToken(SQLiteParser.FOLLOWING_, 0);
	}
	public CURRENT_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_, 0);
	}
	public ROW_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_, 0);
	}
	public UNBOUNDED_(): TerminalNode {
		return this.getToken(SQLiteParser.UNBOUNDED_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_frame_right;
	}
}


export class Frame_singleContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public PRECEDING_(): TerminalNode {
		return this.getToken(SQLiteParser.PRECEDING_, 0);
	}
	public UNBOUNDED_(): TerminalNode {
		return this.getToken(SQLiteParser.UNBOUNDED_, 0);
	}
	public CURRENT_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_, 0);
	}
	public ROW_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_frame_single;
	}
}


export class Window_functionContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public OPEN_PAR_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.OPEN_PAR);
	}
	public OPEN_PAR(i: number): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, i);
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public CLOSE_PAR_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.CLOSE_PAR);
	}
	public CLOSE_PAR(i: number): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, i);
	}
	public OVER_(): TerminalNode {
		return this.getToken(SQLiteParser.OVER_, 0);
	}
	public order_by_expr_asc_desc(): Order_by_expr_asc_descContext {
		return this.getTypedRuleContext(Order_by_expr_asc_descContext, 0) as Order_by_expr_asc_descContext;
	}
	public FIRST_VALUE_(): TerminalNode {
		return this.getToken(SQLiteParser.FIRST_VALUE_, 0);
	}
	public LAST_VALUE_(): TerminalNode {
		return this.getToken(SQLiteParser.LAST_VALUE_, 0);
	}
	public partition_by(): Partition_byContext {
		return this.getTypedRuleContext(Partition_byContext, 0) as Partition_byContext;
	}
	public frame_clause(): Frame_clauseContext {
		return this.getTypedRuleContext(Frame_clauseContext, 0) as Frame_clauseContext;
	}
	public CUME_DIST_(): TerminalNode {
		return this.getToken(SQLiteParser.CUME_DIST_, 0);
	}
	public PERCENT_RANK_(): TerminalNode {
		return this.getToken(SQLiteParser.PERCENT_RANK_, 0);
	}
	public order_by_expr(): Order_by_exprContext {
		return this.getTypedRuleContext(Order_by_exprContext, 0) as Order_by_exprContext;
	}
	public DENSE_RANK_(): TerminalNode {
		return this.getToken(SQLiteParser.DENSE_RANK_, 0);
	}
	public RANK_(): TerminalNode {
		return this.getToken(SQLiteParser.RANK_, 0);
	}
	public ROW_NUMBER_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_NUMBER_, 0);
	}
	public LAG_(): TerminalNode {
		return this.getToken(SQLiteParser.LAG_, 0);
	}
	public LEAD_(): TerminalNode {
		return this.getToken(SQLiteParser.LEAD_, 0);
	}
	public offset(): OffsetContext {
		return this.getTypedRuleContext(OffsetContext, 0) as OffsetContext;
	}
	public default_value(): Default_valueContext {
		return this.getTypedRuleContext(Default_valueContext, 0) as Default_valueContext;
	}
	public NTH_VALUE_(): TerminalNode {
		return this.getToken(SQLiteParser.NTH_VALUE_, 0);
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public signed_number(): Signed_numberContext {
		return this.getTypedRuleContext(Signed_numberContext, 0) as Signed_numberContext;
	}
	public NTILE_(): TerminalNode {
		return this.getToken(SQLiteParser.NTILE_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_window_function;
	}
}


export class OffsetContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public signed_number(): Signed_numberContext {
		return this.getTypedRuleContext(Signed_numberContext, 0) as Signed_numberContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_offset;
	}
}


export class Default_valueContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public COMMA(): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, 0);
	}
	public signed_number(): Signed_numberContext {
		return this.getTypedRuleContext(Signed_numberContext, 0) as Signed_numberContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_default_value;
	}
}


export class Partition_byContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public PARTITION_(): TerminalNode {
		return this.getToken(SQLiteParser.PARTITION_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_partition_by;
	}
}


export class Order_by_exprContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ORDER_(): TerminalNode {
		return this.getToken(SQLiteParser.ORDER_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_order_by_expr;
	}
}


export class Order_by_expr_asc_descContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ORDER_(): TerminalNode {
		return this.getToken(SQLiteParser.ORDER_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public expr_asc_desc(): Expr_asc_descContext {
		return this.getTypedRuleContext(Expr_asc_descContext, 0) as Expr_asc_descContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_order_by_expr_asc_desc;
	}
}


export class Expr_asc_descContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public expr_list(): ExprContext[] {
		return this.getTypedRuleContexts(ExprContext) as ExprContext[];
	}
	public expr(i: number): ExprContext {
		return this.getTypedRuleContext(ExprContext, i) as ExprContext;
	}
	public asc_desc_list(): Asc_descContext[] {
		return this.getTypedRuleContexts(Asc_descContext) as Asc_descContext[];
	}
	public asc_desc(i: number): Asc_descContext {
		return this.getTypedRuleContext(Asc_descContext, i) as Asc_descContext;
	}
	public COMMA_list(): TerminalNode[] {
		return this.getTokens(SQLiteParser.COMMA);
	}
	public COMMA(i: number): TerminalNode {
		return this.getToken(SQLiteParser.COMMA, i);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_expr_asc_desc;
	}
}


export class Initial_selectContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_initial_select;
	}
}


export class Recursive_selectContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public select_stmt(): Select_stmtContext {
		return this.getTypedRuleContext(Select_stmtContext, 0) as Select_stmtContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_recursive_select;
	}
}


export class Unary_operatorContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public MINUS(): TerminalNode {
		return this.getToken(SQLiteParser.MINUS, 0);
	}
	public PLUS(): TerminalNode {
		return this.getToken(SQLiteParser.PLUS, 0);
	}
	public TILDE(): TerminalNode {
		return this.getToken(SQLiteParser.TILDE, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_unary_operator;
	}
}


export class Error_messageContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public STRING_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.STRING_LITERAL, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_error_message;
	}
}


export class Module_argumentContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public expr(): ExprContext {
		return this.getTypedRuleContext(ExprContext, 0) as ExprContext;
	}
	public column_def(): Column_defContext {
		return this.getTypedRuleContext(Column_defContext, 0) as Column_defContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_module_argument;
	}
}


export class Column_aliasContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public IDENTIFIER(): TerminalNode {
		return this.getToken(SQLiteParser.IDENTIFIER, 0);
	}
	public STRING_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.STRING_LITERAL, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_column_alias;
	}
}


export class KeywordContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public ABORT_(): TerminalNode {
		return this.getToken(SQLiteParser.ABORT_, 0);
	}
	public ACTION_(): TerminalNode {
		return this.getToken(SQLiteParser.ACTION_, 0);
	}
	public ADD_(): TerminalNode {
		return this.getToken(SQLiteParser.ADD_, 0);
	}
	public AFTER_(): TerminalNode {
		return this.getToken(SQLiteParser.AFTER_, 0);
	}
	public ALL_(): TerminalNode {
		return this.getToken(SQLiteParser.ALL_, 0);
	}
	public ALTER_(): TerminalNode {
		return this.getToken(SQLiteParser.ALTER_, 0);
	}
	public ANALYZE_(): TerminalNode {
		return this.getToken(SQLiteParser.ANALYZE_, 0);
	}
	public AND_(): TerminalNode {
		return this.getToken(SQLiteParser.AND_, 0);
	}
	public AS_(): TerminalNode {
		return this.getToken(SQLiteParser.AS_, 0);
	}
	public ASC_(): TerminalNode {
		return this.getToken(SQLiteParser.ASC_, 0);
	}
	public ATTACH_(): TerminalNode {
		return this.getToken(SQLiteParser.ATTACH_, 0);
	}
	public AUTOINCREMENT_(): TerminalNode {
		return this.getToken(SQLiteParser.AUTOINCREMENT_, 0);
	}
	public BEFORE_(): TerminalNode {
		return this.getToken(SQLiteParser.BEFORE_, 0);
	}
	public BEGIN_(): TerminalNode {
		return this.getToken(SQLiteParser.BEGIN_, 0);
	}
	public BETWEEN_(): TerminalNode {
		return this.getToken(SQLiteParser.BETWEEN_, 0);
	}
	public BY_(): TerminalNode {
		return this.getToken(SQLiteParser.BY_, 0);
	}
	public CASCADE_(): TerminalNode {
		return this.getToken(SQLiteParser.CASCADE_, 0);
	}
	public CASE_(): TerminalNode {
		return this.getToken(SQLiteParser.CASE_, 0);
	}
	public CAST_(): TerminalNode {
		return this.getToken(SQLiteParser.CAST_, 0);
	}
	public CHECK_(): TerminalNode {
		return this.getToken(SQLiteParser.CHECK_, 0);
	}
	public COLLATE_(): TerminalNode {
		return this.getToken(SQLiteParser.COLLATE_, 0);
	}
	public COLUMN_(): TerminalNode {
		return this.getToken(SQLiteParser.COLUMN_, 0);
	}
	public COMMIT_(): TerminalNode {
		return this.getToken(SQLiteParser.COMMIT_, 0);
	}
	public CONFLICT_(): TerminalNode {
		return this.getToken(SQLiteParser.CONFLICT_, 0);
	}
	public CONSTRAINT_(): TerminalNode {
		return this.getToken(SQLiteParser.CONSTRAINT_, 0);
	}
	public CREATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CREATE_, 0);
	}
	public CROSS_(): TerminalNode {
		return this.getToken(SQLiteParser.CROSS_, 0);
	}
	public CURRENT_DATE_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_DATE_, 0);
	}
	public CURRENT_TIME_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_TIME_, 0);
	}
	public CURRENT_TIMESTAMP_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_TIMESTAMP_, 0);
	}
	public DATABASE_(): TerminalNode {
		return this.getToken(SQLiteParser.DATABASE_, 0);
	}
	public DEFAULT_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFAULT_, 0);
	}
	public DEFERRABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFERRABLE_, 0);
	}
	public DEFERRED_(): TerminalNode {
		return this.getToken(SQLiteParser.DEFERRED_, 0);
	}
	public DELETE_(): TerminalNode {
		return this.getToken(SQLiteParser.DELETE_, 0);
	}
	public DESC_(): TerminalNode {
		return this.getToken(SQLiteParser.DESC_, 0);
	}
	public DETACH_(): TerminalNode {
		return this.getToken(SQLiteParser.DETACH_, 0);
	}
	public DISTINCT_(): TerminalNode {
		return this.getToken(SQLiteParser.DISTINCT_, 0);
	}
	public DROP_(): TerminalNode {
		return this.getToken(SQLiteParser.DROP_, 0);
	}
	public EACH_(): TerminalNode {
		return this.getToken(SQLiteParser.EACH_, 0);
	}
	public ELSE_(): TerminalNode {
		return this.getToken(SQLiteParser.ELSE_, 0);
	}
	public END_(): TerminalNode {
		return this.getToken(SQLiteParser.END_, 0);
	}
	public ESCAPE_(): TerminalNode {
		return this.getToken(SQLiteParser.ESCAPE_, 0);
	}
	public EXCEPT_(): TerminalNode {
		return this.getToken(SQLiteParser.EXCEPT_, 0);
	}
	public EXCLUSIVE_(): TerminalNode {
		return this.getToken(SQLiteParser.EXCLUSIVE_, 0);
	}
	public EXISTS_(): TerminalNode {
		return this.getToken(SQLiteParser.EXISTS_, 0);
	}
	public EXPLAIN_(): TerminalNode {
		return this.getToken(SQLiteParser.EXPLAIN_, 0);
	}
	public FAIL_(): TerminalNode {
		return this.getToken(SQLiteParser.FAIL_, 0);
	}
	public FOR_(): TerminalNode {
		return this.getToken(SQLiteParser.FOR_, 0);
	}
	public FOREIGN_(): TerminalNode {
		return this.getToken(SQLiteParser.FOREIGN_, 0);
	}
	public FROM_(): TerminalNode {
		return this.getToken(SQLiteParser.FROM_, 0);
	}
	public FULL_(): TerminalNode {
		return this.getToken(SQLiteParser.FULL_, 0);
	}
	public GLOB_(): TerminalNode {
		return this.getToken(SQLiteParser.GLOB_, 0);
	}
	public GROUP_(): TerminalNode {
		return this.getToken(SQLiteParser.GROUP_, 0);
	}
	public HAVING_(): TerminalNode {
		return this.getToken(SQLiteParser.HAVING_, 0);
	}
	public IF_(): TerminalNode {
		return this.getToken(SQLiteParser.IF_, 0);
	}
	public IGNORE_(): TerminalNode {
		return this.getToken(SQLiteParser.IGNORE_, 0);
	}
	public IMMEDIATE_(): TerminalNode {
		return this.getToken(SQLiteParser.IMMEDIATE_, 0);
	}
	public IN_(): TerminalNode {
		return this.getToken(SQLiteParser.IN_, 0);
	}
	public INDEX_(): TerminalNode {
		return this.getToken(SQLiteParser.INDEX_, 0);
	}
	public INDEXED_(): TerminalNode {
		return this.getToken(SQLiteParser.INDEXED_, 0);
	}
	public INITIALLY_(): TerminalNode {
		return this.getToken(SQLiteParser.INITIALLY_, 0);
	}
	public INNER_(): TerminalNode {
		return this.getToken(SQLiteParser.INNER_, 0);
	}
	public INSERT_(): TerminalNode {
		return this.getToken(SQLiteParser.INSERT_, 0);
	}
	public INSTEAD_(): TerminalNode {
		return this.getToken(SQLiteParser.INSTEAD_, 0);
	}
	public INTERSECT_(): TerminalNode {
		return this.getToken(SQLiteParser.INTERSECT_, 0);
	}
	public INTO_(): TerminalNode {
		return this.getToken(SQLiteParser.INTO_, 0);
	}
	public IS_(): TerminalNode {
		return this.getToken(SQLiteParser.IS_, 0);
	}
	public ISNULL_(): TerminalNode {
		return this.getToken(SQLiteParser.ISNULL_, 0);
	}
	public JOIN_(): TerminalNode {
		return this.getToken(SQLiteParser.JOIN_, 0);
	}
	public KEY_(): TerminalNode {
		return this.getToken(SQLiteParser.KEY_, 0);
	}
	public LEFT_(): TerminalNode {
		return this.getToken(SQLiteParser.LEFT_, 0);
	}
	public LIKE_(): TerminalNode {
		return this.getToken(SQLiteParser.LIKE_, 0);
	}
	public LIMIT_(): TerminalNode {
		return this.getToken(SQLiteParser.LIMIT_, 0);
	}
	public MATCH_(): TerminalNode {
		return this.getToken(SQLiteParser.MATCH_, 0);
	}
	public NATURAL_(): TerminalNode {
		return this.getToken(SQLiteParser.NATURAL_, 0);
	}
	public NO_(): TerminalNode {
		return this.getToken(SQLiteParser.NO_, 0);
	}
	public NOT_(): TerminalNode {
		return this.getToken(SQLiteParser.NOT_, 0);
	}
	public NOTNULL_(): TerminalNode {
		return this.getToken(SQLiteParser.NOTNULL_, 0);
	}
	public NULL_(): TerminalNode {
		return this.getToken(SQLiteParser.NULL_, 0);
	}
	public OF_(): TerminalNode {
		return this.getToken(SQLiteParser.OF_, 0);
	}
	public OFFSET_(): TerminalNode {
		return this.getToken(SQLiteParser.OFFSET_, 0);
	}
	public ON_(): TerminalNode {
		return this.getToken(SQLiteParser.ON_, 0);
	}
	public OR_(): TerminalNode {
		return this.getToken(SQLiteParser.OR_, 0);
	}
	public ORDER_(): TerminalNode {
		return this.getToken(SQLiteParser.ORDER_, 0);
	}
	public OUTER_(): TerminalNode {
		return this.getToken(SQLiteParser.OUTER_, 0);
	}
	public PLAN_(): TerminalNode {
		return this.getToken(SQLiteParser.PLAN_, 0);
	}
	public PRAGMA_(): TerminalNode {
		return this.getToken(SQLiteParser.PRAGMA_, 0);
	}
	public PRIMARY_(): TerminalNode {
		return this.getToken(SQLiteParser.PRIMARY_, 0);
	}
	public QUERY_(): TerminalNode {
		return this.getToken(SQLiteParser.QUERY_, 0);
	}
	public RAISE_(): TerminalNode {
		return this.getToken(SQLiteParser.RAISE_, 0);
	}
	public RECURSIVE_(): TerminalNode {
		return this.getToken(SQLiteParser.RECURSIVE_, 0);
	}
	public REFERENCES_(): TerminalNode {
		return this.getToken(SQLiteParser.REFERENCES_, 0);
	}
	public REGEXP_(): TerminalNode {
		return this.getToken(SQLiteParser.REGEXP_, 0);
	}
	public REINDEX_(): TerminalNode {
		return this.getToken(SQLiteParser.REINDEX_, 0);
	}
	public RELEASE_(): TerminalNode {
		return this.getToken(SQLiteParser.RELEASE_, 0);
	}
	public RENAME_(): TerminalNode {
		return this.getToken(SQLiteParser.RENAME_, 0);
	}
	public REPLACE_(): TerminalNode {
		return this.getToken(SQLiteParser.REPLACE_, 0);
	}
	public RESTRICT_(): TerminalNode {
		return this.getToken(SQLiteParser.RESTRICT_, 0);
	}
	public RIGHT_(): TerminalNode {
		return this.getToken(SQLiteParser.RIGHT_, 0);
	}
	public ROLLBACK_(): TerminalNode {
		return this.getToken(SQLiteParser.ROLLBACK_, 0);
	}
	public ROW_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_, 0);
	}
	public ROWS_(): TerminalNode {
		return this.getToken(SQLiteParser.ROWS_, 0);
	}
	public SAVEPOINT_(): TerminalNode {
		return this.getToken(SQLiteParser.SAVEPOINT_, 0);
	}
	public SELECT_(): TerminalNode {
		return this.getToken(SQLiteParser.SELECT_, 0);
	}
	public SET_(): TerminalNode {
		return this.getToken(SQLiteParser.SET_, 0);
	}
	public TABLE_(): TerminalNode {
		return this.getToken(SQLiteParser.TABLE_, 0);
	}
	public TEMP_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMP_, 0);
	}
	public TEMPORARY_(): TerminalNode {
		return this.getToken(SQLiteParser.TEMPORARY_, 0);
	}
	public THEN_(): TerminalNode {
		return this.getToken(SQLiteParser.THEN_, 0);
	}
	public TO_(): TerminalNode {
		return this.getToken(SQLiteParser.TO_, 0);
	}
	public TRANSACTION_(): TerminalNode {
		return this.getToken(SQLiteParser.TRANSACTION_, 0);
	}
	public TRIGGER_(): TerminalNode {
		return this.getToken(SQLiteParser.TRIGGER_, 0);
	}
	public UNION_(): TerminalNode {
		return this.getToken(SQLiteParser.UNION_, 0);
	}
	public UNIQUE_(): TerminalNode {
		return this.getToken(SQLiteParser.UNIQUE_, 0);
	}
	public UPDATE_(): TerminalNode {
		return this.getToken(SQLiteParser.UPDATE_, 0);
	}
	public USING_(): TerminalNode {
		return this.getToken(SQLiteParser.USING_, 0);
	}
	public VACUUM_(): TerminalNode {
		return this.getToken(SQLiteParser.VACUUM_, 0);
	}
	public VALUES_(): TerminalNode {
		return this.getToken(SQLiteParser.VALUES_, 0);
	}
	public VIEW_(): TerminalNode {
		return this.getToken(SQLiteParser.VIEW_, 0);
	}
	public VIRTUAL_(): TerminalNode {
		return this.getToken(SQLiteParser.VIRTUAL_, 0);
	}
	public WHEN_(): TerminalNode {
		return this.getToken(SQLiteParser.WHEN_, 0);
	}
	public WHERE_(): TerminalNode {
		return this.getToken(SQLiteParser.WHERE_, 0);
	}
	public WITH_(): TerminalNode {
		return this.getToken(SQLiteParser.WITH_, 0);
	}
	public WITHOUT_(): TerminalNode {
		return this.getToken(SQLiteParser.WITHOUT_, 0);
	}
	public FIRST_VALUE_(): TerminalNode {
		return this.getToken(SQLiteParser.FIRST_VALUE_, 0);
	}
	public OVER_(): TerminalNode {
		return this.getToken(SQLiteParser.OVER_, 0);
	}
	public PARTITION_(): TerminalNode {
		return this.getToken(SQLiteParser.PARTITION_, 0);
	}
	public RANGE_(): TerminalNode {
		return this.getToken(SQLiteParser.RANGE_, 0);
	}
	public PRECEDING_(): TerminalNode {
		return this.getToken(SQLiteParser.PRECEDING_, 0);
	}
	public UNBOUNDED_(): TerminalNode {
		return this.getToken(SQLiteParser.UNBOUNDED_, 0);
	}
	public CURRENT_(): TerminalNode {
		return this.getToken(SQLiteParser.CURRENT_, 0);
	}
	public FOLLOWING_(): TerminalNode {
		return this.getToken(SQLiteParser.FOLLOWING_, 0);
	}
	public CUME_DIST_(): TerminalNode {
		return this.getToken(SQLiteParser.CUME_DIST_, 0);
	}
	public DENSE_RANK_(): TerminalNode {
		return this.getToken(SQLiteParser.DENSE_RANK_, 0);
	}
	public LAG_(): TerminalNode {
		return this.getToken(SQLiteParser.LAG_, 0);
	}
	public LAST_VALUE_(): TerminalNode {
		return this.getToken(SQLiteParser.LAST_VALUE_, 0);
	}
	public LEAD_(): TerminalNode {
		return this.getToken(SQLiteParser.LEAD_, 0);
	}
	public NTH_VALUE_(): TerminalNode {
		return this.getToken(SQLiteParser.NTH_VALUE_, 0);
	}
	public NTILE_(): TerminalNode {
		return this.getToken(SQLiteParser.NTILE_, 0);
	}
	public PERCENT_RANK_(): TerminalNode {
		return this.getToken(SQLiteParser.PERCENT_RANK_, 0);
	}
	public RANK_(): TerminalNode {
		return this.getToken(SQLiteParser.RANK_, 0);
	}
	public ROW_NUMBER_(): TerminalNode {
		return this.getToken(SQLiteParser.ROW_NUMBER_, 0);
	}
	public GENERATED_(): TerminalNode {
		return this.getToken(SQLiteParser.GENERATED_, 0);
	}
	public ALWAYS_(): TerminalNode {
		return this.getToken(SQLiteParser.ALWAYS_, 0);
	}
	public STORED_(): TerminalNode {
		return this.getToken(SQLiteParser.STORED_, 0);
	}
	public TRUE_(): TerminalNode {
		return this.getToken(SQLiteParser.TRUE_, 0);
	}
	public FALSE_(): TerminalNode {
		return this.getToken(SQLiteParser.FALSE_, 0);
	}
	public WINDOW_(): TerminalNode {
		return this.getToken(SQLiteParser.WINDOW_, 0);
	}
	public NULLS_(): TerminalNode {
		return this.getToken(SQLiteParser.NULLS_, 0);
	}
	public FIRST_(): TerminalNode {
		return this.getToken(SQLiteParser.FIRST_, 0);
	}
	public LAST_(): TerminalNode {
		return this.getToken(SQLiteParser.LAST_, 0);
	}
	public FILTER_(): TerminalNode {
		return this.getToken(SQLiteParser.FILTER_, 0);
	}
	public GROUPS_(): TerminalNode {
		return this.getToken(SQLiteParser.GROUPS_, 0);
	}
	public EXCLUDE_(): TerminalNode {
		return this.getToken(SQLiteParser.EXCLUDE_, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_keyword;
	}
}


export class NameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_name;
	}
}


export class Function_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_function_name;
	}
}


export class Schema_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_schema_name;
	}
}


export class Table_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_table_name;
	}
}


export class Table_or_index_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_table_or_index_name;
	}
}


export class Column_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_column_name;
	}
}


export class Collation_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_collation_name;
	}
}


export class Foreign_tableContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_foreign_table;
	}
}


export class Index_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_index_name;
	}
}


export class Trigger_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_trigger_name;
	}
}


export class View_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_view_name;
	}
}


export class Module_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_module_name;
	}
}


export class Pragma_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_pragma_name;
	}
}


export class Savepoint_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_savepoint_name;
	}
}


export class Table_aliasContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_table_alias;
	}
}


export class Transaction_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_transaction_name;
	}
}


export class Window_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_window_name;
	}
}


export class AliasContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_alias;
	}
}


export class FilenameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_filename;
	}
}


export class Base_window_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_base_window_name;
	}
}


export class Simple_funcContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_simple_func;
	}
}


export class Aggregate_funcContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_aggregate_func;
	}
}


export class Table_function_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_table_function_name;
	}
}


export class Any_nameContext extends ParserRuleContext {
	constructor(parser?: SQLiteParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
		this.parser = parser;
	}
	public IDENTIFIER(): TerminalNode {
		return this.getToken(SQLiteParser.IDENTIFIER, 0);
	}
	public keyword(): KeywordContext {
		return this.getTypedRuleContext(KeywordContext, 0) as KeywordContext;
	}
	public STRING_LITERAL(): TerminalNode {
		return this.getToken(SQLiteParser.STRING_LITERAL, 0);
	}
	public OPEN_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.OPEN_PAR, 0);
	}
	public any_name(): Any_nameContext {
		return this.getTypedRuleContext(Any_nameContext, 0) as Any_nameContext;
	}
	public CLOSE_PAR(): TerminalNode {
		return this.getToken(SQLiteParser.CLOSE_PAR, 0);
	}
	public get ruleIndex(): number {
		return SQLiteParser.RULE_any_name;
	}
}
