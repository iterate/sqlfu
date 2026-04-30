import {expect, test} from '@playwright/test';

test('demo mode runs fully in-browser', async ({page}) => {
  await page.goto('http://127.0.0.1:3218/?demo=1');

  await expect(page.getByText('Demo mode', {exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: 'Back to sqlfu.dev/ui'})).toBeVisible();

  await expect(page.getByRole('link', {name: /^customers/})).toBeVisible();
  await expect(page.getByRole('link', {name: /^products/})).toBeVisible();
  await expect(page.getByRole('link', {name: /^invoices/})).toBeVisible();

  await page.getByRole('link', {name: /^customers/}).click();
  await expect(page.getByText('Alfreds Futterkiste')).toBeVisible();

  await page.getByRole('link', {name: /^products/}).click();
  await expect(page.getByText('Chai')).toBeVisible();
  await expect(page.locator('.nav-link.active')).toContainText('products');

  await page.getByRole('link', {name: 'Schema'}).click();
  await expect(page.getByRole('heading', {name: 'Repo Drift'})).toBeVisible();
  await expect(page.getByText('No Sync Drift')).toBeVisible();
  await expect(page.getByRole('button', {name: 'sqlfu draft'})).toBeVisible();
});

test('demo mode: clicking the same sort column 3 times (asc → desc → off) does not freeze', async ({page}) => {
  await page.goto('http://127.0.0.1:3218/?demo=1#table/products');
  await expect(page.locator('.reactgrid').getByText('Chai')).toBeVisible();

  // Click 1: sort by product_id asc (default → SQL mode)
  await page.getByRole('button', {name: 'Sort', exact: true}).click();
  await page.getByRole('button', {name: 'Sort by product_id'}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', {name: /^Sort — product_id asc/})).toBeVisible({timeout: 5000});

  // Click 2: flip to desc
  await page.getByRole('button', {name: /^Sort —/}).click();
  await page.getByRole('button', {name: /Sort by product_id/}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', {name: /^Sort — product_id desc/})).toBeVisible({timeout: 5000});

  // Click 3: remove. In demo mode this froze the page before the fix.
  await page.getByRole('button', {name: /^Sort —/}).click();
  await page.getByRole('button', {name: /Sort by product_id/}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', {name: 'Sort', exact: true})).toBeVisible({timeout: 5000});
  await expect(page.locator('.reactgrid').getByText('Chai')).toBeVisible();
});
