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

function legacyTriad(dates = [
  '2026-08-05T03:00:10.000Z',
  '2026-08-05T03:00:11.000Z',
  '2026-08-05T03:00:12.000Z',
]) {
  return triad.map(({ consultationId, spreadPosition, ...entry }, index) => ({
    ...entry,
    id: `legacy-${index}`,
    spreadType: 'Thesis/Antithesis/Synthesis',
    date: dates[index],
  }));
}

test('counts a three-entry Triad as one consultation', () => {
  assert.equal(countJournalConsultations([...triad, single('one')]), 2);
  assert.equal(groupJournalEntriesByConsultation([...triad, single('one')]).length, 2);
});

test('groups legacy Triad rows without explicit consultation IDs', () => {
  const legacy = legacyTriad();
  assert.equal(countJournalConsultations(legacy), 1);
  assert.equal(groupJournalEntriesByConsultation(legacy).length, 1);
});

test('keeps an adjacent legacy Triad together across a minute boundary', () => {
  const legacy = legacyTriad([
    '2026-08-05T03:00:59.500Z',
    '2026-08-05T03:01:00.100Z',
    '2026-08-05T03:01:00.700Z',
  ]);
  assert.equal(countJournalConsultations(legacy), 1);
  assert.equal(groupJournalEntriesByConsultation(legacy)[0].entries.length, 3);
});

test('chunks adjacent identical legacy Triads into groups of three', () => {
  const first = legacyTriad();
  const second = legacyTriad([
    '2026-08-05T03:00:13.000Z',
    '2026-08-05T03:00:14.000Z',
    '2026-08-05T03:00:15.000Z',
  ]).map((entry, index) => ({ ...entry, id: `legacy-second-${index}` }));
  const groups = groupJournalEntriesByConsultation([...first, ...second]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => group.entries.length), [3, 3]);
});

test('counts only consultation identities absent from the existing journal', () => {
  assert.equal(countNewJournalConsultations([single('one')], [...triad, single('one')]), 1);
  assert.equal(countNewJournalConsultations([...triad], triad), 0);
});

test('does not recount a legacy Triad completed across current and imported rows', () => {
  const legacy = legacyTriad([
    '2026-08-05T03:00:59.500Z',
    '2026-08-05T03:01:00.100Z',
    '2026-08-05T03:01:00.700Z',
  ]);
  assert.equal(countNewJournalConsultations([legacy[0]], legacy.slice(1)), 0);
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

test('retains a complete legacy Triad across a minute boundary at the cap', () => {
  const legacy = legacyTriad([
    '2026-08-05T03:01:00.700Z',
    '2026-08-05T03:01:00.100Z',
    '2026-08-05T03:00:59.500Z',
  ]);
  const olderSingles = Array.from({ length: 49 }, (_, index) => single(`legacy-older-${index}`));
  const result = retainCompleteJournalConsultations([...legacy, ...olderSingles], 50);
  assert.equal(result.entries.filter((entry) => entry.id.startsWith('legacy-')).length, 3);
  assert.equal(result.entries.length, 50);
});

test('omits an entire consultation when the remaining capacity cannot contain it', () => {
  const newestSingles = Array.from({ length: 49 }, (_, index) => single(`new-${index}`));
  const result = retainCompleteJournalConsultations([...newestSingles, ...triad], 50);

  assert.equal(result.entries.length, 49);
  assert.equal(result.entries.some((entry) => entry.consultationId === 'consultation-triad'), false);
  assert.equal(result.omittedEntries, 3);
  assert.equal(result.omittedConsultations, 1);
});
