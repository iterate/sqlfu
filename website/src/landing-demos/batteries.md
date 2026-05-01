# Batteries

## terminal

```term artifact=cli
$ npx sqlfu check {speed=command run-command}
definitions.sql, migrations, and database agree {terminal-output=check output-pause=450}

$ npx sqlfu migrate {speed=command run-command}
Applied 20260501090000_add_published_to_posts.sql {terminal-output=migrate output-pause=450}

$ npx sqlfu sync {speed=command run-command}
Database already matches definitions.sql {terminal-output=sync output-pause=450}
```

## terminal

```term artifact=admin
$ npx sqlfu {speed=command run-command}
sqlfu ready at https://sqlfu.dev/ui {terminal-output=ready output-pause=520}
```

## src/server.ts

```ts artifact=tracing speed=fast
import {instrument} from "sqlfu";
import {getPosts} from "./.generated/get-posts.sql.ts";

const client = instrument(
  baseClient,
  instrument.otel({tracer}),
);

app.get("/posts", async (c) => {
  const posts = await getPosts(client, {limit: 10});
  return c.json(posts);
});
```

## terminal

```term artifact=lint
$ npx eslint sql/get-posts.sql src/app.ts {speed=command run-command}

sql/get-posts.sql {terminal-output=errors output-pause=650}
  1:1  error  generated wrapper is stale; run npx sqlfu generate {terminal-output=errors}
       sqlfu/generated-query-freshness {terminal-output=errors}
 {terminal-output=errors}
src/app.ts {terminal-output=errors}
  8:21 error  use ./sql/.generated/get-posts.sql.ts instead {terminal-output=errors}
       sqlfu/query-naming {terminal-output=errors}
```

## terminal

```term artifact=formatter
$ npx sqlfu format "sql/**/*.sql" {speed=command run-command}

Formatted files: {terminal-output=formatted output-pause=520}
  sql/get-posts.sql {terminal-output=formatted}
  sql/get-comments.sql {terminal-output=formatted}
```

## terminal

```term artifact=skill
$ npx skills add mmkal/sqlfu/skills/using-sqlfu {speed=command run-command}

Installed using-sqlfu {terminal-output=installed output-pause=560}
Agents now know to edit SQL first, run sqlfu draft, and regenerate wrappers. {terminal-output=installed}
```
