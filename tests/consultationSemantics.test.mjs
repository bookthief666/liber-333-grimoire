import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countJournalConsultations,
  countNewJournalConsultations,
  groupJournalEntriesByConsultation,
  retainCompleteJournalConsultations,
} from '../src/features/journal/consultationSemantics.js';

const triad = ['thesis', 'antithesis', 'synthesis'].map((spreadPosition, index) => ({
  id: `triad-${spreadPosition}`,
  consultationId: 'consultation-triad',
  spreadPosition,
  spreadType: 'triad',
  date: '2026-08-05T03:00:00.000Z',
  question: 'How do these positions resolve?',
  chapter: index + 1,
  gematria: 333,
}));

const single = (id, date = '2026-08-04T03:00:00.000Z') => ({
  id,
  consultationId: `consultation-${id}`,
  spreadPosition: 'single',
  spreadType: 'single',
  date,
  question: `Question ${id}`,
  chapter: 7,
});

test('counts a three-entry Triad as one consultation', () => {
  assert.equal(countJournalConsultations([...triad, single('one')]), 2);
  assert.equal(groupJournalEntriesByConsultation([...triad, single('one')]).length, 2);
});

test('groups legacy Triad rows without explicit consultation IDs', () => {
  const legacy = triad.map(({ consultationId, spreadPosition, ...entry }, index) => ({
    ...entry,
    id: `legacy-${index}`,
    spreadType: 'Thesis/Antithesis/Synthesis',
    date: `2026-08-05T03:00:${String(10 + index).padStart(2, '0')}.000Z`,
  }));

  assert.equal(countJournalConsultations(legacy), 1);
  assert.equal(groupJournalEntriesByConsultation(legacy).length, 1);
});

test('counts only consultation identities absent from the existing journal', () => {
  assert.equal(countNewJournalConsultations([single('one')], [...triad, single('one')]), 1);
  assert.equal(countNewJournalConsultations([...triad], triad), 0);
});

test('retains complete consultations without splitting a Triad at the entry cap', () => {
  const olderSingles = Array.from({ length: 49 }, (_, index) => single(`older-${index}`));
  const result = retainCompleteJournalConsultations([...triad, ...olderSingles], 50);

  assert.equal(result.entries.length, 50);
  assert.deepEqual(result.entries.slice(0, 3).map((entry) => entry.spreadPosition), [
    'thesis',
    'antithesis',
    'synthesis',
  ]);
  assert.equal(result.omittedEntries, 2);
  assert.equal(result.omittedConsultations, 2);
});

test('omits an entire consultation when the remaining capacity cannot contain it', () => {
  const newestSingles = Array.from({ length: 49 }, (_, index) => single(`new-${index}`));
  const result = retainCompleteJournalConsultations([...newestSingles, ...triad], 50);

  assert.equal(result.entries.length, 49);
  assert.equal(result.entries.some((entry) => entry.consultationId === 'consultation-triad'), false);
  assert.equal(result.omittedEntries, 3);
  assert.equal(result.omittedConsultations, 1);
});
