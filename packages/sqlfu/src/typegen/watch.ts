import path from 'node:path';

import {generateQueryTypesForConfig} from './index.js';
import {loadProjectConfig} from '../node/config.js';
import {createNodeHost} from '../node/host.js';
import {watchAndRegenerate} from '../node/watcher.js';
import type {SqlfuHost} from '../host.js';
import type {SqlfuProjectConfig} from '../types.js';

export async function watchGenerateQueryTypes(): Promise<void> {
  const config = await loadProjectConfig();
  const host = await createNodeHost();

  const abortController = new AbortController();
  const shutdown = () => abortController.abort();
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  try {
    await watchGenerateQueryTypesForConfig(config, host, {signal: abortController.signal});
  } finally {
    process.off('SIGINT', shutdown);
    process.off('SIGTERM', shutdown);
  }
}

export async function watchGenerateQueryTypesForConfig(
  config: SqlfuProjectConfig,
  host: SqlfuHost,
  options: {
    signal?: AbortSignal;
    onReady?: () => void;
    logger?: Pick<Console, 'log' | 'error'>;
  } = {},
): Promise<void> {
  if (config.generate.authority === 'live_schema') {
    throw new Error(
      "sqlfu generate --watch does not support `generate.authority: 'live_schema'`. " +
        "Database changes can't be observed as file events. " +
        "Switch to 'desired_schema' (default), 'migrations', or 'migration_history' for watch mode.",
    );
  }

  const generatedDir = path.join(config.queries, '.generated');

  await watchAndRegenerate({
    watchPaths: collectWatchPaths(config),
    ignored: (eventPath) => isInsideGenerated(eventPath, generatedDir),
    shouldRegenerate: null,
    describeEventPath: (eventPath) => path.relative(config.projectRoot, eventPath) || eventPath,
    generate: () => generateQueryTypesForConfig(config, host),
    signal: options.signal,
    onReady: options.onReady,
    logger: options.logger ?? console,
  });
}

function collectWatchPaths(config: SqlfuProjectConfig): string[] {
  const paths = new Set<string>();
  paths.add(config.queries);
  if (config.generate.authority === 'desired_schema') {
    paths.add(config.definitions);
  }
  if (
    (config.generate.authority === 'migrations' || config.generate.authority === 'migration_history') &&
    config.migrations
  ) {
    paths.add(config.migrations.path);
  }
  return [...paths];
}

function isInsideGenerated(candidate: string, generatedDir: string): boolean {
  const relative = path.relative(generatedDir, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
