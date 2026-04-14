import {expect, test} from '@playwright/test';

test('table browser, sql runner, and generated query form work against a live fixture project', async ({page}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', {name: 'posts'})).toBeVisible();
  await expect(page.getByText('hello-world')).toBeVisible();

  await page.getByRole('link', {name: 'SQL runner'}).click();
  await page.getByRole('button', {name: 'Run SQL'}).click();
  await expect(page.getByText('sqlite_schema')).toBeVisible();

  await page.getByRole('link', {name: /find-post-by-slug/i}).click();
  await page.getByLabel('slug').fill('hello-world');
  await page.getByRole('button', {name: 'Run generated query'}).click();
  await expect(page.getByText('Hello World')).toBeVisible();
});
