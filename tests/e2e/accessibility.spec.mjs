import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { closeDialogWithEscape, openSettings, openWays, visitApp } from './helpers.mjs';

function seriousViolations(result) {
  return result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
}

test.describe('shell accessibility', () => {
  test('Ways and settings dialogs have no serious structural axe violations', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'The structural accessibility scan is sampled once in Chromium.');

    await visitApp(page);
    await expect(page.getByRole('button', { name: /BEGIN CONSULTATION/i })).toBeVisible();

    const openedWays = await openWays(page);
    const waysResult = await new AxeBuilder({ page })
      .include('.liber-shell-dialog')
      .disableRules(['color-contrast'])
      .analyze();
    expect(seriousViolations(waysResult)).toEqual([]);
    await closeDialogWithEscape(page, openedWays.dialog);

    await openSettings(page);
    const settingsResult = await new AxeBuilder({ page })
      .include('.liber-shell-dialog')
      .disableRules(['color-contrast'])
      .analyze();
    expect(seriousViolations(settingsResult)).toEqual([]);
  });

  test('context and Ways controls expose accessible names and active state', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Accessible-name contract is sampled once in Chromium.');

    await visitApp(page);

    const help = page.getByRole('button', { name: /Explain oracle mode/i });
    const settings = page.getByRole('button', { name: 'Open reading environment settings' });
    const ways = page.getByRole('button', { name: 'Open Ways of Working guide' });
    await expect(help).toHaveAttribute('aria-expanded', 'false');
    await expect(help).toHaveAttribute('aria-pressed', 'false');
    await expect(settings).toHaveAttribute('aria-expanded', 'false');
    await expect(settings).toHaveAttribute('aria-pressed', 'false');
    await expect(ways).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(ways).toHaveAttribute('aria-expanded', 'false');
    await expect(ways).toHaveAttribute('aria-pressed', 'false');

    await ways.focus();
    const openedWays = await openWays(page);
    await expect(ways).toHaveAttribute('aria-expanded', 'true');
    await expect(ways).toHaveAttribute('aria-pressed', 'true');
    await expect(ways).toHaveClass(/is-active/);
    await closeDialogWithEscape(page, openedWays.dialog);
    await expect(ways).toBeFocused();

    await settings.click();
    await expect(settings).toHaveAttribute('aria-expanded', 'true');
    await expect(settings).toHaveAttribute('aria-pressed', 'true');
    await expect(settings).toHaveClass(/is-active/);
  });
});
