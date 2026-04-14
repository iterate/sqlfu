import { CharStreams, CommonTokenStream } from '../../antlr4/index.js'
import PostgreSQLParser from './PostgreSQLParser.js'
import PostgreSQLLexer from './PostgreSQLLexer.js'

export function parseSql(sql: string): PostgreSQLParser {
	const input = CharStreams.fromString(sql);
	const lexer = new PostgreSQLLexer(input);
	const parser = new PostgreSQLParser(new CommonTokenStream(lexer));
	return parser;
}