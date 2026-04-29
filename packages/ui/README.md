# UI

The sqlfu UI is a browser interface for inspecting a database, running ad hoc SQL, and executing checked-in `.sql` queries. It has three useful modes:

- hosted UI shell at `https://sqlfu.dev/ui`, talking to a local backend started by `npx sqlfu`
- demo mode at `https://sqlfu.dev/ui?demo=1`, running entirely in the browser
- embedded mode with `@sqlfu/ui`, where your own fetch server serves the UI and owns auth, routing, and database access

## Hosted UI

Run `npx sqlfu` in your project directory and open `https://sqlfu.dev/ui`. The hosted UI connects to the local backend that sqlfu just started, on `localhost:56081`. No separate install needed.

What the UI gives you:

- table browser -- inspect rows, column types, and indexes for every table in your database
- ad hoc SQL runner -- run queries directly against your dev database, see results inline
- generated query runner -- execute your checked-in `.sql` queries with typed param input, backed by the same `sqlfu` query metadata that powers the TypeScript wrappers

The hosted UI runs on `sqlfu.dev/ui` as a static shell; all data stays on your machine. The local backend serves the API and has the CORS, private-network-access, and optional `mkcert` handling required for a public HTTPS page to talk to localhost.

## Demo

`https://sqlfu.dev/ui?demo=1` runs fully in the browser against an in-memory SQLite database -- no backend, no install. The demo uses the same posts-table schema as the [Getting Started](https://sqlfu.dev/docs/getting-started) walkthrough.

## Embedded UI

Use `@sqlfu/ui` when you want the same interface inside your own server instead of through `sqlfu.dev/ui`. The package exports `createSqlfuUiPartialFetch`, a fetch helper that serves the built UI assets and the UI's oRPC backend, but only for the routes it owns. Your server keeps control of everything around it: auth, other app routes, cookies, headers, and the database binding.

Install both packages:

```sh
pnpm add sqlfu @sqlfu/ui
```

Mount the UI under a prefix such as `/my-db` so your middleware can guard the whole surface:

```ts
import {createSqlfuUiPartialFetch} from '@sqlfu/ui';
import {createD1Client} from 'sqlfu';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const sessionCookie = `sqlfu_ui_session=${encodeURIComponent(env.SQLFU_UI_SESSION_SECRET)}`;

    if (url.pathname === '/login') {
      return new Response(
        `<!doctype html>
        <form method="post" action="/session">
          <label>Passphrase <input name="passphrase" type="password" /></label>
          <button type="submit">Unlock</button>
        </form>`,
        {headers: {'content-type': 'text/html; charset=utf-8'}},
      );
    }

    if (url.pathname === '/session' && request.method === 'POST') {
      const formData = await request.formData();
      if (formData.get('passphrase') !== env.SQLFU_UI_PASSPHRASE) {
        return new Response('nope', {status: 401});
      }
      return new Response(null, {
        status: 303,
        headers: {
          location: '/my-db',
          'set-cookie': `${sessionCookie}; HttpOnly; SameSite=Lax; Path=/`,
        },
      });
    }

    const cookie = request.headers.get('cookie') || '';
    if (url.pathname.startsWith('/my-db') && !cookie.includes(sessionCookie)) {
      return new Response(null, {status: 303, headers: {location: '/login'}});
    }

    const db = createD1Client(env.DB);
    const sqlfuUi = createSqlfuUiPartialFetch({
      prefixPath: '/my-db',
      project: {
        initialized: true,
        projectRoot: '/worker',
      },
      host: {
        async openDb() {
          return {
            client: db,
            async [Symbol.asyncDispose]() {},
          };
        },
      },
    });

    const uiResponse = await sqlfuUi(request);
    if (uiResponse) {
      return uiResponse;
    }

    return new Response('not found', {status: 404});
  },
};
```

With `prefixPath: '/my-db'`, the helper handles `/my-db`, `/my-db/assets/...`, `/my-db/runtime-config.js`, and `/my-db/api/rpc`. Requests outside that prefix return `undefined`, so the surrounding worker can continue serving its own routes. The injected runtime config points the browser client at `/my-db/api/rpc`, and the injected `<base>` tag keeps static asset URLs under the same prefix.

The minimum useful host is just `openDb`. That is enough for the table browser and SQL runner. File-system-backed features, scratch database analysis, and generated query catalog features need more host capabilities (`fs`, `openScratchDb`, `catalog`) and otherwise fail explicitly rather than pretending the worker has a filesystem.

Do not mount this unauthenticated on the public internet. The UI is intentionally powerful: it can inspect tables and run SQL against the database returned by `host.openDb`. The passphrase form above is deliberately bare so the routing shape is visible; a real application should usually reuse its existing signed session or auth middleware.

## Local development

For development on the UI package itself:

```sh
pnpm --filter @sqlfu/ui dev
```

That starts the client against a sqlfu backend with Vite HMR, using `packages/ui/test/projects/dev-project`. Playwright uses the same entrypoint but starts a separate seeded `fixture-project`.

## Inspiration

The intended product shape -- a hosted UI at `sqlfu.dev/ui` talking to a locally running sqlfu backend -- is directly inspired by [Drizzle](https://orm.drizzle.team/)'s [`local.drizzle.studio`](https://local.drizzle.studio/).
