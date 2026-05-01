# Generate

## sql/get-posts.sql

```sql artifact=query speed=fast
select id, slug, title
from posts
where published = 1
order by id desc
limit :limit;
```

## terminal

```term artifact=terminal
$ npx sqlfu generate {speed=command run-command}

Updated generated file: {terminal-output=updated output-pause=820}
  ./.generated/get-posts.sql.ts {terminal-output=updated}
```

## src/app.ts

```ts artifact=app speed=medium
import {getPosts} from "./.generated/get-posts.sql.ts";

const posts = await getPosts(client, {limit: 10});
//    ^? Array<{id: number; slug: string; title: string}> {pop-after-typing generated-type-hint}

posts.forEach((post) => {
  console.log(post.slug + ": " + post.title);
});
```
