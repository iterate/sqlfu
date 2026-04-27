import path from 'node:path';

export interface SqlfuCliArgv {
  argv: string[];
  configPath?: string;
}

export function extractSqlfuCliArgv(argv: string[]): SqlfuCliArgv {
  const nextArgv: string[] = [];
  let configPath: string | undefined;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--') {
      nextArgv.push(...argv.slice(index));
      break;
    }

    if (arg === '--config') {
      if (configPath) {
        throw new Error('Pass --config at most once.');
      }
      const value = argv[index + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('Missing value for --config.');
      }
      configPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--config=')) {
      if (configPath) {
        throw new Error('Pass --config at most once.');
      }
      const value = arg.slice('--config='.length);
      if (!value) {
        throw new Error('Missing value for --config.');
      }
      configPath = value;
      continue;
    }

    nextArgv.push(arg);
  }

  return {
    argv: nextArgv,
    configPath,
  };
}

export function resolveCliConfigPath(configPath: string, cwd: string): string {
  return path.isAbsolute(configPath) ? path.normalize(configPath) : path.resolve(cwd, configPath);
}
