import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRIMOIRE_NOTE_LIMIT,
  applyGrimoireFilters,
  buildGrimoireRecurrence,
  entryMatchesGrimoireFilters,
  getEntryChapterNumbers,
  getEntryChapterRecords,
  getGrimoireConsultationKey,
  normalizeGrimoireFilters,
  normalizeGrimoireNote,
  normalizeSpreadType,
  updateGrimoireEntryMetadata,
} from '../src/features/journal/grimoireWorkbench.js';

const entries = [
  {
    id: 'triad-latest',
    consultationId: 'consultation-triad-latest',
    date: '2026-07-20T18:00:00.000Z',
    question: 'How should I integrate the recurring contradiction?',
    chapter: 7,
    title: 'THE DINOSAURS',
    spreadType: 'Thesis/Antithesis/Synthesis',
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
    consultationId: 'consultation-single-middle',
    date: '2026-07-10T12:00:00.000Z',
    question: 'What does discipline require?',
    chapter: 33,
    title: 'BAAPHOMET',
    spreadType: 'single',
    favorite: false,
    interpretation: 'Return to the material act.',
    lunar: 'First Quarter',
  },
  {
    id: 'single-oldest',
    consultationId: 'consultation-single-oldest',
    date: '2026-06-01T12:00:00.000Z',
    question: 'What is hidden in the source?',
    chapter: 44,
    title: 'THE MASS OF THE PHOENIX',
    spreadType: 'single',
    favorite: false,
  },
];

test('normalizes invalid filter values without converting an absent chapter to zero', () => {
  assert.deepEqual(normalizeGrimoireFilters({ chapter: null, spread: 'unknown', sort: 'unknown' }), {
    query: '',
    spread: 'all',
    favoritesOnly: false,
    chapter: null,
    from: null,
    to: null,
    sort: 'newest',
  });
});

test('recognizes current, historical, and future-compatible Triad labels', () => {
  for (const value of ['triad', 'spread', 'three-card', 'three card', 'Thesis/Antithesis/Synthesis']) {
    assert.equal(normalizeSpreadType(value), 'triad');
  }
  assert.equal(normalizeSpreadType('single'), 'single');
});

test('searches questions, notes, interpretations, canonical corpus, context, and nested chapter layers', () => {
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'recurring contradiction' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'concrete action' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'synthesis abstraction' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'mercury hour' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'editorial seven' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'source thirty three' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'chapter 33' }), true);
});

test('retains richer nested metadata while deduplicating repeated chapters', () => {
  const records = getEntryChapterRecords(entries[0]);
  assert.deepEqual(records.map((record) => record.chapter), [7, 33]);
  assert.match(records.find((record) => record.chapter === 7).commentary, /Editorial layer seven/);
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
  const source = [...entries];
  assert.deepEqual(applyGrimoireFilters(entries, { sort: 'oldest' }).map((entry) => entry.id), [
    'single-oldest',
    'single-middle',
    'triad-latest',
  ]);
  assert.deepEqual(entries, source);
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

test('uses explicit consultation IDs and deterministic per-row legacy fallbacks', () => {
  assert.equal(getGrimoireConsultationKey(entries[0]), 'consultation:consultation-triad-latest');
  const legacyA = { ...entries[0], id: 'legacy-a', consultationId: undefined, date: '2026-07-20T18:00:01.000Z' };
  const legacyB = { ...legacyA, id: 'legacy-b', date: '2026-07-20T18:00:49.000Z' };
  assert.equal(getGrimoireConsultationKey(legacyA), getGrimoireConsultationKey(legacyA));
  assert.notEqual(getGrimoireConsultationKey(legacyA), getGrimoireConsultationKey(legacyB));
});

test('builds recurrence summaries with appearances distinct from consultations', () => {
  const grouped = [
    {
      id: 'triad-thesis',
      consultationId: 'triad-1',
      date: '2026-07-20T18:00:00.000Z',
      question: 'Triad',
      chapter: 33,
      title: 'BAAPHOMET',
      spreadType: 'Thesis/Antithesis/Synthesis',
      favorite: false,
    },
    {
      id: 'triad-antithesis',
      consultationId: 'triad-1',
      date: '2026-07-20T18:00:00.000Z',
      question: 'Triad',
      chapter: 33,
      title: 'BAAPHOMET',
      spreadType: 'Thesis/Antithesis/Synthesis',
      favorite: true,
    },
    entries[1],
  ];
  const chapter33 = buildGrimoireRecurrence(grouped).find((item) => item.chapter === 33);
  assert.deepEqual({
    appearances: chapter33.appearances,
    consultations: chapter33.consultations,
    favoriteConsultations: chapter33.favoriteConsultations,
    entryIds: chapter33.entryIds,
  }, {
    appearances: 3,
    consultations: 2,
    favoriteConsultations: 1,
    entryIds: ['triad-thesis', 'triad-antithesis', 'single-middle'],
  });
});
