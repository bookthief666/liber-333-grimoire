import { expect, test } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  openWorkbench,
  seedJournal,
  visitApp,
} from './workbenchHelpers.mjs';

test.describe('Physical Fold 6 refinements', () => {
  test.beforeEach(async ({ page }) => {
    await seedJournal(page);
    await visitApp(page);
  });

  test('keeps every Workbench action visible and pairs compact filters on the closed screen', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'fold6-closed');

    const { dialog } = await openWorkbench(page);
    const toolbar = dialog.locator('.grimoire-workbench-toolbar');
    await expect(toolbar).toBeVisible();

    const toolbarMetrics = await toolbar.evaluate((element) => {
      const container = element.getBoundingClientRect();
      const buttons = [...element.querySelectorAll('button')].map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
        };
      });
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        left: container.left,
        right: container.right,
        buttons,
      };
    });

    expect(toolbarMetrics.scrollWidth, JSON.stringify(toolbarMetrics)).toBeLessThanOrEqual(toolbarMetrics.clientWidth + 1);
    for (const button of toolbarMetrics.buttons) {
      expect(button.width).toBeGreaterThan(0);
      expect(button.left).toBeGreaterThanOrEqual(toolbarMetrics.left - 1);
      expect(button.right).toBeLessThanOrEqual(toolbarMetrics.right + 1);
    }

    const filterColumns = await dialog.locator('.grimoire-filter-grid').evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean),
    );
    expect(filterColumns).toHaveLength(2);

    await assertNoHorizontalOverflow(page);
  });
});
