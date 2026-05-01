import {EventEmitter} from 'node:events';
import {watch as watchFs, type FSWatcher} from 'node:fs';
import {glob, readFile, stat} from 'node:fs/promises';
import path from 'node:path';

type WatchOptions = {
  ignoreInitial?: boolean;
  ignored?: (watchedPath: string) => boolean;
};

type FileSnapshot = Map<string, Buffer>;

type WatchRoot = {
  path: string;
  recursive: boolean;
};

const RESCAN_INTERVAL_MS = 500;

export function watch(watchPaths: string[], options: WatchOptions) {
  const watcher = new FileWatcher(watchPaths, options);
  void watcher.start();
  return watcher;
}

class FileWatcher extends EventEmitter {
  private snapshot: FileSnapshot = new Map();
  private nativeWatchers: FSWatcher[] = [];
  private closed = false;
  private scanRunning = false;
  private scanAgain = false;
  private rescanInterval: NodeJS.Timeout | undefined;

  constructor(
    private watchPaths: string[],
    private options: WatchOptions,
  ) {
    super();
  }

  async start() {
    try {
      this.snapshot = await this.readSnapshot();
      await this.startNativeWatchers();

      if (!this.options.ignoreInitial) {
        for (const filePath of this.snapshot.keys()) {
          this.emit('add', filePath);
        }
      }

      this.startPollingFallback();
      this.emit('ready');
    } catch (error) {
      this.emitError(error);
      this.emit('ready');
    }
  }

  async close() {
    this.closed = true;
    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
      this.rescanInterval = undefined;
    }
    for (const nativeWatcher of this.nativeWatchers) {
      nativeWatcher.close();
    }
    this.nativeWatchers = [];
    this.removeAllListeners();
  }

  private async startNativeWatchers() {
    const watchedRoots = new Set<string>();
    for (const watchPath of this.watchPaths) {
      const root = await this.resolveWatchRoot(watchPath);
      if (!root) continue;

      const dedupeKey = `${root.recursive}:${root.path}`;
      if (watchedRoots.has(dedupeKey)) continue;
      watchedRoots.add(dedupeKey);

      try {
        const nativeWatcher = watchFs(root.path, {recursive: root.recursive}, () => {
          this.requestScan();
        });
        nativeWatcher.on('error', (error) => this.emitError(error));
        this.nativeWatchers.push(nativeWatcher);
      } catch (error) {
        this.emitError(error);
      }
    }
  }

  private startPollingFallback() {
    // Tradeoff vs chokidar: native fs.watch can miss setup-time or atomic-save
    // events on some platforms. The intentionally inefficient fallback keeps
    // correctness simple by periodically re-running the same full snapshot diff.
    this.rescanInterval = setInterval(() => this.requestScan(), RESCAN_INTERVAL_MS);
    this.rescanInterval.unref();
  }

  private async resolveWatchRoot(watchPath: string): Promise<WatchRoot | null> {
    const stats = await stat(watchPath).catch(() => null);
    if (stats?.isDirectory()) {
      return {path: watchPath, recursive: true};
    }
    if (stats?.isFile()) {
      return {path: path.dirname(watchPath), recursive: false};
    }

    // Missing files can still be created later. Treat paths with an extension
    // as intended files and watch their parent directory.
    if (path.extname(watchPath)) {
      return {path: path.dirname(watchPath), recursive: false};
    }

    this.emitError(new Error(`Cannot watch missing path ${watchPath}`));
    return null;
  }

  private requestScan() {
    if (this.closed) return;
    if (this.scanRunning) {
      this.scanAgain = true;
      return;
    }
    void this.scan();
  }

  private async scan() {
    this.scanRunning = true;
    try {
      do {
        this.scanAgain = false;
        await this.emitSnapshotDiff(await this.readSnapshot());
      } while (this.scanAgain && !this.closed);
    } catch (error) {
      this.emitError(error);
    } finally {
      this.scanRunning = false;
    }
  }

  private async emitSnapshotDiff(nextSnapshot: FileSnapshot) {
    if (this.closed) return;

    for (const [filePath, contents] of nextSnapshot) {
      const previousContents = this.snapshot.get(filePath);
      if (!previousContents) {
        this.emit('add', filePath);
      } else if (!previousContents.equals(contents)) {
        this.emit('change', filePath);
      }
    }

    for (const filePath of this.snapshot.keys()) {
      if (!nextSnapshot.has(filePath)) {
        this.emit('unlink', filePath);
      }
    }

    this.snapshot = nextSnapshot;
  }

  private async readSnapshot() {
    const snapshot: FileSnapshot = new Map();
    for (const watchPath of this.watchPaths) {
      const files = await this.findFiles(watchPath);
      for (const filePath of files) {
        if (this.isIgnored(filePath)) continue;
        const contents = await readFile(filePath).catch(() => null);
        if (contents) {
          snapshot.set(filePath, contents);
        }
      }
    }
    return snapshot;
  }

  private async findFiles(watchPath: string): Promise<string[]> {
    const stats = await stat(watchPath).catch(() => null);
    if (!stats) return [];
    if (stats.isFile()) return [watchPath];
    if (!stats.isDirectory()) return [];

    const files: string[] = [];
    // fs.glob is available in stable Node 22+. This watcher intentionally
    // takes that minimum instead of carrying chokidar during sqlfu pre-alpha.
    for await (const relativePath of glob('**/*', {
      cwd: watchPath,
      exclude: (candidate) => this.isIgnored(path.resolve(watchPath, String(candidate))),
    })) {
      const filePath = path.resolve(watchPath, relativePath);
      const entryStats = await stat(filePath).catch(() => null);
      if (entryStats?.isFile()) {
        files.push(filePath);
      }
    }
    return files;
  }

  private isIgnored(filePath: string) {
    return this.options.ignored?.(filePath) || false;
  }

  private emitError(error: unknown) {
    if (this.closed || this.listenerCount('error') === 0) return;
    this.emit('error', error);
  }
}
