import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

interface Sqlite3defBinaryConfig {
  readonly tempDir: string;
  readonly sqlite3defVersion: string;
  readonly sqlite3defBinaryPath: string;
}

export async function ensureSqlite3defBinary(config: Sqlite3defBinaryConfig): Promise<string> {
  try {
    await fs.access(config.sqlite3defBinaryPath);
    return config.sqlite3defBinaryPath;
  } catch {
    await fs.mkdir(path.dirname(config.sqlite3defBinaryPath), {recursive: true});
    await downloadAndExtractBinary(config);
    return config.sqlite3defBinaryPath;
  }
}

function getArchiveInfo(version: string): {url: string; binaryName: string; archiveType: 'zip' | 'tar.gz'} {
  const platform = os.platform();
  const arch = os.arch();
  const binaryName = 'sqlite3def';

  if (platform !== 'darwin' && platform !== 'linux') {
    throw new Error(`sqlfu supports only macOS and Linux. Unsupported platform: ${platform}/${arch}`);
  }

  const platformName = platform === 'darwin' ? 'darwin' : platform === 'linux' ? 'linux' : null;
  const archName = arch === 'arm64' ? 'arm64' : arch === 'x64' ? 'amd64' : null;

  if (!platformName || !archName) {
    throw new Error(`Unsupported platform for sqlite3def: ${platform}/${arch}`);
  }

  const archiveType = platform === 'darwin' ? 'zip' : 'tar.gz';

  return {
    binaryName,
    archiveType,
    url: `https://github.com/sqldef/sqldef/releases/download/${version}/sqlite3def_${platformName}_${archName}.${archiveType}`,
  };
}

async function downloadAndExtractBinary(config: Sqlite3defBinaryConfig): Promise<void> {
  const archive = getArchiveInfo(config.sqlite3defVersion);
  const archivePath = path.join(config.tempDir, `${archive.binaryName}.${archive.archiveType}`);

  const response = await fetch(archive.url);
  if (!response.ok) {
    throw new Error(`Failed to download sqlite3def from ${archive.url} (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.mkdir(config.tempDir, {recursive: true});
  await fs.writeFile(archivePath, Buffer.from(arrayBuffer));

  const childProcess = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    const child =
      archive.archiveType === 'zip'
        ? childProcess.spawn('unzip', ['-o', archivePath, '-d', path.dirname(config.sqlite3defBinaryPath)], {
            stdio: 'inherit',
          })
        : childProcess.spawn('tar', ['-xzf', archivePath, '-C', path.dirname(config.sqlite3defBinaryPath)], {
            stdio: 'inherit',
          });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Failed to extract sqlite3def archive (exit ${code ?? 'unknown'})`));
    });
    child.on('error', reject);
  });

  await fs.chmod(config.sqlite3defBinaryPath, 0o755);
  await fs.rm(archivePath, {force: true});
}
