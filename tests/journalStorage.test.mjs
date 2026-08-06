import test from 'node:test';
import assert from 'node:assert/strict';

import { JOURNAL_ENTRY_SCHEMA_VERSION } from '../src/features/journal/journalSchema.js';
import {
  parseJournalBackup,
  serializeJournalBackup,
} from '../src/features/journal/journalBackup.js';
import {
  JOURNAL_STORAGE_KEY,
  TOTAL_READINGS_STORAGE_KEY,
  MAX_JOURNAL_ENTRIES,
  clearStoredJournalEntries,
  getJournalRecurrenceCount,
  getMilestoneCrossed,
  getMilestoneForTotal,
  getRecentJournalReadings,
  prependJournalEntries,
  prependJournalEntry,
  readJournalState,
  removeJournalEntry,
  writeJournalEntries,
  writeTotalReadings,
} from '../src/features/journal/journalStorage.js';

class FakeStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const legacyEntry = {
  id: 'legacy-1',
  date: '2026-07-01T00:00:00.000Z',
  question: 'What remains unfinished?',
  chapter: 8,
  title: 'STEEPED HORSEHAIR',
  gematria: 314,
  interpretation: 'Legacy reflection',
  spreadType: 'single',
  planetary: 'Mercury',
  lunar: 'Full Moon',
};

test('loads the existing unversioned journal array with safe Workbench defaults', () => {
  const storage = new FakeStorage({
    [JOURNAL_STORAGE_KEY]: JSON.stringify([legacyEntry]),
    [TOTAL_READINGS_STORAGE_KEY]: '33',
  });

  const state = readJournalState(storage);
  assert.equal(state.totalReadings, 33);
  assert.deepEqual(state.entries, [{
    ...legacyEntry,
    schemaVersion: JOURNAL_ENTRY_SCHEMA_VERSION,
    favorite: false,
    note: '',
  }]);
});

test('preserves and normalizes consultation metadata during storage migration', () => {
  const storage = new FakeStorage({
    [JOURNAL_STORAGE_KEY]: JSON.stringify([{
      ...legacyEntry,
      favorite: true,
      integrationNote: 'Legacy alias note.\r\nSecond line.',
      consultationId: ' consultation-1 ',
      spreadPosition: 'THESIS',
    }]),
  });
  const [entry] = readJournalState(storage).entries;
  assert.equal(entry.favorite, true);
  assert.equal(entry.note, 'Legacy alias note.\nSecond line.');
  assert.equal(entry.consultationId, 'consultation-1');
  assert.equal(entry.spreadPosition, 'thesis');
  assert.equal(entry.schemaVersion, JOURNAL_ENTRY_SCHEMA_VERSION);
});

test('old closure-based Triad survivor loads and exports without inventing a position', () => {
  const historicalSurvivor = {
    ...legacyEntry,
    id: 'old-triad-survivor',
    spreadType: 'Thesis/Antithesis/Synthesis',
  };
  const storage = new FakeStorage({
    [JOURNAL_STORAGE_KEY]: JSON.stringify([historicalSurvivor]),
    [TOTAL_READINGS_STORAGE_KEY]: '1',
  });

  const state = readJournalState(storage);
  assert.equal(state.entries[0].legacyTriadFragment, true);
  assert.equal('consultationId' in state.entries[0], false);
  assert.equal('spreadPosition' in state.entries[0], false);

  const backupText = serializeJournalBackup({
    ...state,
    exportedAt: new Date('2026-08-05T00:00:00.000Z'),
  });
  const roundTripped = parseJournalBackup(backupText);
  assert.equal(roundTripped.entries[0].id, historicalSurvivor.id);
  assert.equal(roundTripped.entries[0].chapter, historicalSurvivor.chapter);
  assert.equal(roundTripped.entries[0].legacyTriadFragment, true);
  assert.equal('spreadPosition' in roundTripped.entries[0], false);
});

test('malformed or non-array journal data falls back to an empty list', () => {
  assert.deepEqual(readJournalState(new FakeStorage({ [JOURNAL_STORAGE_KEY]: '{bad' })).entries, []);
  assert.deepEqual(readJournalState(new FakeStorage({ [JOURNAL_STORAGE_KEY]: JSON.stringify({ entries: [] }) })).entries, []);
  assert.equal(readJournalState(new FakeStorage({ [TOTAL_READINGS_STORAGE_KEY]: 'not-a-number' })).totalReadings, 0);
});

test('new entries remain newest-first, migrated, and capped at fifty', () => {
  const existing = Array.from({ length: MAX_JOURNAL_ENTRIES }, (_, index) => ({ id: String(index) }));
  const newest = { ...legacyEntry, id: 'newest' };
  const result = prependJournalEntry(existing, newest);

  assert.equal(result.length, MAX_JOURNAL_ENTRIES);
  assert.deepEqual(result[0], {
    ...newest,
    schemaVersion: JOURNAL_ENTRY_SCHEMA_VERSION,
    favorite: false,
    note: '',
  });
  assert.equal(result.at(-1).id, '48');
});

test('prepends a Triad atomically while preserving requested chapter order', () => {
  const additions = ['thesis', 'antithesis', 'synthesis'].map((spreadPosition, index) => ({
    ...legacyEntry,
    id: `triad-${spreadPosition}`,
    chapter: [7, 33, 93][index],
    consultationId: 'triad-consultation',
    spreadPosition,
    spreadType: 'Thesis/Antithesis/Synthesis',
  }));
  const result = prependJournalEntries([{ ...legacyEntry, id: 'older' }], additions);
  assert.deepEqual(result.slice(0, 3).map((entry) => entry.spreadPosition), ['thesis', 'antithesis', 'synthesis']);
  assert.equal(result[3].id, 'older');
});

test('writes only migrated journal entries', () => {
  const storage = new FakeStorage();
  writeJournalEntries(storage, [legacyEntry]);
  const [written] = JSON.parse(storage.getItem(JOURNAL_STORAGE_KEY));
  assert.equal(written.schemaVersion, JOURNAL_ENTRY_SCHEMA_VERSION);
  assert.equal(written.favorite, false);
  assert.equal(written.note, '');
});

test('storage write and reload preserve distinct marked fragment identities', () => {
  const storage = new FakeStorage();
  const fragments = ['2026-07-01T00:00:40.000Z', '2026-07-01T00:00:20.000Z', '2026-07-01T00:00:00.000Z']
    .map((date, index) => ({
      ...legacyEntry,
      id: `retained-fragment-${index}`,
      date,
      spreadType: 'Thesis/Antithesis/Synthesis',
      legacyTriadFragment: true,
      legacyTriadFragmentId: `retained-fragment-group-${index}`,
    }));

  writeJournalEntries(storage, fragments);
  const written = JSON.parse(storage.getItem(JOURNAL_STORAGE_KEY));
  assert.ok(written.every((entry) => entry.legacyTriadFragment === true));
  assert.equal(new Set(written.map((entry) => entry.legacyTriadFragmentId)).size, 3);
  assert.ok(written.every((entry) => !entry.consultationId && !entry.spreadPosition));

  const reloaded = readJournalState(storage).entries;
  assert.deepEqual(reloaded.map((entry) => entry.id), fragments.map((entry) => entry.id));
  assert.ok(reloaded.every((entry) => entry.legacyTriadFragment === true));
  assert.equal(new Set(reloaded.map((entry) => entry.legacyTriadFragmentId)).size, 3);
  assert.ok(reloaded.every((entry) => !entry.consultationId && !entry.spreadPosition));

  const afterDelete = removeJournalEntry(reloaded, reloaded[1].id);
  assert.deepEqual(afterDelete.map((entry) => entry.id), [fragments[0].id, fragments[2].id]);

  const roundTripped = parseJournalBackup(serializeJournalBackup({
    entries: reloaded,
    totalReadings: 3,
    exportedAt: new Date('2026-08-06T05:00:00.000Z'),
  }));
  assert.equal(new Set(roundTripped.entries.map((entry) => entry.legacyTriadFragmentId)).size, 3);
  assert.ok(roundTripped.entries.every((entry) => !entry.consultationId && !entry.spreadPosition));
});

test('single removal, recurrence, and recent-reading helpers preserve current semantics', () => {
  const entries = [
    { id: 'a', chapter: 8 },
    { id: 'b', chapter: 8 },
    { id: 'c', chapter: '8' },
    { id: 'd', chapter: 44 },
  ];

  assert.deepEqual(removeJournalEntry(entries, 'b').map((entry) => entry.id), ['a', 'c', 'd']);
  assert.equal(getJournalRecurrenceCount(entries, 8), 2);
  assert.deepEqual(getRecentJournalReadings(entries, 2).map((entry) => entry.id), ['a', 'b']);
});

test('deleting one explicit Triad position removes the complete consultation', () => {
  const triad = ['thesis', 'antithesis', 'synthesis'].map((spreadPosition, index) => ({
    ...legacyEntry,
    id: `delete-triad-${spreadPosition}`,
    consultationId: 'delete-triad',
    spreadPosition,
    spreadType: 'triad',
    chapter: index + 1,
  }));
  const result = removeJournalEntry([...triad, { ...legacyEntry, id: 'survivor' }], triad[1].id);
  assert.deepEqual(result.map((entry) => entry.id), ['survivor']);
});

test('deleting one legacy Triad row removes its adjacent sequence group', () => {
  const legacyTriad = ['2026-07-01T00:00:59.500Z', '2026-07-01T00:01:00.100Z', '2026-07-01T00:01:00.700Z']
    .map((date, index) => ({
      ...legacyEntry,
      id: `legacy-triad-${index}`,
      date,
      spreadType: 'Thesis/Antithesis/Synthesis',
    }));
  const result = removeJournalEntry([...legacyTriad, { ...legacyEntry, id: 'survivor' }], legacyTriad[0].id);
  assert.deepEqual(result.map((entry) => entry.id), ['survivor']);
});

test('milestones include exact totals and thresholds crossed by atomic batches', () => {
  assert.deepEqual([33, 66, 93, 333].map(getMilestoneForTotal), [33, 66, 93, 333]);
  assert.equal(getMilestoneForTotal(32), null);
  assert.equal(getMilestoneForTotal(334), null);
  assert.equal(getMilestoneCrossed(32, 35), 33);
  assert.equal(getMilestoneCrossed(64, 67), 66);
  assert.equal(getMilestoneCrossed(90, 94), 93);
  assert.equal(getMilestoneCrossed(330, 334), 333);
  assert.equal(getMilestoneCrossed(35, 36), null);
});

test('clear removes saved entries but intentionally preserves the lifetime counter', () => {
  const storage = new FakeStorage();
  writeJournalEntries(storage, [legacyEntry]);
  writeTotalReadings(storage, 93);
  clearStoredJournalEntries(storage);

  assert.equal(storage.getItem(JOURNAL_STORAGE_KEY), null);
  assert.equal(storage.getItem(TOTAL_READINGS_STORAGE_KEY), '93');
});
