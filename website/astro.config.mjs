import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

const site = 'https://sqlfu.dev';
const socialImage = `${site}/social-card.png`;
const socialImageAlt = 'sqlfu: all you need is sql.';

export default defineConfig({
  site,
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
  integrations: [
    starlight({
      title: 'sqlfu',
      disable404Route: true,
      favicon: '/favicon.ico',
      logo: {src: './src/assets/logo.png', alt: 'sqlfu'},
      head: [
        {tag: 'link', attrs: {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png'}},
        {tag: 'link', attrs: {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png'}},
        {tag: 'link', attrs: {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'}},
        {tag: 'meta', attrs: {property: 'og:site_name', content: 'sqlfu'}},
        {tag: 'meta', attrs: {property: 'og:image', content: socialImage}},
        {tag: 'meta', attrs: {property: 'og:image:secure_url', content: socialImage}},
        {tag: 'meta', attrs: {property: 'og:image:type', content: 'image/png'}},
        {tag: 'meta', attrs: {property: 'og:image:width', content: '1200'}},
        {tag: 'meta', attrs: {property: 'og:image:height', content: '630'}},
        {tag: 'meta', attrs: {property: 'og:image:alt', content: socialImageAlt}},
        {tag: 'meta', attrs: {name: 'twitter:card', content: 'summary_large_image'}},
        {tag: 'meta', attrs: {name: 'twitter:image', content: socialImage}},
        {tag: 'meta', attrs: {name: 'twitter:image:alt', content: socialImageAlt}},
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
          label: 'Guides',
          items: [
            {label: 'Overview', slug: 'docs/guides'},
            {label: 'Durable Objects', slug: 'docs/guides/durable-objects'},
            {label: 'Cloudflare D1', slug: 'docs/guides/cloudflare-d1'},
            {label: 'Node SQLite', slug: 'docs/guides/node-sqlite'},
            {label: 'Bun SQLite', slug: 'docs/guides/bun-sqlite'},
            {label: 'Turso and libSQL', slug: 'docs/guides/turso-libsql'},
            {label: 'Expo SQLite', slug: 'docs/guides/expo-sqlite'},
            {label: 'sqlite-wasm', slug: 'docs/guides/sqlite-wasm'},
          ],
        },
        {
          label: 'Features',
          items: [
            {label: 'CLI', slug: 'docs/cli'},
            {label: 'Adapters', slug: 'docs/adapters'},
            {label: 'Runtime validation', slug: 'docs/runtime-validation'},
            {label: 'Effect SQL runtime (experimental)', slug: 'docs/effect-sql'},
            {label: 'Observability', slug: 'docs/observability'},
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
            {label: 'Cloudflare D1 details', slug: 'docs/cloudflare-d1'},
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
                {label: 'Logical types', slug: 'docs/examples/logical-types'},
              ],
            },
          ],
        },
      ],
      social: [{icon: 'github', label: 'GitHub', href: 'https://github.com/mmkal/sqlfu'}],
    }),
  ],
});
