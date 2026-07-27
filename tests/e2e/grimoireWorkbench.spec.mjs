import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  activate,
  assertNoHorizontalOverflow,
  openWorkbench,
  readJournal,
  seedJournal,
  visitApp,
} from './workbenchHelpers.mjs';

test.describe('Grimoire Workbench', () => {
  test.beforeEach(async ({ page }) => {
    await seedJournal(page);
    await visitApp(page);
  });

  test('searches and combines spread, favorite, and reset filters locally', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const search = dialog.getByLabel('Search the Workbench');
    await expect(search).toBeFocused();

    await search.fill('discipline attention');
    await expect(dialog.getByText('What does discipline require now?')).toBeVisible();
    await expect(dialog.getByText('How should I integrate the recurring contradiction?')).toBeHidden();

    await activate(dialog.getByRole('button', { name: 'Reset', exact: true }));
    await activate(dialog.getByRole('button', { name: 'Triad', exact: true }));
    await expect(dialog.getByText('How should I integrate the recurring contradiction?').first()).toBeVisible();
    await expect(dialog.getByText('What does discipline require now?')).toBeHidden();

    await activate(dialog.getByRole('button', { name: 'Favorites only' }));
    await expect(dialog.getByText('How should I integrate the recurring contradiction?').first()).toBeVisible();

    await activate(dialog.getByRole('button', { name: 'Reset', exact: true }));
    await expect(dialog.getByText('What does discipline require now?')).toBeVisible();
    await expect(dialog.getByText(/All saved consultations/i)).toBeVisible();
  });

  test('persists favorite state through a reload', async ({ page }) => {
    let { dialog } = await openWorkbench(page);
    const discipline = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });
    const favorite = discipline.getByRole('button', { name: 'Add to favorites' });
    await activate(favorite);
    await expect(favorite).toHaveAttribute('aria-pressed', 'true');

    let stored = await readJournal(page);
    expect(stored.find((entry) => entry.id === 'single-discipline')?.favorite).toBe(true);

    await page.reload();
    ({ dialog } = await openWorkbench(page));
    const reloaded = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });
    await expect(reloaded.getByRole('button', { name: 'Remove from favorites' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('cancels and saves private integration notes safely', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const discipline = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });

    await activate(discipline.getByRole('button', { name: 'Add note' }));
    const editor = discipline.getByLabel('Private integration note');
    await editor.fill('This draft must not persist.');
    await activate(discipline.getByRole('button', { name: 'Cancel' }));
    let stored = await readJournal(page);
    expect(stored.find((entry) => entry.id === 'single-discipline')?.note).toBe('');

    await activate(discipline.getByRole('button', { name: 'Add note' }));
    const savedText = 'Test one disciplined action and record the concrete result.';
    await discipline.getByLabel('Private integration note').fill(savedText);
    await activate(discipline.getByRole('button', { name: 'Save note' }));
    await expect(discipline.getByText(savedText)).toBeVisible();
    stored = await readJournal(page);
    expect(stored.find((entry) => entry.id === 'single-discipline')?.note).toBe(savedText);
  });

  test('Escape closes a note editor before closing the Workbench and restores trigger focus', async ({ page }) => {
    const { trigger, dialog } = await openWorkbench(page);
    const discipline = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });
    await activate(discipline.getByRole('button', { name: 'Add note' }));
    await expect(discipline.getByLabel('Private integration note')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(discipline.getByLabel('Private integration note')).toBeHidden();
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('downloads filtered Markdown and canonical JSON locally', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    await dialog.getByLabel('Search the Workbench').fill('discipline');

    const markdownPromise = page.waitForEvent('download');
    await activate(dialog.getByRole('button', { name: 'Markdown: shown' }));
    const markdownDownload = await markdownPromise;
    expect(markdownDownload.suggestedFilename()).toMatch(/liber-333-grimoire-filtered-.*\.md$/);
    const markdown = await readFile(await markdownDownload.path(), 'utf8');
    expect(markdown).toContain('What does discipline require now?');
    expect(markdown).not.toContain('Where is the hidden opening?');
    expect(markdown).toContain('Oracle interpretation');

    const jsonPromise = page.waitForEvent('download');
    await activate(dialog.getByRole('button', { name: 'JSON backup' }));
    const jsonDownload = await jsonPromise;
    const backup = JSON.parse(await readFile(await jsonDownload.path(), 'utf8'));
    expect(backup.format).toBe('liber-333-grimoire-backup');
    expect(backup.version).toBe(2);
    expect(backup.entries).toHaveLength(5);
  });

  test('recurrence controls filter the visible reading set', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    const recurrence = dialog.getByRole('region', { name: 'Recurrence' });
    const chapter33 = recurrence.getByRole('button', { name: /BAAPHOMET/i });
    await activate(chapter33);
    await expect(dialog.getByText('What does discipline require now?')).toBeVisible();
    await expect(dialog.getByText('How should I integrate the recurring contradiction?').first()).toBeVisible();
    await expect(dialog.getByText('Where is the hidden opening?')).toBeHidden();
  });

  test('remains usable without horizontal document overflow', async ({ page }) => {
    const { dialog } = await openWorkbench(page);
    await expect(dialog.getByRole('button', { name: 'JSON backup' })).toBeVisible();
    await expect(dialog.getByLabel('Search the Workbench')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Favorites only' })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('preserves local Workbench data across an offline restart', async ({ page, context }, testInfo) => {
    test.skip(!['desktop-chromium', 'fold6-closed', 'fold6-unfolded'].includes(testInfo.project.name));
    let { dialog } = await openWorkbench(page);
    const discipline = dialog.locator('article').filter({ hasText: 'What does discipline require now?' });
    await activate(discipline.getByRole('button', { name: 'Add note' }));
    await discipline.getByLabel('Private integration note').fill('Available after an offline restart.');
    await activate(discipline.getByRole('button', { name: 'Save note' }));
    await page.keyboard.press('Escape');

    await page.reload();
    await page.waitForFunction(() => !('serviceWorker' in navigator) || Boolean(navigator.serviceWorker.controller), null, { timeout: 15_000 }).catch(() => {});
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    ({ dialog } = await openWorkbench(page));
    await expect(dialog.getByText('Available after an offline restart.')).toBeVisible();
    await context.setOffline(false);
  });
});
