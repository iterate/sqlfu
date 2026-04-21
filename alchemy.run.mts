process.env.CLOUDFLARE_PROFILE ||= 'mishagmail';

import alchemy from 'alchemy';
import {RedirectRule, Website} from 'alchemy/cloudflare';

const app = await alchemy('sqlfu');

// One Website, one hostname (apex). The UI ships under /ui/ via
// website/scripts/sync-ui.mjs copying packages/ui/dist into
// website/dist/ui before deploy. Single-origin deployment avoids the
// Cloudflare edge 403 that the separate-subdomain layout produced when
// Chrome coalesced HTTP/2 or HTTP/3 connections across sqlfu.dev
// hostnames.
await Website('www', {
  name: 'sqlfu-www',
  cwd: './website',
  build: 'pnpm build',
  assets: './dist',
  domains: [{domainName: 'sqlfu.dev'}, {domainName: 'www.sqlfu.dev'}],
});

// 301 www → apex so apex is the canonical host.
await RedirectRule('www-to-apex', {
  zone: 'sqlfu.dev',
  requestUrl: 'https://www.sqlfu.dev/*',
  targetUrl: 'https://sqlfu.dev/${1}',
  statusCode: 301,
  preserveQueryString: true,
});

await app.finalize();
