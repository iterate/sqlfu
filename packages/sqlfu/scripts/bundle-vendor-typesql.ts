import * as esbuild from 'esbuild';
import {readFile, rm} from 'node:fs/promises';
import {resolve} from 'node:path';

const pkgRoot = resolve(import.meta.dirname, '..');
const distVendor = resolve(pkgRoot, 'dist/vendor');

// The ANTLR-generated MySQLParser.ts and MySQLLexer.ts ship:
//   - 2+ MB of `_serializedATN` number-literal parse tables
//   - thousands of grammar-rule parse methods
//   - `_ATN` / `DecisionsToDFA` initializers that deserialize those tables at
//     module-load time
// The sqlite path imports *only* the static token/rule constants and the
// `*Context` classes that live in the same file, never instantiates the
// parser or lexer, and never calls their parse methods. This esbuild plugin
// strips the parse machinery at bundle time — leaving the static constants
// (above) and the context classes (below) intact — so the bundle tree-shakes
// the parse tables down to nothing.
//
// Idempotent and source-preserving: the on-disk .ts files are untouched, so
// upstream resyncs stay a mechanical copy-over (see typesql-parser/CLAUDE.md).
//
// The anchors below identify two lines in each file: the getter
// `public get serializedATN()` marks the start of the removable region, and
// `static DecisionsToDFA` marks its end. If upstream regenerates the parsers,
// verify these anchors still appear exactly once per file.
const gutAntlrParserPlugin: esbuild.Plugin = {
	name: 'gut-antlr-parsers',
	setup(build) {
		const targets = new Set([
			resolve(pkgRoot, 'src/vendor/typesql-parser/mysql/MySQLParser.ts'),
			resolve(pkgRoot, 'src/vendor/typesql-parser/mysql/MySQLLexer.ts'),
		]);

		build.onLoad({filter: /typesql-parser\/mysql\/MySQL(Parser|Lexer)\.ts$/}, async (args) => {
			if (!targets.has(args.path)) return null;
			const source = await readFile(args.path, 'utf8');

			const startMatch = source.match(/^[ \t]*public get serializedATN\(\).*$/m);
			const endMatch = source.match(/^[ \t]*static DecisionsToDFA.*$/m);
			if (!startMatch || !endMatch) {
				throw new Error(`gut-antlr-parsers: anchors not found in ${args.path}`);
			}
			const startIdx = startMatch.index!;
			const endIdx = endMatch.index! + endMatch[0].length;

			const stub = [
				'',
				'\t// sqlfu: parse-table data, parse methods, and ATN initializers stripped',
				"\t// at bundle time by scripts/bundle-vendor-typesql.ts. Instantiating this",
				'\t// class at runtime will fail fast.',
				'\tpublic static readonly _serializedATN: number[] = [];',
				'',
			].join('\n');

			const contents = source.slice(0, startIdx) + stub + source.slice(endIdx);
			return {contents, loader: 'ts'};
		});
	},
};

await esbuild.build({
	entryPoints: [resolve(pkgRoot, 'src/vendor/typesql/sqlfu.ts')],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node20',
	outfile: resolve(distVendor, 'typesql/sqlfu.js'),
	treeShaking: true,
	minify: true,
	legalComments: 'inline',
	external: [
		'bun:sqlite',
		'better-sqlite3',
		'libsql',
		'@libsql/client',
		'@sqlite.org/sqlite-wasm',
		'node:*',
	],
	plugins: [gutAntlrParserPlugin],
	logLevel: 'warning',
});

const toDelete = [
	'typesql-parser',
	'antlr4',
	'code-block-writer',
	'small-utils.js',
	'small-utils.js.map',
	'small-utils.d.ts',
	'small-utils.d.ts.map',
	'typesql/cli.js',
	'typesql/cli.js.map',
	'typesql/codegen',
	'typesql/describe-dynamic-query.js',
	'typesql/describe-dynamic-query.js.map',
	'typesql/describe-nested-query.js',
	'typesql/describe-nested-query.js.map',
	'typesql/describe-query.js',
	'typesql/describe-query.js.map',
	'typesql/drivers',
	'typesql/dialects',
	'typesql/load-config.js',
	'typesql/load-config.js.map',
	'typesql/mysql-mapping.js',
	'typesql/mysql-mapping.js.map',
	'typesql/mysql-query-analyzer',
	'typesql/schema-info.js',
	'typesql/schema-info.js.map',
	'typesql/sql-generator.js',
	'typesql/sql-generator.js.map',
	'typesql/sqlfu.js.map',
	'typesql/sqlite-query-analyzer',
	'typesql/ts-dynamic-query-descriptor.js',
	'typesql/ts-dynamic-query-descriptor.js.map',
	'typesql/ts-nested-descriptor.js',
	'typesql/ts-nested-descriptor.js.map',
	'typesql/types.js',
	'typesql/types.js.map',
	'typesql/util.js',
	'typesql/util.js.map',
	'typesql/utility-types.js',
	'typesql/utility-types.js.map',
];

for (const p of toDelete) {
	await rm(resolve(distVendor, p), {recursive: true, force: true});
}
