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

test('normalizes invalid filter values without converting an absent chapter to zero', () => {
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
  assert.equal(normalizeGrimoireFilters({}).chapter, null);
  assert.equal(normalizeGrimoireFilters({ chapter: null }).chapter, null);
});

test('recognizes current, historical, and future-compatible Triad labels', () => {
  for (const label of ['spread', 'triad', 'TRIAD SPREAD', 'three-card', 'three card', 'Thesis/Antithesis/Synthesis']) {
    assert.equal(normalizeSpreadType(label), 'triad', label);
  }
  assert.equal(normalizeSpreadType('single'), 'single');
  assert.equal(normalizeSpreadType(null), 'single');
});

test('searches questions, notes, interpretations, canonical corpus, context, and nested chapter layers', () => {
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'concrete mercury' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'source thirty three' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'editorial seven' }), true);
  assert.equal(entryMatchesGrimoireFilters(entries[0], { query: 'missing phrase' }), false);
  assert.equal(entryMatchesGrimoireFilters({
    id: 'canonical',
    date: '2026-07-20T18:00:00.000Z',
    question: 'Canonical hydration',
    chapter: 1,
    title: 'THE SABBATH OF THE GOAT',
    spreadType: 'single',
  }, { query: 'caduceus winged disk' }), true);
});

test('retains richer nested metadata while deduplicating repeated chapters', () => {
  const records = getEntryChapterRecords(entries[0]);
  assert.deepEqual(records.map((record) => record.chapter), [7, 33]);
  assert.equal(records[0].commentary, 'Editorial layer seven.');
  assert.equal(records[1].sourceText, 'Source layer thirty-three.');
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

test('uses explicit consultation IDs and deterministic legacy Triad fallbacks', () => {
  assert.equal(getGrimoireConsultationKey(entries[0]), 'consultation:consultation-triad-latest');
  const legacyA = { ...entries[0], id: 'legacy-a', consultationId: undefined, date: '2026-07-20T18:00:01.000Z' };
  const legacyB = { ...legacyA, id: 'legacy-b', date: '2026-07-20T18:00:49.000Z' };
  assert.equal(getGrimoireConsultationKey(legacyA), getGrimoireConsultationKey(legacyB));
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
