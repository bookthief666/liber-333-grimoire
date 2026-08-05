import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  JOURNAL_KEY,
  TOTAL_KEY,
  openWorkbench,
  readJournal,
  seedJournal,
  visitApp,
} from './workbenchHelpers.mjs';

test.describe('Grimoire release integrity', () => {
  test.beforeEach(async ({ page }) => {
    await seedJournal(page);
    await visitApp(page);
  });

  test('names lifetime readings, saved consultations, and shown entries without conflating their units', async ({ page }) => {
    const { dialog } = await openWorkbench(page);

    await expect(dialog.getByText('44 lifetime readings', { exact: true })).toBeVisible();
    await expect(dialog.getByText('3 saved consultations', { exact: true })).toBeVisible();
    await expect(dialog.getByText('5 entries shown', { exact: true }).first()).toBeVisible();

    const resultsHeading = dialog.locator('.grimoire-results-heading');
    await expect(resultsHeading).toContainText('3 consultations');
    await expect(resultsHeading).toContainText('5 entries shown');

    await dialog.getByRole('button', { name: 'Triad', exact: true }).click();
    await expect(resultsHeading).toContainText('1 consultation');
    await expect(resultsHeading).toContainText('3 entries shown');
    await expect(dialog.getByText('3 saved consultations', { exact: true })).toBeVisible();
  });

  test('requires confirmation, lets Escape cancel, and deletes a complete Triad without changing lifetime totals', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const triad = dialog.locator('article').filter({ hasText: 'How should I integrate the recurring contradiction?' }).first();
    const deleteButton = triad.locator('button.danger-text');

    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    await expect(deleteButton).toHaveAttribute('data-delete-armed', 'true');
    await expect(deleteButton).toHaveText('Confirm Triad delete');
    await expect(dialog.getByText(/removes all 3 entries and their private notes/i)).toBeVisible();
    expect(await readJournal(page)).toHaveLength(5);

    await page.keyboard.press('Escape');
    await expect(deleteButton).toHaveAttribute('data-delete-armed', 'false');
    await expect(deleteButton).toHaveText('Delete');
    await expect(deleteButton).toBeFocused();
    await expect(dialog.getByText('Deletion cancelled.', { exact: true })).toBeVisible();
    expect(await readJournal(page)).toHaveLength(5);

    await deleteButton.click();
    await expect(deleteButton).toHaveText('Confirm Triad delete');
    await deleteButton.click();

    const stored = await readJournal(page);
    expect(stored).toHaveLength(2);
    expect(stored.some((entry) => entry.consultationId === 'consultation-triad-contradiction')).toBe(false);
    expect(await page.evaluate((key) => localStorage.getItem(key), TOTAL_KEY)).toBe('44');
    await expect(dialog.getByText(/Deleted one Triad consultation and 3 saved entries/i)).toBeVisible();
    await expect(dialog.getByText('2 saved consultations', { exact: true })).toBeVisible();
    await expect(dialog.getByText('2 entries shown', { exact: true }).first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'JSON backup' }).click();
    const download = await downloadPromise;
    const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
    expect(backup.totalReadings).toBe(44);
    expect(backup.entries).toHaveLength(2);
    expect(backup.entries.some((entry) => entry.consultationId === 'consultation-triad-contradiction')).toBe(false);
  });

  test('expires an armed deletion without mutating the journal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    const { dialog } = await openWorkbench(page);
    const triad = dialog.locator('article').filter({ hasText: 'How should I integrate the recurring contradiction?' }).first();
    const deleteButton = triad.locator('button.danger-text');

    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();
    await expect(deleteButton).toHaveAttribute('data-delete-armed', 'true');

    await page.waitForTimeout(5_200);

    await expect(deleteButton).toHaveAttribute('data-delete-armed', 'false');
    await expect(deleteButton).toHaveText('Delete');
    await expect(dialog.getByText(/confirmation expired/i)).toBeVisible();
    expect(await readJournal(page)).toHaveLength(5);
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).length, JOURNAL_KEY)).toBe(5);
  });
});
