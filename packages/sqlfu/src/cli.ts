#!/usr/bin/env node

import {createCli, yamlTableConsoleLogger} from 'trpc-cli';

import {router} from './api.js';

export function createSqlfuCli() {
  return createCli({
    router,
    name: 'sqlfu',
    context: {},
  });
}

await createSqlfuCli().run({
  logger: yamlTableConsoleLogger,
});
