import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOURNAL_STORAGE_KEY,
  TOTAL_READINGS_STORAGE_KEY,
  MAX_JOURNAL_ENTRIES,
  clearStoredJournalEntries,
  getJournalRecurrenceCount,
  getMilestoneForTotal,
  getRecentJournalReadings,
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

test('loads the existing unversioned journal array and lifetime counter unchanged', () => {
  const storage = new FakeStorage({
    [JOURNAL_STORAGE_KEY]: JSON.stringify([legacyEntry]),
    [TOTAL_READINGS_STORAGE_KEY]: '33',
  });

  assert.deepEqual(readJournalState(storage), {
    entries: [legacyEntry],
    totalReadings: 33,
  });
});

test('malformed or non-array journal data falls back to an empty list', () => {
  assert.deepEqual(readJournalState(new FakeStorage({ [JOURNAL_STORAGE_KEY]: '{bad' })).entries, []);
  assert.deepEqual(readJournalState(new FakeStorage({ [JOURNAL_STORAGE_KEY]: JSON.stringify({ entries: [] }) })).entries, []);
  assert.equal(readJournalState(new FakeStorage({ [TOTAL_READINGS_STORAGE_KEY]: 'not-a-number' })).totalReadings, 0);
});

test('new entries remain newest-first and capped at fifty', () => {
  const existing = Array.from({ length: MAX_JOURNAL_ENTRIES }, (_, index) => ({ id: String(index) }));
  const newest = { ...legacyEntry, id: 'newest' };
  const result = prependJournalEntry(existing, newest);

  assert.equal(result.length, MAX_JOURNAL_ENTRIES);
  assert.equal(result[0], newest);
  assert.equal(result.at(-1).id, '48');
});

test('removal, recurrence, and recent-reading helpers preserve current semantics', () => {
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

test('milestones remain limited to the four established lifetime totals', () => {
  assert.deepEqual([33, 66, 93, 333].map(getMilestoneForTotal), [33, 66, 93, 333]);
  assert.equal(getMilestoneForTotal(32), null);
  assert.equal(getMilestoneForTotal(334), null);
});

test('clear removes saved entries but intentionally preserves the lifetime counter', () => {
  const storage = new FakeStorage();
  writeJournalEntries(storage, [legacyEntry]);
  writeTotalReadings(storage, 93);
  clearStoredJournalEntries(storage);

  assert.equal(storage.getItem(JOURNAL_STORAGE_KEY), null);
  assert.equal(storage.getItem(TOTAL_READINGS_STORAGE_KEY), '93');
});
