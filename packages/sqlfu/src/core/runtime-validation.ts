import type {StandardSchemaV1} from '../vendor/standard-schema/contract.js';
import {prettifyStandardSchemaError} from '../vendor/standard-schema/errors.js';

/**
 * Given a Standard Schema `validate` result, returns the validated value or throws a
 * prettified `Error` built from the result's `issues` list.
 *
 * Used by sqlfu-generated query wrappers when `generate.validator` is `'valibot'` or
 * `'zod-mini'` and `generate.prettyErrors` is `true` (default). The zod path uses
 * `z.prettifyError` directly — no helper needed there.
 *
 * Generated call site:
 *   const params = getValueOrThrowPrettyError(Params['~standard'].validate(rawParams));
 *
 * Sqlfu-generated schemas are sync (no async refinements), so `validate` always returns
 * a plain `Result`. If a user replaces `Params` with a schema that has async refinements,
 * `validate` may return `Promise<Result>` — we detect that and throw a clear error
 * rather than silently returning a pending Promise typed as `T`.
 */
export function getValueOrThrowPrettyError<T>(result: StandardSchemaV1.Result<T> | Promise<StandardSchemaV1.Result<T>>): T {
  if (isPromiseLike(result)) {
    throw new Error(
      'Standard Schema validate() returned a Promise. sqlfu-generated wrappers assume synchronous validation — ' +
        'async refinements are not supported on generated schemas.',
    );
  }
  if (result.issues) {
    throw new Error(prettifyStandardSchemaError({issues: result.issues}) || 'Validation failed');
  }
  return result.value;
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as {then?: unknown})?.then === 'function';
}
