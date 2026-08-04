import { expect } from '@playwright/test';

export const JOURNAL_KEY = 'liber333_journal';
export const TOTAL_KEY = 'liber333_total';

export async function activate(locator) {
  await expect(locator).toBeVisible();
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    element.click();
  });
}

export function sampleJournalEntries() {
  return [
    {
      id: 'single-discipline',
      consultationId: 'consultation-single-discipline',
      spreadPosition: 'single',
      schemaVersion: 2,
      date: '2026-07-20T18:00:00.000Z',
      question: 'What does discipline require now?',
      chapter: 33,
      title: 'BAAPHOMET',
      gematria: 333,
      interpretation: 'Discipline is exact attention rather than punishment.',
      spreadType: 'single',
      planetary: 'Mercury',
      lunar: 'First Quarter',
      favorite: false,
      note: '',
    },
    {
      id: 'triad-thesis',
      consultationId: 'consultation-triad-contradiction',
      spreadPosition: 'thesis',
      schemaVersion: 2,
      date: '2026-07-18T12:00:00.000Z',
      question: 'How should I integrate the recurring contradiction?',
      chapter: 7,
      title: 'THE DINOSAURS',
      gematria: 777,
      interpretation: 'Hold the contradiction until a third movement appears.',
      spreadType: 'Thesis/Antithesis/Synthesis',
      planetary: 'Venus',
      lunar: 'Waxing Crescent',
      favorite: true,
      note: 'Test the synthesis through one concrete action.',
    },
    {
      id: 'triad-antithesis',
      consultationId: 'consultation-triad-contradiction',
      spreadPosition: 'antithesis',
      schemaVersion: 2,
      date: '2026-07-18T12:00:00.000Z',
      question: 'How should I integrate the recurring contradiction?',
      chapter: 33,
      title: 'BAAPHOMET',
      gematria: 777,
      interpretation: 'Hold the contradiction until a third movement appears.',
      spreadType: 'Thesis/Antithesis/Synthesis',
      planetary: 'Venus',
      lunar: 'Waxing Crescent',
      favorite: true,
      note: 'Test the synthesis through one concrete action.',
    },
    {
      id: 'triad-synthesis',
      consultationId: 'consultation-triad-contradiction',
      spreadPosition: 'synthesis',
      schemaVersion: 2,
      date: '2026-07-18T12:00:00.000Z',
      question: 'How should I integrate the recurring contradiction?',
      // Chapter 3 is the canonical corpus record for THE OYSTER.
      chapter: 3,
      title: 'THE OYSTER',
      gematria: 777,
      interpretation: 'Hold the contradiction until a third movement appears.',
      spreadType: 'Thesis/Antithesis/Synthesis',
      planetary: 'Venus',
      lunar: 'Waxing Crescent',
      favorite: true,
      note: 'Test the synthesis through one concrete action.',
    },
    {
      id: 'single-opening',
      consultationId: 'consultation-single-opening',
      spreadPosition: 'single',
      schemaVersion: 2,
      date: '2026-06-01T09:30:00.000Z',
      question: 'Where is the hidden opening?',
      chapter: 12,
      title: 'THE DRAGON-FLIES',
      gematria: 120,
      interpretation: null,
      spreadType: 'single',
      planetary: 'Moon',
      lunar: 'New Moon',
      favorite: false,
      note: '',
    },
  ];
}

export async function seedJournal(page, { entries = sampleJournalEntries(), totalReadings = 44 } = {}) {
  await page.addInitScript(({ journalKey, totalKey, entries: seededEntries, total }) => {
    if (localStorage.getItem(journalKey) === null) {
      localStorage.setItem(journalKey, JSON.stringify(seededEntries));
    }
    if (localStorage.getItem(totalKey) === null) {
      localStorage.setItem(totalKey, String(total));
    }
  }, { journalKey: JOURNAL_KEY, totalKey: TOTAL_KEY, entries, total: totalReadings });
}

export async function visitApp(page) {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
}

export async function openWorkbench(page) {
  const trigger = page.getByRole('button', { name: /GRIMOIRE/i }).first();
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await activate(trigger);
  const dialog = page.getByRole('dialog', { name: /Grimoire Workbench/i });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

export async function readJournal(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }, JOURNAL_KEY);
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
