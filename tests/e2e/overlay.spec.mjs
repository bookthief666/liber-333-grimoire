import { expect, test } from '@playwright/test';
import { activate, openSettings, visitApp } from './helpers.mjs';

test.describe('layered overlay accessibility', () => {
  test('Grimoire is named and Escape closes only the foreground shell dialog', async ({ page }) => {
    await visitApp(page);

    await activate(page.getByRole('button', { name: 'GRIMOIRE', exact: true }));
    const grimoire = page.getByRole('dialog', { name: /Grimoire Journal/i });
    await expect(grimoire).toBeVisible();
    await expect(grimoire.getByRole('button', { name: 'Close Grimoire' })).toBeVisible();

    const settings = await openSettings(page);
    await expect(settings.dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(settings.dialog).toBeHidden();
    await expect(grimoire).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(grimoire).toBeHidden();
  });
});
