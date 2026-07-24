import { expect } from '@playwright/test';

export const SETTINGS_KEY = 'liber333_experience_settings_v1';

export async function activate(locator) {
  await expect(locator).toBeVisible();
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    element.click();
  });
}

export async function visitApp(page, { reducedMotion = 'no-preference' } = {}) {
  await page.emulateMedia({ reducedMotion });
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
}

export async function dismissOrientation(page) {
  const dialog = page.getByRole('dialog', { name: 'Ways of Working' });
  if (await dialog.isVisible().catch(() => false)) {
    const close = dialog.getByRole('button', { name: /Close Guide|Enter the Astral Void/i });
    await activate(close);
    await expect(dialog).toBeHidden();
  }
}

export async function openWays(page) {
  const trigger = page.getByRole('button', { name: 'Open Ways of Working guide' });
  await activate(trigger);
  const dialog = page.getByRole('dialog', { name: 'Ways of Working' });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

export async function openSettings(page) {
  const trigger = page.getByRole('button', { name: 'Open reading environment settings' });
  await activate(trigger);
  const dialog = page.getByRole('dialog', { name: 'Reading Environment' });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

export function settingGroup(dialog, name) {
  return dialog.getByRole('group', { name });
}

export async function selectSetting(dialog, groupName, optionName) {
  const group = settingGroup(dialog, groupName);
  const option = group.getByRole('button', { name: optionName, exact: true });
  await activate(option);
  await expect(option).toHaveAttribute('aria-pressed', 'true');
}

export async function closeDialogWithEscape(page, dialog) {
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

export async function assertNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 2);
  expect(metrics.bodyWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 2);
}

export async function beginConsultation(page) {
  const begin = page.getByRole('button', { name: /BEGIN CONSULTATION/i });
  if (await begin.isVisible().catch(() => false)) await activate(begin);
  await expect(page.getByPlaceholder('What do you seek to know?')).toBeVisible();
}

export async function runReading(page, { question, spread = 'single' }) {
  await beginConsultation(page);
  const input = page.getByPlaceholder('What do you seek to know?');
  await input.fill(question);
  if (spread === 'triad') {
    await activate(page.getByRole('button', { name: /TRIAD SPREAD/i }));
  } else {
    await activate(page.getByRole('button', { name: /SINGLE/i }));
  }

  const startedAt = Date.now();
  await activate(page.getByRole('button', { name: /DIVINE/i }));
  await expect(page.getByText('CHAPTER', { exact: true })).toBeVisible({ timeout: 12_000 });
  return Date.now() - startedAt;
}

export async function returnToNewReading(page) {
  await activate(page.getByRole('button', { name: /New Reading/i }));
  await expect(page.getByPlaceholder('What do you seek to know?')).toBeVisible();
}

export async function readStoredSettings(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, SETTINGS_KEY);
}
