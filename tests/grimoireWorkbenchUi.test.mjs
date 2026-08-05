import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Workbench UI exposes local tools and accessible dialog behavior', async () => {
  const source = await readFile(new URL('../src/features/journal/GrimoireWorkbench.jsx', import.meta.url), 'utf8');
  for (const contract of [
    'role="dialog"',
    'aria-modal="true"',
    'aria-labelledby="grimoire-workbench-title"',
    'Search the Workbench',
    'Favorites only',
    'JSON backup',
    'Markdown: all',
    'Markdown: shown',
    'Import JSON',
    'Private integration note',
    'Save note',
    'Recurrence',
    'appearances / consultations',
  ]) assert.ok(source.includes(contract), contract);

  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.stopPropagation\(\)/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(source, /editingIdRef\.current/);
  assert.match(source, /onCloseRef\.current/);
  assert.match(source, /aria-pressed=\{entry\.favorite === true\}/);
  assert.match(source, /onExportMarkdown/);
  assert.match(source, /onSetFavorite/);
  assert.match(source, /onSaveNote/);
});

test('Workbench CSS includes desktop, mobile, closed-Fold, focus, and reduced-motion contracts', async () => {
  const css = await readFile(new URL('../src/features/journal/grimoireWorkbench.css', import.meta.url), 'utf8');
  assert.match(css, /grid-template-columns: minmax\(250px, 320px\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /100dvh/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /overflow-x: auto/);
});

test('reader uses the extracted Workbench and atomic consultation batch wiring', async () => {
  const source = await readFile(new URL('../src/liber333.jsx', import.meta.url), 'utf8');
  assert.match(source, /import GrimoireWorkbench/);
  assert.match(source, /<GrimoireWorkbench/);
  assert.match(source, /onExportMarkdown=\{journal\.exportMarkdown\}/);
  assert.match(source, /onSetFavorite=\{journal\.setFavorite\}/);
  assert.match(source, /onSaveNote=\{journal\.saveNote\}/);
  assert.match(source, /journal\.addEntries\(entriesToSave\)/);
  assert.match(source, /consultationId/);
  assert.match(source, /spreadPosition/);
  assert.doesNotMatch(source, /const JournalOverlay =/);
});

test('journal hook preserves consultation-based lifetime invariants and crossed milestones', async () => {
  const source = await readFile(new URL('../src/features/journal/useJournal.js', import.meta.url), 'utf8');
  assert.match(source, /const addEntries = useCallback/);
  assert.match(source, /countNewJournalConsultations\(previousEntries, additions\)/);
  assert.match(source, /previousTotal \+ consultationDelta/);
  assert.doesNotMatch(source, /previousTotal \+ additions\.length/);
  assert.match(source, /Math\.max\(\s*state\.totalReadings,\s*countJournalConsultations\(state\.entries\)/);
  assert.match(source, /writeTotalReadings\(getLocalStorage\(\), normalizedTotal\)/);
  assert.match(source, /getMilestoneCrossed/);
  assert.match(source, /entriesRef\.current/);
  assert.match(source, /totalReadingsRef\.current/);
  assert.match(source, /addEntries,/);
});
