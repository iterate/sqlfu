// The TypeScript content mapper for `.sql` files (TypeScript 7.1 `contentMappers`, microsoft/typescript-go#4712).
// `tsc --runExternalCode` and the editor spawn this process (package.json `typescript.contentMapper`) and ask it
// for the TypeScript behind each `.sql` file in the program: a query file becomes the module `sqlfu generate`
// would write to `.generated/`, typed from the project's schema source, and anything else (`definitions.sql`,
// migrations) an empty module.
//
// The JSON-RPC framing is adapted from reylo (https://github.com/colinhacks/reylo, src/rpc.ts, MIT, Copyright
// (c) Colin McDonnell): LSP-style `Content-Length` headers over stdio, TypeScript sending every request.
// Changes: inlined here, one handler table, and stdout reserved for the protocol.
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {findNearestConfigPath} from './config.js';
import {createQueryModules} from './query-modules.js';

// stdout is the protocol. Anything sqlfu or the analyzer logs goes to stderr instead.
console.log = console.error;
console.info = console.error;

/** Diagnostic codes, shown as `sqlfu1` etc. */
const SQLFU_DIAGNOSTIC_CODE = 1;

let queryModules = createQueryModules();

const handlers: Record<string, (params: any) => unknown> = {
  initialize: () => ({positionEncoding: 'utf-16', diagnosticSource: 'sqlfu'}),

  async openProject(params: {configFileName: string}) {
    // A re-opened project may follow a config or schema edit: start again from what's on disk.
    await queryModules[Symbol.asyncDispose]();
    queryModules = createQueryModules();

    const configPath = await findNearestConfigPath(path.dirname(params.configFileName));
    const watchedFiles = configPath ? [configPath, path.join(path.dirname(configPath), 'definitions.sql')] : [];
    const identity = createHash('sha256');
    for (const file of watchedFiles) identity.update(file).update(await fs.readFile(file, 'utf8').catch(() => ''));
    return {configIdentity: identity.digest('hex'), watchedFiles};
  },

  async transform(params: {fileName: string; content: string}) {
    try {
      const rendered = await queryModules.render(params.fileName, params.content);
      if (!rendered) return {extension: '.ts', text: 'export {};\n', diagnostics: []};
      return {
        extension: '.ts',
        text: rendered.text,
        diagnostics: rendered.diagnostics.map((diagnostic) => ({
          messageText: diagnostic.message,
          start: diagnostic.start,
          length: diagnostic.length,
          code: SQLFU_DIAGNOSTIC_CODE,
        })),
      };
    } catch (error) {
      return {
        extension: '.ts',
        text: 'export {};\n',
        diagnostics: [{messageText: String(error), start: 0, length: 0, code: SQLFU_DIAGNOSTIC_CODE}],
      };
    }
  },

  closeProject: () => ({}),
};

let buffer = Buffer.alloc(0);
process.stdin.on('end', async () => {
  await queryModules[Symbol.asyncDispose]();
  process.exit(0);
});
process.stdin.on('data', (chunk: Buffer) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;
    const header = buffer.subarray(0, headerEnd).toString('ascii');
    const contentLength = /Content-Length:\s*(\d+)/i.exec(header);
    if (!contentLength) throw new Error(`sqlfu content mapper: bad message header ${JSON.stringify(header)}`);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + Number(contentLength[1]);
    if (buffer.length < bodyEnd) return;
    const message = JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString('utf8'));
    buffer = buffer.subarray(bodyEnd);
    void respond(message);
  }
});

async function respond(message: {id?: number | string; method: string; params?: unknown}) {
  const handler = handlers[message.method];
  let response: Record<string, unknown>;
  try {
    if (!handler) throw new Error(`Unknown method ${message.method}`);
    response = {jsonrpc: '2.0', id: message.id, result: (await handler(message.params)) || {}};
  } catch (error) {
    response = {jsonrpc: '2.0', id: message.id, error: {code: -32603, message: String(error)}};
  }
  if (message.id === undefined) return;
  const payload = Buffer.from(JSON.stringify(response), 'utf8');
  process.stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
  process.stdout.write(payload);
}
