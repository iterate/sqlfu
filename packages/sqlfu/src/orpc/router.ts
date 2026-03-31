export interface SqlfuFsLike {
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string): Promise<void>;
}

export interface SqlfuDatabaseLike {
  execute(sql: string): Promise<void>;
  exportSchema(): Promise<string>;
}

export type SqlfuCheckResult = 'ok' | `failure: ${string}`;

export interface SqlfuCheckReport {
  readonly ok: SqlfuCheckResult;
  readonly desiredVsHistory: SqlfuCheckResult;
  readonly finalizedVsSnapshot: SqlfuCheckResult;
  readonly databaseVsDesired: SqlfuCheckResult;
  readonly databaseVsFinalized: SqlfuCheckResult;
}

export interface SqlfuCaller {
  sync(): Promise<void>;
  migrate(): Promise<void>;
  draft(input: {name: string}): Promise<void>;
  check(): Promise<SqlfuCheckReport>;
}

export interface SqlfuRouterConfig {
  readonly definitionsPath: string;
  readonly migrationsDir: string;
  readonly snapshotPath: string;
  readonly dbPath: string;
}

export interface CreateSqlfuCallerOptions {
  readonly config: SqlfuRouterConfig;
  readonly fs: SqlfuFsLike;
  readonly db: SqlfuDatabaseLike;
}

export function createSqlfuCaller(_options: CreateSqlfuCallerOptions): SqlfuCaller {
  return {
    async sync() {
      throw new Error('Not implemented');
    },
    async migrate() {
      throw new Error('Not implemented');
    },
    async draft() {
      throw new Error('Not implemented');
    },
    async check() {
      throw new Error('Not implemented');
    },
  };
}
