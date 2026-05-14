# sqlfu

sqlfu is a SQL-first TypeScript data-access toolkit. SQL files are authored source; generated TypeScript is the application-facing surface produced from that source.

## Language

**Authored SQL**:
SQL written and reviewed by the user, including schema definitions, migrations, and query files.
_Avoid_: source SQL when the file is not actually user-authored

**Generated query boundary**:
The generated wrapper layer where SQL-shaped database values may be converted into application-shaped TypeScript values according to generation config.
_Avoid_: implicit casing, magic rename

**Generation casing**:
The `generate.casing` project option, `'camel' | 'preserve'`, that controls generated TypeScript property casing where sqlfu maps SQL-derived shapes into generated TypeScript surfaces; it defaults to `'camel'`.
_Avoid_: queryCasing

**Preserve casing mode**:
The `generate.casing: 'preserve'` mode where generated query properties keep SQL-derived names and generated code should avoid casing-only mapping boilerplate.
_Avoid_: compatibility mode

**Column-derived field**:
A generated property whose name comes from a database column, select-list output, SQL alias, or SQL column list rather than from a user-authored placeholder.
_Avoid_: param when the name came from a column

**Generated result field**:
A generated output property returned by a query wrapper; under camelCase query generation, its application-facing name is camelCased by the generated query boundary.
_Avoid_: raw column when referring to the wrapper return shape

**Raw generated result type**:
A row-returning generated query namespace type named `RawResult` that describes the database row before any generated result transform.
_Avoid_: private implementation detail

**Generated result mapper**:
A row-returning generated query function attached as `mapResult` that maps a raw database row into the public generated result shape when sqlfu performs a real result transform.
_Avoid_: generic camelCase helper

**Generated query catalog**:
Generated metadata describing query wrapper names, params, data inputs, and result fields for tools.
_Avoid_: raw schema catalog

**Generated validator schema**:
A runtime validator emitted into a generated query module for params, data, or results.
_Avoid_: raw database validator unless explicitly internal

**Logical type decoding**:
Generated conversion from a SQLite storage encoding into the TypeScript value represented by a logical type.
_Avoid_: validation when referring only to decoding/parsing storage

**Casing collision**:
Two or more column-derived fields that would produce the same camelCase application name.
_Avoid_: duplicate column unless the raw SQL field names are also identical

**Generated data input**:
The generated input object for insert/update column values; its property names are column-derived application fields.
_Avoid_: params

**Generated params input**:
The generated input object for user-authored SQL placeholders; its property names are exactly the placeholder names written in SQL.
_Avoid_: data

**Generated schema row type**:
A generated table/view row type that represents the raw database shape, not the application-facing query-wrapper shape.
_Avoid_: application model

**Query identity**:
The camelCase generated function name carried at runtime on `SqlQuery.name` for logs, traces, and errors.
_Avoid_: filename when referring to runtime identity

## Relationships

- **Authored SQL** produces generated query modules.
- A generated query module has one **Query identity**.
- **Generation casing** configures generated SQL-derived TypeScript property names, not generated symbols.
- **Preserve casing mode** keeps generated output close to today's lean shape; it should not emit no-op raw-to-public mapping code just to share generator internals.
- The **Generated query boundary** maps **Column-derived fields** into the TypeScript application shape.
- User-authored placeholder names remain explicit application names, not **Column-derived fields**.
- Under camelCase query generation, **Generated result fields** are camelCased, including fields that came from SQL aliases, except a **Casing collision** group keeps its original raw field names.
- A row-returning generated query module exposes both a **Raw generated result type** and a **Generated result mapper** when raw database rows differ from public results, so users can reuse sqlfu's boundary mapping with other clients.
- Under camelCase query generation, **Generated data input** property names are **Column-derived fields** and follow the same camelCase-with-collision-fallback rule.
- **Generated params input** property names are user-authored placeholders.
- The **Generated query catalog** describes the application-facing wrapper surface, with raw SQL names retained only as explanatory metadata for mapped column-derived fields.
- **Generated validator schemas** validate the application-facing wrapper shape; raw database rows are mapped before public result validation.
- **Logical type decoding** happens inside the **Generated query boundary** while raw database rows are mapped into application results.
- A **Generated schema row type** is not a **Generated query boundary** and remains raw DB-shaped unless that feature is reconsidered separately.

## Example Dialogue

> **Dev:** "Should `published_at` come back as `publishedAt`?"
> **Domain expert:** "Yes, if it is a column-derived field in a generated query result. Make the generated query boundary show that mapping explicitly."

## Flagged Ambiguities

- "camel-case generated output" could mean every generated property, including placeholders. Resolved: when camelCase query generation is enabled, column-derived fields in generated query modules are camelCased at the boundary; user-authored placeholder names are preserved.
- "params" was overloaded to mean every generated input. Resolved: **Generated data input** comes from SQL columns and is camelCased under camelCase query generation; **Generated params input** comes from placeholders and is preserved.
- "alias" could mean an explicit application-facing escape hatch. Resolved: aliases are still generated result fields, so they are camelCased by the generated query boundary when camelCase query generation is enabled.
- "collision" could mean generation failure. Resolved: when multiple column-derived fields map to the same camelCase name, only that collision group keeps raw field names.
- "`tables.ts` row type" could mean an application model. Resolved for the casing task: generated schema row types are raw DB shapes; a separate task will reconsider whether the feature should exist.
- "`generate.casing`" could mean every generated identifier. Resolved: it controls generated property names only; function names, query identities, type names, filenames, and row type names keep their existing naming rules.
- "shared mapping machinery" could mean preserve mode emits no-op mappers. Resolved: preserve mode should avoid extra generated boilerplate unless the wrapper actually needs a runtime transform such as logical type decoding.
- "raw result type" could mean private helper only. Resolved: in camelCase mode, expose the raw result type and result mapper as generated public surface for callers using other clients.
