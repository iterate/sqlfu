import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://sqlfu.dev',
  // build.format: 'file' emits `docs/runtime-validation.html` (not
  // `docs/runtime-validation/index.html`) so artifact.ci's "strip trailing slash"
  // 308 redirect doesn't change how the browser resolves relative asset URLs:
  // the last path segment is always treated as a filename either way.
  trailingSlash: 'ignore',
  build: {
    format: 'file',
  },
  vite: {
    server: {
      // Allow ad-hoc tunnels (cloudflare / ngrok) to hit the dev server when
      // previewing on phones or other devices.
      allowedHosts: ['.trycloudflare.com', '.ngrok.app', '.ngrok.dev'],
    },
  },
  redirects: {
    '/docs': '/docs/getting-started',
  },
  integrations: [
    starlight({
      title: 'sqlfu',
      favicon: '/favicon.ico',
      logo: {src: './src/assets/logo.png', alt: 'sqlfu'},
      head: [
        {tag: 'link', attrs: {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png'}},
        {tag: 'link', attrs: {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png'}},
        {tag: 'link', attrs: {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'}},
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        // Inject the "Source: …" GitHub permalink above each doc title.
        PageTitle: './src/starlight-overrides/PageTitle.astro',
        // Global pre-alpha notice on every docs page.
        Banner: './src/starlight-overrides/Banner.astro',
      },
      sidebar: [
        {
          label: 'Start here',
          items: [
            {label: 'Getting Started', slug: 'docs/getting-started'},
            {label: 'Overview', slug: 'docs/sqlfu'},
          ],
        },
        {
          label: 'Concepts',
          items: [
            {label: 'Runtime client', slug: 'docs/client'},
            {label: 'SQL migrations', slug: 'docs/migration-model'},
            {label: 'Type generation from SQL', slug: 'docs/typegen'},
            {label: 'Admin UI', slug: 'docs/ui'},
          ],
        },
        {
          label: 'Features',
          items: [
            {label: 'CLI', slug: 'docs/cli'},
            {label: 'Adapters', slug: 'docs/adapters'},
            {label: 'Runtime validation', slug: 'docs/runtime-validation'},
            {label: 'Observability', slug: 'docs/observability'},
            {label: 'Effect interop (experimental)', slug: 'docs/effect'},
            {label: 'Lint plugin', slug: 'docs/lint-plugin'},
            {label: 'Formatter', slug: 'docs/formatter'},
            {label: 'Agent skill', slug: 'docs/agent-skill'},
            {label: 'Outbox (experimental)', slug: 'docs/outbox'},
          ],
        },
        {
          label: 'Recipes',
          items: [
            {label: 'Dynamic queries', slug: 'docs/dynamic-queries'},
            {label: 'Pure-SQL id generators', slug: 'docs/id-helpers'},
          ],
        },
        {
          label: 'Reference',
          items: [
            {label: 'Import surface', slug: 'docs/imports'},
            {label: 'Errors', slug: 'docs/errors'},
            {label: 'Schema diff internals', slug: 'docs/schema-diff-model'},
            {
              label: 'Generate examples',
              items: [
                {label: 'Overview', slug: 'docs/examples'},
                {label: 'Basics', slug: 'docs/examples/basics'},
                {label: 'Config', slug: 'docs/examples/config'},
                {label: 'Errors', slug: 'docs/examples/errors'},
                {label: 'Query annotations', slug: 'docs/examples/query-annotations'},
                {label: 'Query shapes', slug: 'docs/examples/query-shapes'},
                {label: 'Result types', slug: 'docs/examples/result-types'},
                {label: 'Validators', slug: 'docs/examples/validators'},
              ],
            },
          ],
        },
      ],
      social: [{icon: 'github', label: 'GitHub', href: 'https://github.com/mmkal/sqlfu'}],
    }),
  ],
});
