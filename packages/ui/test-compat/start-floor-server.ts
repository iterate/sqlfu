import childProcess from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';

import semver from 'semver';

import {SUPPORTED_SERVER_RANGE} from '../src/startup-error.ts';

// Boots the studio the way sqlfu.dev/ui meets a user's machine: today's UI
// build served statically, talking to the OLDEST server version that
// SUPPORTED_SERVER_RANGE claims to support, installed from npm. If the floor
// version has not been published yet (a PR bumps the range ahead of a
// release), the workspace server stands in so the harness still runs.
//
// Used by playwright.compat.config.ts as the webServer command.

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.join(currentDir, '..');
const templateRoot = path.join(uiRoot, 'test', 'template-project');

const apiPort = Number(readOption('--api-port') || '56091');
const uiPort = Number(readOption('--ui-port') || '3219');
const skipBuild = process.argv.includes('--skip-build');

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const floor = semver.minVersion(SUPPORTED_SERVER_RANGE)?.version;
  if (!floor) {
    throw new Error(`Could not derive a minimum version from SUPPORTED_SERVER_RANGE=${SUPPORTED_SERVER_RANGE}`);
  }

  const serverCommand = (await isPublished(floor))
    ? ['npx', '-y', `sqlfu@${floor}`]
    : [path.join(uiRoot, 'node_modules', '.bin', 'sqlfu')];
  if (serverCommand[0] !== 'npx') {
    console.warn(
      `sqlfu@${floor} is not published on npm yet; falling back to the workspace server. ` +
        'The floor is only enforced once that version is released.',
    );
  }

  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sqlfu-floor-compat-'));
  await fs.cp(templateRoot, projectDir, {recursive: true});
  await seedProjectDatabase(projectDir);

  const backend = spawnProcess(
    `sqlfu@${floor}`,
    [...serverCommand, 'serve', '--config', path.join(projectDir, 'sqlfu.config.ts'), '--port', String(apiPort)],
    {cwd: projectDir},
  );

  try {
    await waitForHttpServerOrExit(backend, `http://127.0.0.1:${apiPort}`);

    if (!skipBuild) {
      await runProcess('ui-build', ['pnpm', 'build'], {cwd: uiRoot});
    }

    const apiOrigin = `http://127.0.0.1:${apiPort}`;
    await fs.writeFile(
      path.join(uiRoot, 'dist', 'runtime-config.js'),
      `window.SQLFU_API_ORIGIN = ${JSON.stringify(apiOrigin)};\n`,
      'utf8',
    );

    const ui = spawnProcess(
      'ui',
      ['pnpm', 'exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(uiPort), '--strictPort'],
      {cwd: uiRoot},
    );

    try {
      await waitForHttpServerOrExit(ui, `http://127.0.0.1:${uiPort}`);
      console.log(`floor-compat UI on http://127.0.0.1:${uiPort} -> backend sqlfu@${floor} on ${apiOrigin}`);
      await waitForShutdown();
    } finally {
      ui.kill('SIGTERM');
      await waitForExit(ui);
    }
  } finally {
    backend.kill('SIGTERM');
    await waitForExit(backend);
    await fs.rm(projectDir, {recursive: true, force: true});
  }
}

async function isPublished(version: string) {
  const result = childProcess.spawnSync('npm', ['view', `sqlfu@${version}`, 'version'], {encoding: 'utf8'});
  return result.status === 0 && result.stdout.trim() === version;
}

// Mirrors the dev-project seed in packages/sqlfu/src/ui/server.ts so the spec
// can assert on the same fixture rows the main studio suite uses.
async function seedProjectDatabase(projectDir: string) {
  const definitions = await fs.readFile(path.join(projectDir, 'definitions.sql'), 'utf8');
  const db = new DatabaseSync(path.join(projectDir, 'app.db'));
  try {
    db.exec(definitions);
    db.exec(`
      insert into posts (slug, title, body, published) values
        ('hello-world', 'Hello World', 'First post body', 1),
        ('draft-notes', 'Draft Notes', 'Unpublished notes', 0);
    `);
  } finally {
    db.close();
  }
}

function spawnProcess(label: string, command: string[], options: {cwd: string}) {
  const [bin, ...args] = command;
  if (!bin) {
    throw new Error(`Missing command for ${label}`);
  }

  const child = childProcess.spawn(bin, args, {
    cwd: options.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk.toString()}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk.toString()}`);
  });

  child.once('exit', (code, signal) => {
    if (code === 0 || signal === 'SIGTERM' || signal === 'SIGINT') {
      return;
    }
    console.error(`[${label}] exited unexpectedly with code ${code} signal ${signal}`);
  });

  return child;
}

async function runProcess(label: string, command: string[], options: {cwd: string}) {
  const child = spawnProcess(label, command, options);
  const [exitCode, signal] = await onceExit(child);
  if (exitCode !== 0) {
    throw new Error(`${label} failed with code ${exitCode} signal ${signal}`);
  }
}

async function waitForHttpServer(origin: string) {
  const timeout = Date.now() + 60_000;

  while (Date.now() < timeout) {
    try {
      const status = await requestStatus(origin);
      if (status < 500) {
        return;
      }
    } catch {}

    await sleep(250);
  }

  throw new Error(`Timed out waiting for ${origin}`);
}

async function waitForHttpServerOrExit(child: childProcess.ChildProcess, origin: string) {
  await Promise.race([waitForHttpServer(origin), waitForUnexpectedExit(child)]);
}

function waitForUnexpectedExit(child: childProcess.ChildProcess) {
  return new Promise<never>((_, reject) => {
    child.once('exit', (code, signal) => {
      reject(new Error(`Process exited before becoming ready with code ${code} signal ${signal}`));
    });
  });
}

function requestStatus(origin: string) {
  return new Promise<number>((resolve, reject) => {
    const url = new URL(origin);
    const request = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port),
        path: '/',
        method: 'GET',
        timeout: 1_000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode || 0);
      },
    );

    request.once('error', reject);
    request.once('timeout', () => {
      request.destroy(new Error(`Timed out waiting for ${origin}`));
    });
    request.end();
  });
}

function readOption(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function waitForShutdown() {
  return new Promise<void>((resolve) => {
    const onSignal = () => {
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);
      resolve();
    };

    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
  });
}

function waitForExit(child: childProcess.ChildProcess) {
  return new Promise<void>((resolve) => {
    if (child.exitCode != null || child.killed) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
  });
}

function onceExit(child: childProcess.ChildProcess) {
  return new Promise<[number | null, NodeJS.Signals | null]>((resolve) => {
    if (child.exitCode != null) {
      resolve([child.exitCode, null]);
      return;
    }
    child.once('exit', (code, signal) => resolve([code, signal]));
  });
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
