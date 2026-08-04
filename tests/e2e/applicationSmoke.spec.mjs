import { expect, test } from '@playwright/test';

test('application shell launches without a fatal browser error', async ({ page }) => {
  const fatalErrors = [];
  page.on('pageerror', (error) => fatalErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByRole('button', { name: /BEGIN CONSULTATION/i })).toBeVisible();
  expect(fatalErrors).toEqual([]);
});
