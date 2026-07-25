import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRIMOIRE_NOTE_LIMIT,
  applyGrimoireFilters,
  buildGrimoireRecurrence,
  entryMatchesGrimoireFilters,
  getEntryChapterNumbers,
  normalizeGrimoireFilters,
  normalizeGrimoireNote,
  updateGrimoireEntryMetadata,
} from '../src/features/journal/grimoireWorkbench.js';

const entries = [
  {
    id: 'triad-latest',
    date: '2026-07-20T18:00:00.000Z',
    question: 'How should I integrate the recurring contradiction?',
    chapter: 7,
    title: 'THE DINOSAURS',
    spreadType: 'triad',
    favorite: true,
    note: 'Test the interpretation through one concrete action.',
    interpretation: 'The triad asks for synthesis rather than another abstraction.',
    planetary: 'Mercury hour',
    chapters: [
      { chapter: 7, title: 'THE DINOSAURS', commentary: 'Editorial layer seven.' },
      { chapter: 33, title: 'BAAPHOMET', sourceText: 'Source layer thirty-three.' },
      { chapter: 7, title: 'THE DINOSAURS' },
    ],
  },
  {
    id: 'single-middle',
    date: '2026-07-10T12:00:00.000Z',
    question: 'What does discipline require?',
    chapter: 33,
    title: 'BAAPHOMET',
    spreadType: 'single',
    favorite: false,
    interpretation: 'Discipline is a form of exact attention.',
  },
  {
    id: 'single-oldest',
    date: '2026-06-01T09:30:00.000Z',
    question: 'Where is the hidden opening?',
    chapter: 12,
    title: 'THE DRAGON-FLIES',
    spreadType: 'single',
    favorite: true,
    note: 'Return after thirty-three days.',
  },
];

test('normalizes invalid filter values without weakening valid choices', () => {
  assert.deepEqual(normalizeGrimoireFilters({
    query: 'mercury',
    spread: 'invalid',
    favoritesOnly: true,
    chapter: '33',
    from: '2026-07-01',
    sort: 'oldest',
  }), {
    query: 'mercury',
    spread: 'all',
    favoritesOnly: true,
    chapter: 33,
    from: '2026-07-01',
    to: null,
    sort: 'oldest',
  });
});

test('searches questions, notes, interpretations, context, and nested chapter layers', () => {
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'concrete mercury' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'source thirty three' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'editorial seven' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'missing phrase' }), false);
});

test('combines spread, favorite, chapter, and inclusive date filters locally', () => {
  const result = applyGrimoireFilters(entries, {
    spread: 'triad',
    favoritesOnly: true,
    chapter: 33,
    from: '2026-07-20',
    to: '2026-07-20',
  });
  assert.deepEqual(result.map((entry) => entry.id), ['triad-latest']);
});

test('sorts deterministically without mutating the source array', () => {
  const original = [...entries];
  const oldest = applyGrimoireFilters(entries, { sort: 'oldest' });
  assert.deepEqual(oldest.map((entry) => entry.id), ['single-oldest', 'single-middle', 'triad-latest']);
  assert.deepEqual(entries, original);
});

test('extracts unique chapter numbers from primary and triad records', () => {
  assert.deepEqual(getEntryChapterNumbers(entries[0]), [7, 33]);
});

test('updates favorite and private note metadata immutably', () => {
  const result = updateGrimoireEntryMetadata(entries, 'single-middle', {
    favorite: true,
    note: 'Observe before drawing again.\r\nRecord the result.',
  });
  assert.notEqual(result, entries);
  assert.equal(result[1].favorite, true);
  assert.equal(result[1].note, 'Observe before drawing again.\nRecord the result.');
  assert.equal(entries[1].favorite, false);
  assert.equal(entries[1].note, undefined);
});

test('enforces a bounded integration-note size', () => {
  assert.equal(normalizeGrimoireNote(null), '');
  assert.throws(() => normalizeGrimoireNote('x'.repeat(GRIMOIRE_NOTE_LIMIT + 1)), RangeError);
});

test('builds recurrence summaries with appearances distinct from consultations', () => {
  const recurrence = buildGrimoireRecurrence(entries);
  const chapter33 = recurrence.find((item) => item.chapter === 33);
  const chapter7 = recurrence.find((item) => item.chapter === 7);

  assert.deepEqual({
    appearances: chapter33.appearances,
    consultations: chapter33.consultations,
    favoriteConsultations: chapter33.favoriteConsultations,
    entryIds: chapter33.entryIds,
  }, {
    appearances: 2,
    consultations: 2,
    favoriteConsultations: 1,
    entryIds: ['triad-latest', 'single-middle'],
  });

  assert.equal(chapter7.appearances, 1);
  assert.equal(chapter7.consultations, 1);
  assert.equal(chapter7.favoriteConsultations, 1);
  assert.equal(recurrence[0].chapter, 33);
});
