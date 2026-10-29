// Vendored from reylo's Standard Query spec: src/standard-query.ts in github.com/colinhacks/reylo
// at commit e77a02124e123ac56f3c498a22305564b24720d8 (the file first landed in 4cff3ac, after the
// v0.6.0 tag). MIT License, Copyright (c) Colin McDonnell.
// https://github.com/colinhacks/reylo/blob/e77a02124e123ac56f3c498a22305564b24720d8/src/standard-query.ts
//
// `StandardTypedV1` comes from @standard-schema/spec 1.1.0 (packages/spec/src/index.ts in
// github.com/standard-schema/standard-schema; MIT License, Copyright (c) 2024 Colin McDonnell), via
// reylo's src/standard.ts, which vendors it verbatim. The specs are designed to be copied so that
// implementers carry no dependency.
//
// Modifications: types only. reylo's runtime half of the file (`standardQuery`, `decoder`), which
// builds the members for reylo's own queries, is left out; sqlfu's equivalent is src/standard-query.ts.
// `StandardTypedV1` is inlined here rather than imported. Update by copying both again.

/** The Standard Typed interface. This is a base type extended by other specs. */
export interface StandardTypedV1<Input = unknown, Output = Input> {
  /** The Standard properties. */
  readonly "~standard": StandardTypedV1.Props<Input, Output>;
}

export declare namespace StandardTypedV1 {
  /** The Standard Typed properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
  }

  /** The Standard Typed types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input;
    /** The output type of the schema. */
    readonly output: Output;
  }

  /** Infers the input type of a Standard Typed. */
  export type InferInput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"];

  /** Infers the output type of a Standard Typed. */
  export type InferOutput<Schema extends StandardTypedV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"];
}

/** The Standard Query interface: a statement a driver can execute, as a typed function from an input to an output. */
export interface StandardQueryV1<Input = unknown, Output = Input, D extends StandardQueryV1.Dialect = StandardQueryV1.Dialect>
  extends StandardTypedV1<Input, Output> {
  /** The Standard properties. */
  readonly "~standard": StandardQueryV1.Props<Input, Output, D>;
}

export declare namespace StandardQueryV1 {
  /** The Standard Query properties interface. */
  export interface Props<Input = unknown, Output = Input, D extends StandardQueryV1.Dialect = StandardQueryV1.Dialect>
    extends StandardTypedV1.Props<Input, Output> {
    /** The statement and its two mappings. */
    readonly query: Query<Output, D>;
  }

  /** The Standard Query query interface. */
  export interface Query<Output = unknown, D extends StandardQueryV1.Dialect = StandardQueryV1.Dialect> {
    /** The database the statement is written for. A driver refuses a query for another one. */
    readonly dialect: D;
    /** The statement, with the database's positional placeholders: `$1`, `$2` on Postgres, `?` on MySQL and SQLite. */
    readonly text: string;
    /**
     * Maps the input to the values to bind, one per placeholder, in order, each in its database's
     * raw form. The driver passes the input as the caller gave it, `undefined` when it was left
     * out. Throws a `TypeError` for an input it cannot bind.
     */
    encode(input: unknown): readonly RawValue<D>[];
    /**
     * Maps the raw result to the output: every row the statement returned, each an array of raw
     * values in the order the statement selects them. Throws for a result that does not fit the
     * output (a second row where at most one is expected, say).
     */
    decode(rows: readonly (readonly RawValue<D>[])[]): Output;
  }

  /** The database a statement is written for. */
  export type Dialect =
    | "postgres"
    | "mysql"
    | "sqlite"
    // Accepts any string: allows other databases while preserving autocomplete
    | ({} & string);

  /**
   * A value in its raw form: what a driver of the database reads before converting anything, and
   * binds without converting anything. On Postgres, the value's text as the server sends it in
   * the text format. NULL is `null`.
   */
  export type RawValue<D extends Dialect = Dialect> =
    | null
    | (D extends "postgres" ? string : D extends "mysql" | "sqlite" ? string | number | bigint | Uint8Array : unknown);

  /** The arguments a driver takes after the query: optional when the input can be empty. */
  export type InferArgs<Q extends StandardTypedV1> = {} extends StandardTypedV1.InferInput<Q>
    ? [input?: StandardTypedV1.InferInput<Q>]
    : [input: StandardTypedV1.InferInput<Q>];
}
