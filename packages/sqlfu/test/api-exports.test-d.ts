import {config, serve} from '../src/api/exports.js';
import type {SqlfuProjectConfig} from '../src/types.js';

// `config()` resolves the loaded project config, not `unknown`.
declare const loadedConfig: Awaited<ReturnType<typeof config>>;
const projectConfig: SqlfuProjectConfig = loadedConfig;
void projectConfig;

// `serve()` resolves a server handle the caller can inspect and stop.
declare const server: Awaited<ReturnType<typeof serve>>;
const port: number = server.port;
const stop: () => Promise<void> = server.stop;
void port;
void stop;
