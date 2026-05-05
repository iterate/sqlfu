// The main dev graph uses Effect v3. This narrow shim lets generated v4-unstable
// fixture output typecheck without installing beta packages into the same project.
declare module 'effect/unstable/sql' {
  import type * as Context from 'effect/Context';
  import type * as Effect from 'effect/Effect';

  export namespace SqlClient {
    export interface Statement<A extends object> extends Effect.Effect<ReadonlyArray<A>, unknown> {
      raw: Effect.Effect<unknown, unknown>;
    }

    export interface SqlClient {
      unsafe<A extends object>(sql: string, params?: ReadonlyArray<unknown>): Statement<A>;
    }

    export const SqlClient: Context.Tag<SqlClient, SqlClient>;
  }
}
