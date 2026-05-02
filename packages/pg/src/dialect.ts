/*
 * pgDialect — postgres implementation of sqlfu's `Dialect` contract.
 *
 * Architecture: each dialect concern (formatter, schemadiff, migration table
 * DDL, advisory lock, typegen) is a small focused module under `./impl/*`.
 * `pgDialect` here is a thin aggregator. Mirrors the shape of `sqliteDialect`
 * in the main `sqlfu` package — the contract is identical.
 */
import type {Dialect} from 'sqlfu';

import {pgDiffSchema} from './impl/schemadiff.js';
import {pgFormatSql} from './impl/format.js';
import {pgQuoteIdentifier} from './impl/identifiers.js';
import {pgDefaultMigrationTableDdl, pgWithMigrationLock} from './impl/migrations.js';
import {pgAnalyzeQueries, pgLoadSchemaForTypegen, pgMaterializeTypegenSchema} from './impl/typegen.js';

export const pgDialect: Dialect = {
  name: 'postgresql',
  diffSchema: pgDiffSchema,
  formatSql: pgFormatSql,
  quoteIdentifier: pgQuoteIdentifier,
  defaultMigrationTableDdl: pgDefaultMigrationTableDdl,
  withMigrationLock: pgWithMigrationLock,
  materializeTypegenSchema: pgMaterializeTypegenSchema,
  loadSchemaForTypegen: pgLoadSchemaForTypegen,
  analyzeQueries: pgAnalyzeQueries,
};
