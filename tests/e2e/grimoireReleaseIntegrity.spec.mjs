import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  JOURNAL_KEY,
  TOTAL_KEY,
  activate,
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

    await activate(dialog.getByRole('button', { name: 'Triad', exact: true }));
    await expect(resultsHeading).toContainText('1 consultation');
    await expect(resultsHeading).toContainText('3 entries shown');
    await expect(dialog.getByText('3 saved consultations', { exact: true })).toBeVisible();
  });

  test('requires the exact armed row to confirm complete-Triad deletion', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const triadRows = dialog.locator('article').filter({ hasText: 'How should I integrate the recurring contradiction?' });
    await expect(triadRows).toHaveCount(3);

    const firstDelete = triadRows.nth(0).locator('button.danger-text');
    const siblingDelete = triadRows.nth(1).locator('button.danger-text');
    const thirdDelete = triadRows.nth(2).locator('button.danger-text');

    await activate(firstDelete);

    await expect(firstDelete).toHaveAttribute('data-delete-armed', 'true');
    await expect(firstDelete).toHaveText('Confirm Triad delete');
    await expect(siblingDelete).toHaveAttribute('data-delete-armed', 'false');
    await expect(siblingDelete).toHaveText('Delete');
    await expect(thirdDelete).toHaveAttribute('data-delete-armed', 'false');
    await expect(dialog.getByText(/removes all 3 entries and their private notes/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Confirm deletion of the complete Triad consultation/i })).toHaveCount(1);
    expect(await readJournal(page)).toHaveLength(5);

    await activate(siblingDelete);

    const transferredState = await siblingDelete.evaluate((element) => ({
      armed: element.dataset.deleteArmed,
      text: element.textContent,
    }));
    expect(transferredState).toEqual({ armed: 'true', text: 'Confirm Triad delete' });
    await expect(dialog.getByRole('button', { name: /Confirm deletion of the complete Triad consultation/i })).toHaveCount(1);

    await page.keyboard.press('Escape');
    expect(await readJournal(page)).toHaveLength(5);
    await expect(firstDelete).toHaveAttribute('data-delete-armed', 'false');
    await expect(firstDelete).toHaveText('Delete');
    await expect(siblingDelete).toHaveAttribute('data-delete-armed', 'false');
    await expect(siblingDelete).toHaveText('Delete');
    await expect(siblingDelete).toBeFocused();
    await expect(dialog.getByText('Deletion cancelled.', { exact: true })).toBeVisible();
    expect(await readJournal(page)).toHaveLength(5);

    await activate(firstDelete);
    await expect(firstDelete).toHaveText('Confirm Triad delete');
    await activate(firstDelete);

    const stored = await readJournal(page);
    expect(stored).toHaveLength(2);
    expect(stored.some((entry) => entry.consultationId === 'consultation-triad-contradiction')).toBe(false);
    expect(await page.evaluate((key) => localStorage.getItem(key), TOTAL_KEY)).toBe('44');
    await expect(dialog.getByText(/Deleted one Triad consultation and 3 saved entries/i)).toBeVisible();
    await expect(dialog.getByText('2 saved consultations', { exact: true })).toBeVisible();
    await expect(dialog.getByText('2 entries shown', { exact: true }).first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await activate(dialog.getByRole('button', { name: 'JSON backup' }));
    const download = await downloadPromise;
    const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
    await download.delete();
    expect(backup.totalReadings).toBe(44);
    expect(backup.entries).toHaveLength(2);
    expect(backup.entries.some((entry) => entry.consultationId === 'consultation-triad-contradiction')).toBe(false);
  });

  test('expires an armed deletion without mutating the journal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');

    const { dialog } = await openWorkbench(page);
    const triad = dialog.locator('article').filter({ hasText: 'How should I integrate the recurring contradiction?' }).first();
    const deleteButton = triad.locator('button.danger-text');

    await activate(deleteButton);
    await expect(deleteButton).toHaveAttribute('data-delete-armed', 'true');

    await page.waitForTimeout(5_200);

    await expect(deleteButton).toHaveAttribute('data-delete-armed', 'false');
    await expect(deleteButton).toHaveText('Delete');
    await expect(dialog.getByText(/confirmation expired/i)).toBeVisible();
    expect(await readJournal(page)).toHaveLength(5);
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).length, JOURNAL_KEY)).toBe(5);
  });

  test('cancels note auto-close when editing resumes during the saved window', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const discipline = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });

    await activate(discipline.getByRole('button', { name: 'Add note' }));
    const editor = discipline.getByLabel('Private integration note');
    await editor.fill('Save this note first.');
    await activate(discipline.getByRole('button', { name: 'Save note' }));
    await expect(discipline.getByText('Saved.', { exact: true })).toBeVisible();

    await editor.evaluate((element) => element.focus());
    await editor.fill('Save this note first. Continue with an unsaved revision.');
    await expect(discipline.getByText('Unsaved changes', { exact: true })).toBeVisible();
    await page.waitForTimeout(1_650);

    await expect(editor).toBeVisible();
    await expect(editor).toHaveValue('Save this note first. Continue with an unsaved revision.');
    await expect(discipline.getByText('Unsaved changes', { exact: true })).toBeVisible();
    const stored = await readJournal(page);
    expect(stored.find((entry) => entry.id === 'single-discipline')?.note).toBe('Save this note first.');
  });

  test('does not let a saved note close timer dismiss a newly opened editor', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const discipline = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });
    const opening = dialog.locator('article').filter({ hasText: 'Where is the hidden opening?' });

    await activate(discipline.getByRole('button', { name: 'Add note' }));
    await discipline.getByLabel('Private integration note').fill('Save this first note.');
    await activate(discipline.getByRole('button', { name: 'Save note' }));
    await expect(discipline.getByText('Saved.', { exact: true })).toBeVisible();

    await activate(opening.getByRole('button', { name: 'Add note' }));
    const nextEditor = opening.getByLabel('Private integration note');
    await nextEditor.fill('This second draft must remain open.');

    await page.waitForTimeout(1_650);

    await expect(nextEditor).toBeVisible();
    await expect(nextEditor).toHaveValue('This second draft must remain open.');
    await expect(opening.getByText('Unsaved changes', { exact: true })).toBeVisible();
    const stored = await readJournal(page);
    expect(stored.find((entry) => entry.id === 'single-discipline')?.note).toBe('Save this first note.');
    expect(stored.find((entry) => entry.id === 'single-opening')?.note).toBe('');
  });
});
