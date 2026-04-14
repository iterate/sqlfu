import {
  CharStream, CharStreams,
  CommonTokenStream,
  BailErrorStrategy,
  DefaultErrorStrategy,
  RuleContext
} from '../../antlr4/index.js'
import MySQLParser from './MySQLParser.js'
import MySQLLexer from './MySQLLexer.js'
import { versionToNumber } from './lib/version.js'
import { PredictionMode } from '../../antlr4/index.js'
import { SqlMode } from './common.js'
import { RuleName } from './lib/rule-name.js'

/** Statement represents a single MySQL query */
export interface Statement {
  /** The text of the statement */
  text: string
  /** The zero-based offset of the starting position of the statement in the original text */
  start: number
  /** The zero-based offset of the stopping position of the statement in the original text */
  stop: number
}

/** ParseResult represents all relevant results of parsing a query */
export interface ParseResult {
  /** The listener during the parsing phase */
  // parserListener: MySQLParserListener
  /** The token stream that was fed into the parser */
  tokenStream: CommonTokenStream
  /** The input stream that was fed into the lexer */
  inputStream: CharStream
  /** The generated MySQL parser */
  parser: MySQLParser
  /** The generated MySQL lexer */
  lexer: MySQLLexer
  /** The parse tree */
  tree: RuleContext
  /** The references found during parsing (e.g. tables, columns, etc.) */
  // references: References
}

/** ParserOptions represents the options passed into the parser */
export interface ParserOptions {
  /* MySQL charsets e.g. [ "_utf8" ] */
  readonly charsets?: string[]
  /* MySQL version. e.g. "5.7.7"  */
  readonly version?: string
  /* MySQL mode e.g. SqlMode.AnsiQuotes */
  readonly mode?: SqlMode
}

export default class Parser {
  charsets: string[]
  version: string
  mode: SqlMode

  public constructor(options: ParserOptions = {}) {
    this.mode = options.mode || SqlMode.NoMode
    this.version = options.version || '5.7.7'
    this.charsets = options.charsets || []
  }

  /**
   * Parse the given MySQL query. Execution order:
   *
   *  1. Initialize streams and lexer/parser
   *  2. Remove error listeners
   *  3. Set MySQL version/mode/charsets in the parser and lexer
   *  4. Prepare listeners
   *  5. Parse query in two-stage process
   *  6. Resolve references found during parse
   *  7. Return relevant parsing results
   *
   * @param query - the query to parse
   * @param context - the optional rule context to invoke. defaults to `.query()`
   * @returns ParseResult
   */
  public parse(query: string, context: RuleName = RuleName.query): ParseResult {
    const inputStream = CharStreams.fromString(query)
    const lexer = new MySQLLexer(inputStream)
    const tokenStream = new CommonTokenStream(lexer)
    const parser = new MySQLParser(tokenStream)

    // remove antlr default error listeners
    lexer.removeErrorListeners()
    parser.removeErrorListeners()

    // set MySQL version
    const version = versionToNumber(this.version)
    parser.serverVersion = version
    lexer.serverVersion = version

    // set MySQL mode
    parser.sqlMode = this.mode
    lexer.sqlMode = this.mode

    // set MySQL charsets
    lexer.charsets = this.charsets

    // prepare parse listener
    // const parserListener = this.parserListener || new ParserListener()
    // parser.addParseListener(parserListener)

    // two-step parsing process
    //    step 1: attempt SLL that almost always works and is fast
    //    step 2: if step 1 fails, use full LL parse to ensure we have a real failure
    parser._interp.predictionMode = PredictionMode.SLL;
    parser._errHandler = new BailErrorStrategy()
    let tree: RuleContext
    try {
      tree = parser[context]()
    } catch (e) {
      inputStream.reset()
      parser._errHandler = new DefaultErrorStrategy()
      parser._interp.predictionMode = PredictionMode.LL;
      tree = parser[context]()
    }

    return {
      // parserListener,
      tokenStream,
      inputStream,
      // references,
      parser,
      lexer,
      tree
    }
  }
}
