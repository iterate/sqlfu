# Standard Query (reylo)

[Standard Query](https://github.com/colinhacks/reylo/blob/main/src/standard-query.ts)
is a spec from [reylo](https://github.com/colinhacks/reylo), in the Standard
Schema family. A query object carries its SQL plus two functions: `encode`
(input to the values to bind) and `decode` (rows to output). Any driver that
speaks the spec can run any query that speaks it.

sqlfu speaks it both ways.

## Run any Standard Query through a sqlfu client

```ts
import listPosts from './sql/list-posts.sql'; // a reylo import

const posts = await client.execute(listPosts, {limit: 10});
```

`client.execute` binds `encode(input)`, reads the rows with `client.values`
(each row an array, in select order), and returns `decode(rows)`. Sync clients
return the output directly. A query written for another database throws.
`instrument` hooks see the statement as a `values` operation.

## Run sqlfu's generated wrappers anywhere

Generated wrappers carry a `~standard` property, so a driver that has never
heard of sqlfu can run them. Here it is with bare `node:sqlite`:

```ts
import {findPostBySlug} from './sql/.generated/queries.sql.ts';

const {text, encode, decode} = findPostBySlug['~standard'].query;
const statement = db.prepare(text);
statement.setReturnArrays(true);
const post = decode(statement.all(...encode({slug: 'hello'})));
```

`decode` returns what `findPostBySlug(client, {slug: 'hello'})` returns. Writes
without `returning` decode to `undefined`: a Standard Query reads rows, not
`rowsAffected`.

Some wrappers don't get `~standard`, so passing them to `client.execute` is a
type error rather than a runtime one:

- Queries with list or `values :rows` params. Their SQL changes with the input,
  and the spec needs fixed text.
- `update ... set` queries, which take `data` and `params` separately. The spec
  takes one input.
- Validator wrappers, the Effect and native-driver runtimes, and Postgres. Not
  yet.
- Inline `sql` templates. They have no column names at runtime, so `decode`
  couldn't build rows.

The spec lives only in reylo's repo for now and may change. sqlfu vendors the
types rather than depending on reylo.
