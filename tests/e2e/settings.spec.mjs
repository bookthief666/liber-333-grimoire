import { expect, test } from '@playwright/test';
import {
  SETTINGS_KEY,
  activate,
  assertNoHorizontalOverflow,
  closeDialogWithEscape,
  openSettings,
  openWays,
  readStoredSettings,
  selectSetting,
  settingGroup,
  visitApp,
} from './helpers.mjs';

test.describe('experience settings', () => {
  test('fresh profile opens directly on the Oracle with full ritual defaults', async ({ page }) => {
    await visitApp(page);

    await expect(page.getByRole('dialog', { name: 'Ways of Working' })).toBeHidden();
    await expect(page.getByRole('button', { name: /BEGIN CONSULTATION/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Ways of Working guide' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-liber-ceremony', 'full');
    await expect(page.locator('html')).toHaveAttribute('data-liber-effects', 'high');
    await expect(page.locator('html')).toHaveAttribute('data-liber-text-size', 'standard');
    await expect(page.locator('html')).toHaveAttribute('data-liber-sound', 'on');
    await expect(page.locator('html')).toHaveAttribute('data-liber-voice', 'on');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'full');

    const { dialog } = await openSettings(page);
    await expect(settingGroup(dialog, 'Ceremony').getByRole('button', { name: 'Full', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(settingGroup(dialog, 'Visual effects').getByRole('button', { name: 'High', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(settingGroup(dialog, 'Text size').getByRole('button', { name: 'Standard', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(settingGroup(dialog, 'Sound').getByRole('button', { name: 'On', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(settingGroup(dialog, 'Voice').getByRole('button', { name: 'On', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('blocked localStorage access cannot prevent the Oracle-first render', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Blocked-storage startup is sampled once in Chromium.');
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('Storage is blocked for QA.', 'SecurityError'); },
      });
    });
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Ways of Working' })).toBeHidden();
    await expect(page.getByRole('button', { name: /BEGIN CONSULTATION/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-liber-effects', 'high');
    await expect(page.locator('html')).toHaveAttribute('data-liber-text-size', 'standard');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'full');
  });

  test('settings update root state and persist across reloads without opening Ways', async ({ page }) => {
    await visitApp(page);
    let { dialog } = await openSettings(page);

    await selectSetting(dialog, 'Ceremony', 'Reduced');
    await selectSetting(dialog, 'Visual effects', 'Low');
    await selectSetting(dialog, 'Text size', 'Large');
    await selectSetting(dialog, 'Sound', 'Off');
    await selectSetting(dialog, 'Voice', 'Off');

    await expect(page.locator('html')).toHaveAttribute('data-liber-ceremony', 'reduced');
    await expect(page.locator('html')).toHaveAttribute('data-liber-effects', 'low');
    await expect(page.locator('html')).toHaveAttribute('data-liber-text-size', 'large');
    await expect(page.locator('html')).toHaveAttribute('data-liber-sound', 'off');
    await expect(page.locator('html')).toHaveAttribute('data-liber-voice', 'off');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'reduced');
    await expect(page.locator('html')).toHaveClass(/liber-reduced-ceremony/);
    await expect(page.locator('html')).toHaveClass(/liber-low-effects/);
    await expect(page.locator('html')).toHaveClass(/liber-large-text/);

    const stored = await readStoredSettings(page);
    expect(stored).toMatchObject({
      version: 1,
      ceremony: 'reduced',
      effects: 'low',
      textSize: 'large',
      sound: false,
      voice: false,
      orientationSeen: false,
    });

    await closeDialogWithEscape(page, dialog);
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Ways of Working' })).toBeHidden();
    await expect(page.getByRole('button', { name: /BEGIN CONSULTATION/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-liber-ceremony', 'reduced');
    await expect(page.locator('html')).toHaveAttribute('data-liber-effects', 'low');
    await expect(page.locator('html')).toHaveAttribute('data-liber-text-size', 'large');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'reduced');

    ({ dialog } = await openSettings(page));
    await expect(settingGroup(dialog, 'Ceremony').getByRole('button', { name: 'Reduced', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(settingGroup(dialog, 'Visual effects').getByRole('button', { name: 'Low', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(settingGroup(dialog, 'Text size').getByRole('button', { name: 'Large', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('system reduced motion lowers the animation budget until an explicit override is stored', async ({ page }) => {
    await visitApp(page, { reducedMotion: 'reduce' });
    await expect(page.locator('html')).toHaveAttribute('data-liber-effective-motion', 'reduced');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'reduced');
    await expect(page.locator('html')).toHaveClass(/liber-force-reduced-motion/);

    let { dialog } = await openSettings(page);
    await expect(settingGroup(dialog, 'Motion').getByRole('button', { name: 'Reduced', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await selectSetting(dialog, 'Motion', 'Full');
    await expect(page.locator('html')).toHaveAttribute('data-liber-effective-motion', 'full');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'full');
    await expect(page.locator('html')).toHaveClass(/liber-force-full-motion/);
    await closeDialogWithEscape(page, dialog);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-liber-effective-motion', 'full');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'full');
    ({ dialog } = await openSettings(page));
    await expect(settingGroup(dialog, 'Motion').getByRole('button', { name: 'Full', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('settings dialog traps focus, closes with Escape, and restores its trigger', async ({ page }) => {
    await visitApp(page);

    const trigger = page.getByRole('button', { name: 'Open reading environment settings' });
    await trigger.focus();
    const opened = await openSettings(page);
    const { dialog } = opened;

    await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);

    for (let index = 0; index < 16; index += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press('Shift+Tab');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);

    await closeDialogWithEscape(page, dialog);
    await expect(trigger).toBeFocused();
  });

  test('Ways opens from the top rail and Settings without replacing the Oracle', async ({ page }) => {
    await visitApp(page);
    const oracle = page.getByRole('button', { name: /BEGIN CONSULTATION/i });
    await expect(oracle).toBeVisible();

    const openedWays = await openWays(page);
    await expect(openedWays.trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(openedWays.trigger).toHaveAttribute('aria-pressed', 'true');
    await expect(openedWays.dialog.getByRole('button', { name: 'I have a question' })).toBeVisible();
    await closeDialogWithEscape(page, openedWays.dialog);
    await expect(openedWays.trigger).toBeFocused();
    await expect(oracle).toBeVisible();

    const openedSettings = await openSettings(page);
    await activate(openedSettings.dialog.getByRole('button', { name: 'Open Ways of Working' }));
    const settingsWays = page.getByRole('dialog', { name: 'Ways of Working' });
    await expect(settingsWays).toBeVisible();
    await closeDialogWithEscape(page, settingsWays);
    await expect(oracle).toBeVisible();

    const raw = await page.evaluate((key) => localStorage.getItem(key), SETTINGS_KEY);
    expect(raw).toContain('"orientationSeen":true');
  });

  test('closed Fold rail scrolls fully to WAYS without document overflow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'fold6-closed', 'Narrow rail behavior is specific to the closed Fold emulation.');
    await visitApp(page);

    const rail = page.locator('.nav-rail');
    const ways = page.getByRole('button', { name: 'Open Ways of Working guide' });
    await expect(rail).toBeVisible();
    await expect(ways).toBeAttached();

    const before = await rail.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollLeft: element.scrollLeft,
    }));
    expect(before.scrollWidth).toBeGreaterThan(before.clientWidth);

    await ways.evaluate((element) => element.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await expect(ways).toBeVisible();
    const after = await rail.evaluate((element) => ({
      scrollLeft: element.scrollLeft,
      maxScroll: element.scrollWidth - element.clientWidth,
    }));
    expect(after.scrollLeft).toBeGreaterThan(0);
    expect(after.scrollLeft).toBeLessThanOrEqual(after.maxScroll + 2);
    await assertNoHorizontalOverflow(page);

    const opened = await openWays(page);
    await expect(opened.dialog).toBeVisible();
    await closeDialogWithEscape(page, opened.dialog);
  });

  test('large text and low effects remain usable without horizontal overflow', async ({ page }, testInfo) => {
    await visitApp(page);
    const { dialog } = await openSettings(page);

    await selectSetting(dialog, 'Visual effects', 'Low');
    await selectSetting(dialog, 'Text size', 'Large');
    await expect(page.locator('html')).toHaveAttribute('data-liber-animation-budget', 'reduced');
    await assertNoHorizontalOverflow(page);

    await testInfo.attach(`${testInfo.project.name}-settings-large-low`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await closeDialogWithEscape(page, dialog);
    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole('button', { name: 'Open reading environment settings' })).toBeVisible();
  });
});
