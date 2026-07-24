import { expect, test } from '@playwright/test';
import {
  closeDialogWithEscape,
  dismissOrientation,
  openSettings,
  selectSetting,
  visitApp,
} from './helpers.mjs';

test.describe('PWA shell', () => {
  test('manifest and service worker are available in the production build', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Service-worker behavior is sampled once in Chromium.');

    await visitApp(page);
    const metadata = await page.evaluate(async () => {
      const manifestResponse = await fetch('/manifest.webmanifest');
      const manifest = await manifestResponse.json();
      const swResponse = await fetch('/sw.js');
      return {
        manifestStatus: manifestResponse.status,
        swStatus: swResponse.status,
        manifest,
      };
    });

    expect(metadata.manifestStatus).toBe(200);
    expect(metadata.swStatus).toBe(200);
    expect(metadata.manifest.name).toMatch(/Liber (333|CCCXXXIII)/i);
    expect(metadata.manifest.start_url).toBe('/');
    expect(metadata.manifest.display).toBe('standalone');
    expect(metadata.manifest.icons?.length).toBeGreaterThanOrEqual(2);

    const registration = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const ready = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('service worker timeout')), 12_000)),
      ]);
      return {
        supported: true,
        scope: ready.scope,
        active: Boolean(ready.active),
      };
    });

    expect(registration.supported).toBe(true);
    expect(registration.active).toBe(true);
    expect(registration.scope).toMatch(/\/$/);
  });

  test('local settings survive an offline service-worker reload', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Offline PWA behavior is sampled once in Chromium.');

    await visitApp(page);
    await dismissOrientation(page);
    const { dialog } = await openSettings(page);
    await selectSetting(dialog, 'Visual effects', 'Low');
    await selectSetting(dialog, 'Text size', 'Large');
    await closeDialogWithEscape(page, dialog);

    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-liber-effects', 'low');
    await expect(page.locator('html')).toHaveAttribute('data-liber-text-size', 'large');

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
      await expect(page.locator('#root')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-liber-effects', 'low');
      await expect(page.locator('html')).toHaveAttribute('data-liber-text-size', 'large');
      await expect(page.getByRole('button', { name: 'Open reading environment settings' })).toBeVisible();
      await expect(page.getByRole('button', { name: /BEGIN CONSULTATION/i })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
