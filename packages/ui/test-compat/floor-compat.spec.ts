import {expect, test} from '@playwright/test';

// Runs against the OLDEST published server that SUPPORTED_SERVER_RANGE claims
// to support (see start-floor-server.ts). It walks the studio's core surfaces
// — schema sidebar, table rows, sql runner — because those must render for
// ANY in-range server. When this fails after a client change, the client now
// relies on an RPC shape the floor server doesn't speak: bump
// SUPPORTED_SERVER_RANGE in src/startup-error.ts (to a published version) so
// stale local backends get the upgrade screen instead of a crash.
test('studio core surfaces work against the oldest supported server version', async ({page}) => {
  await page.goto('/');

  await page.getByRole('link', {name: /^posts/}).click();
  await expect(page.locator('.nav-link.active')).toContainText('posts');
  await expect(page.getByText('hello-world')).toBeVisible();

  await page.getByRole('link', {name: 'SQL runner'}).click();
  await page.getByRole('button', {name: 'Run SQL'}).click();
  await expect(page.getByText('sqlite_schema')).toBeVisible();
});
