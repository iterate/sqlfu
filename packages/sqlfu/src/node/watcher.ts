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

const REGENERATE_DEBOUNCE_MS = 150;

/**
 * The shared generate-on-change loop behind `sqlfu generate --watch`, used by
 * both the file-backed and inline modes: initial run, debounced events,
 * coalescing (events arriving mid-generate queue exactly one follow-up run),
 * and ready/abort/close lifecycle. Generate failures are logged, not fatal —
 * the watcher keeps running so the next change can recover.
 */
export async function watchAndRegenerate(input: {
  watchPaths: string[];
  /** Filter paths out of watching and events (e.g. the generated output dir). */
  ignored: ((eventPath: string) => boolean) | null;
  /** Veto a debounced event, e.g. to skip the generator's own writes. */
  shouldRegenerate: ((eventPath: string) => Promise<boolean>) | null;
  describeEventPath: (eventPath: string) => string;
  generate: () => Promise<unknown>;
  signal: AbortSignal | undefined;
  onReady: (() => void) | undefined;
  logger: Pick<Console, 'log' | 'error'>;
}): Promise<void> {
  const {logger} = input;
  let running = false;
  let pending = false;
  let pendingReason = '';

  const runGenerate = async (reason: string) => {
    if (running) {
      pending = true;
      pendingReason = reason;
      return;
    }
    running = true;
    let nextReason = reason;
    try {
      do {
        pending = false;
        logger.log(`sqlfu generate (${nextReason})`);
        try {
          await input.generate();
        } catch (error) {
          logger.error(`sqlfu generate failed: ${formatWatchError(error)}`);
        }
        nextReason = pendingReason;
      } while (pending);
    } finally {
      running = false;
    }
  };

  await runGenerate('initial run');

  const debounce = createDebouncer(REGENERATE_DEBOUNCE_MS);
  const onEvent = (eventName: string, eventPath: string) => {
    if (input.ignored?.(eventPath)) return;
    debounce(() => {
      void (async () => {
        if (input.shouldRegenerate && !(await input.shouldRegenerate(eventPath))) return;
        await runGenerate(`${eventName}: ${input.describeEventPath(eventPath)}`);
      })();
    });
  };

  const watcher = watch(input.watchPaths, {ignoreInitial: true, ignored: input.ignored || undefined});

  watcher.on('add', (eventPath) => onEvent('add', eventPath));
  watcher.on('change', (eventPath) => onEvent('change', eventPath));
  watcher.on('unlink', (eventPath) => onEvent('unlink', eventPath));
  watcher.on('error', (error) => logger.error(`sqlfu watcher error: ${formatWatchError(error)}`));

  await new Promise<void>((resolve) => watcher.once('ready', () => resolve()));
  logger.log(`sqlfu watching for changes in:\n${input.watchPaths.map((value) => `  ${value}`).join('\n')}`);
  input.onReady?.();

  try {
    await new Promise<void>((resolve) => {
      if (input.signal?.aborted) {
        resolve();
        return;
      }
      input.signal?.addEventListener('abort', () => resolve(), {once: true});
    });
  } finally {
    await watcher.close();
  }
}

function createDebouncer(ms: number) {
  let timer: NodeJS.Timeout | undefined;
  return (fn: () => void) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

function formatWatchError(error: unknown): string {
  if (error instanceof Error) return error.stack || error.message;
  return String(error);
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
