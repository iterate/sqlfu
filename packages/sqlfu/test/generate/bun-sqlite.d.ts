declare module 'bun:sqlite' {
  type RunResult = {
    changes?: number;
    lastInsertRowid?: string | number | bigint | null;
  };

  class Statement<TRow = unknown> {
    all(...params: unknown[]): TRow[];
    run(...params: unknown[]): RunResult;
  }

  export class Database {
    query<TRow = unknown>(query: string): Statement<TRow>;
    run(query: string, params?: unknown[]): RunResult;
  }
}
