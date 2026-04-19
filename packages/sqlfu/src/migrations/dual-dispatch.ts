// A tiny dual-dispatch helper in the spirit of `quansync`
// (https://github.com/quansync-dev/quansync). Lets us write the migrations
// logic once as a generator function; each `yield` of a value awaits it in
// async mode and passes it through unchanged in sync mode. A sentinel yield
// of `GET_IS_ASYNC` lets the generator branch on mode when it needs to wire
// up a nested callback (e.g. `client.transaction(cb)`, where `cb` itself is
// sync for sync clients and async for async clients).
//
// Why not a dependency on `quansync`? The whole utility is ~40 lines and we
// only need it in one call site. A fresh runtime dep for that is too much.

export const GET_IS_ASYNC = Symbol('sqlfu.migrations.getIsAsync');

export type DualGenerator<TReturn> = Generator<unknown, TReturn, unknown>;

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as {then: unknown}).then === 'function'
  );
}

export function driveSync<TReturn>(generator: DualGenerator<TReturn>): TReturn {
  let current = generator.next();
  while (!current.done) {
    const yielded = current.value === GET_IS_ASYNC ? false : current.value;
    if (isThenable(yielded)) {
      throw new Error('sqlfu: unexpected promise in sync migration context');
    }
    try {
      current = generator.next(yielded);
    } catch (error) {
      current = generator.throw(error);
    }
  }
  return current.value;
}

export async function driveAsync<TReturn>(generator: DualGenerator<TReturn>): Promise<TReturn> {
  let current = generator.next();
  while (!current.done) {
    const yielded = current.value === GET_IS_ASYNC ? true : current.value;
    let resumed: unknown;
    try {
      resumed = await yielded;
    } catch (error) {
      current = generator.throw(error);
      continue;
    }
    current = generator.next(resumed);
  }
  return current.value;
}

