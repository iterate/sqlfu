export type StartupFailureKind = 'unreachable' | 'client-error' | 'server-error' | 'version-mismatch';

export type StartupFailure =
  | {
      kind: 'unreachable' | 'client-error' | 'server-error';
      message: string;
      status: number | null;
    }
  | {
      kind: 'version-mismatch';
      message: string;
      status: null;
      serverVersion: string | null;
      minimumServerVersion: string;
    };

/**
 * The oldest sqlfu server version that speaks today's oRPC contract.
 *
 * Bump whenever the hosted client relies on a new/changed RPC field, query
 * param, or event shape. The hosted client on local.sqlfu.dev is always the
 * tip of main; a user's local `npx sqlfu` is whatever they happened to
 * install. When the local server is older than this floor, we show an
 * upgrade screen instead of letting the mismatch surface as a cryptic 4xx.
 */
export const MINIMUM_SERVER_VERSION = '0.0.2-3';

/**
 * Error type thrown from the bootstrap path when the local server is too old
 * for this hosted client. Caught by the `StartupErrorBoundary` and turned
 * into a `version-mismatch` startup failure.
 */
export class ServerVersionMismatchError extends Error {
  readonly serverVersion: string | null;
  readonly minimumServerVersion: string;

  constructor(input: {serverVersion: string | null; minimumServerVersion: string}) {
    const shown = input.serverVersion ?? 'unknown';
    super(`Local sqlfu server is running v${shown}; this UI requires v${input.minimumServerVersion} or newer.`);
    this.name = 'ServerVersionMismatchError';
    this.serverVersion = input.serverVersion;
    this.minimumServerVersion = input.minimumServerVersion;
  }
}

export function classifyStartupError(error: unknown): StartupFailure {
  if (error instanceof ServerVersionMismatchError) {
    return {
      kind: 'version-mismatch',
      message: error.message,
      status: null,
      serverVersion: error.serverVersion,
      minimumServerVersion: error.minimumServerVersion,
    };
  }

  const status = readStatus(error);
  const message = error instanceof Error ? error.message : String(error);

  if (status && status >= 500) {
    return {
      kind: 'server-error',
      message,
      status,
    };
  }

  if (status && status >= 400) {
    return {
      kind: 'client-error',
      message,
      status,
    };
  }

  return {
    kind: 'unreachable',
    message,
    status: null,
  };
}

/**
 * Returns the error the caller should throw, or `null` if the server is
 * compatible. `serverVersion` may be `undefined` for old servers that pre-date
 * the `project.status.serverVersion` field — treated as "definitely too old".
 */
export function checkServerVersion(input: {serverVersion: string | undefined}): ServerVersionMismatchError | null {
  if (!input.serverVersion) {
    return new ServerVersionMismatchError({
      serverVersion: null,
      minimumServerVersion: MINIMUM_SERVER_VERSION,
    });
  }

  if (compareSqlfuVersions(input.serverVersion, MINIMUM_SERVER_VERSION) < 0) {
    return new ServerVersionMismatchError({
      serverVersion: input.serverVersion,
      minimumServerVersion: MINIMUM_SERVER_VERSION,
    });
  }

  return null;
}

/**
 * Compare two sqlfu version strings. Returns < 0 if `a` is older than `b`,
 * > 0 if newer, 0 if equal.
 *
 * Supported shapes: `MAJOR.MINOR.PATCH` and `MAJOR.MINOR.PATCH-N` where `N`
 * is a non-negative integer prerelease number (matches the scheme in
 * `packages/sqlfu/package.json`). Anything outside that shape throws, on the
 * theory that silently mis-comparing a malformed version is worse than
 * failing loudly.
 */
export function compareSqlfuVersions(a: string, b: string): number {
  const parsedA = parseSqlfuVersion(a);
  const parsedB = parseSqlfuVersion(b);

  for (let index = 0; index < 3; index += 1) {
    const diff = parsedA.segments[index]! - parsedB.segments[index]!;
    if (diff !== 0) {
      return diff;
    }
  }

  // A non-prerelease version is newer than the same MAJOR.MINOR.PATCH with a prerelease.
  if (parsedA.prerelease === null && parsedB.prerelease === null) {
    return 0;
  }
  if (parsedA.prerelease === null) {
    return 1;
  }
  if (parsedB.prerelease === null) {
    return -1;
  }
  return parsedA.prerelease - parsedB.prerelease;
}

function parseSqlfuVersion(version: string): {segments: [number, number, number]; prerelease: number | null} {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/u.exec(version);
  if (!match) {
    throw new Error(`Unsupported sqlfu version shape: ${version}`);
  }
  return {
    segments: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] === undefined ? null : Number(match[4]),
  };
}

function readStatus(error: unknown): number | null {
  const candidates = [
    readNumber(error, ['status']),
    readNumber(error, ['response', 'status']),
    readNumber(error, ['cause', 'status']),
    readNumber(error, ['data', 'status']),
    readNumber(error, ['json', 'status']),
  ];

  return candidates.find((value) => value !== null) || null;
}

function readNumber(value: unknown, path: string[]): number | null {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'number' ? current : null;
}
