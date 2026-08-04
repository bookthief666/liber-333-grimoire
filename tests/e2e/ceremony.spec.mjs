import { expect, test } from '@playwright/test';
import {
  closeDialogWithEscape,
  dismissOrientation,
  openSettings,
  returnToNewReading,
  runReading,
  selectSetting,
  visitApp,
} from './helpers.mjs';

async function prepareOracle(page) {
  await page.route('**/api/oracle', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'QA intentionally disabled the external Oracle request.' }),
    });
  });
  await visitApp(page);
  await dismissOrientation(page);

  const { dialog } = await openSettings(page);
  await selectSetting(dialog, 'Sound', 'Off');
  await selectSetting(dialog, 'Voice', 'Off');
  await closeDialogWithEscape(page, dialog);
}

test.describe('ceremony timing', () => {
  test('runtime reports 7000ms for Full and a bounded reduced duration', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Timing contract is sampled once in Chromium.');
    await prepareOracle(page);

    const full = await page.evaluate(() => window.__LIBER333_EXPERIENCE__?.ceremonyDuration?.(7000));
    expect(full).toBe(7000);

    const { dialog } = await openSettings(page);
    await selectSetting(dialog, 'Ceremony', 'Reduced');
    await closeDialogWithEscape(page, dialog);

    const reduced = await page.evaluate(() => window.__LIBER333_EXPERIENCE__?.ceremonyDuration?.(7000));
    expect(reduced).toBeGreaterThanOrEqual(120);
    expect(reduced).toBeLessThanOrEqual(900);
  });

  test('Reduced Ceremony materially shortens the actual Single reveal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Real-time ceremony timing is sampled once in Chromium.');
    await prepareOracle(page);

    const fullElapsed = await runReading(page, {
      question: 'What action will clarify the contradiction before me?',
      spread: 'single',
    });
    expect(fullElapsed).toBeGreaterThanOrEqual(5_800);
    expect(fullElapsed).toBeLessThan(10_500);

    await returnToNewReading(page);
    const opened = await openSettings(page);
    await selectSetting(opened.dialog, 'Ceremony', 'Reduced');
    await closeDialogWithEscape(page, opened.dialog);

    const reducedElapsed = await runReading(page, {
      question: 'What action will clarify the contradiction before me?',
      spread: 'single',
    });

    // The runtime interval is 900ms; CI includes browser rendering and React commit overhead.
    expect(reducedElapsed).toBeLessThan(3_500);
    expect(reducedElapsed).toBeLessThan(fullElapsed * 0.5);
  });

  test('Reduced Ceremony shortens Triad without changing the three-part reading', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Real-time ceremony timing is sampled once in Chromium.');
    await prepareOracle(page);

    const opened = await openSettings(page);
    await selectSetting(opened.dialog, 'Ceremony', 'Reduced');
    await closeDialogWithEscape(page, opened.dialog);

    const elapsed = await runReading(page, {
      question: 'What is the thesis, contradiction, and synthesis of this work?',
      spread: 'triad',
    });

    expect(elapsed).toBeLessThan(3_500);
    await expect(page.getByRole('button', { name: /^THESIS / })).toBeVisible();
    await expect(page.getByRole('button', { name: /^ANTITHESIS / })).toBeVisible();
    await expect(page.getByRole('button', { name: /^SYNTHESIS / })).toBeVisible();
  });
});
