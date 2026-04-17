/*
 * Vendored from https://github.com/wsporto/typesql-parser at version 0.0.3 (MIT).
 *
 * See ./AGENTS.md for the upstream pin and the set of local modifications. In particular,
 * `antlr4` imports are redirected to our vendored copy under `src/vendor/antlr4` so this
 * tree does not require the upstream `antlr4` package at runtime.
 */
export * from '../antlr4/index.js';