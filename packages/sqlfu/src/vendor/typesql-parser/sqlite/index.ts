import { CharStreams, CommonTokenStream } from '../../antlr4/index.js'
import SQLiteParser from './SQLiteParser.js'
import SQLiteLexer from './SQLiteLexer.js'

export * from './SQLiteLexer.js'
export * from './SQLiteParser.js'

export function parseSql(sql: string): SQLiteParser {
	const input = CharStreams.fromString(sql)
	const lexer = new SQLiteLexer(input)
	const parser = new SQLiteParser(new CommonTokenStream(lexer))
	return parser
}