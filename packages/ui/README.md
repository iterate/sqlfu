# sqlfu/ui

Experimental UI for `sqlfu`.

This package is intentionally provisional. The current shape, package boundary, and even the existence of this package may change or disappear entirely while `sqlfu` is still pre-alpha.

Current scope:

- table browser
- ad hoc SQL runner
- generated query runner backed by `sqlfu` query metadata

Development:

```sh
pnpm --filter sqlfu-ui dev
```

That starts a Bun server against `packages/ui/test/projects/dev-project`. If the project does not exist yet, it is seeded from the template project.

Playwright uses the same entrypoint, but starts a separate seeded `fixture-project`.
