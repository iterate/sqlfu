import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    // pglite spin-up is fast (in-process) but several tests still benefit
    // from running serially against a single instance. Re-evaluate if test
    // counts grow.
    pool: 'forks',
  },
});
