import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JOURNAL_ENTRY_SCHEMA_VERSION,
  JOURNAL_NOTE_LIMIT,
  migrateJournalEntries,
  migrateJournalEntry,
  normalizeJournalNote,
  patchJournalEntryMetadata,
} from '../src/features/journal/journalSchema.js';

test('migrates legacy entries without losing unknown reading data', () => {
  const legacy = {
    id: 'legacy',
    chapter: 8,
    customFutureField: { retained: true },
  };
  assert.deepEqual(migrateJournalEntry(legacy), {
    ...legacy,
    schemaVersion: JOURNAL_ENTRY_SCHEMA_VERSION,
    favorite: false,
    note: '',
  });
});

test('normalizes legacy note aliases and preserves favorites', () => {
  const migrated = migrateJournalEntry({
    id: 'legacy',
    favorite: true,
    integrationNote: 'First line.\r\nSecond line.',
  });
  assert.equal(migrated.favorite, true);
  assert.equal(migrated.note, 'First line.\nSecond line.');
});

test('storage migration drops non-object values and safely truncates oversized legacy notes', () => {
  const migrated = migrateJournalEntries([
    null,
    'bad',
    { id: 'valid', note: 'x'.repeat(JOURNAL_NOTE_LIMIT + 10) },
  ]);
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].note.length, JOURNAL_NOTE_LIMIT);
});

test('strict note validation rejects invalid types and oversized edits', () => {
  assert.throws(() => normalizeJournalNote(333, { strict: true }), TypeError);
  assert.throws(() => normalizeJournalNote('x'.repeat(JOURNAL_NOTE_LIMIT + 1), { strict: true }), RangeError);
});

test('patches favorite and note immutably under the current schema', () => {
  const entry = { id: 'one', favorite: false, note: 'Before' };
  const patched = patchJournalEntryMetadata(entry, {
    favorite: true,
    note: 'After\r\nSecond line',
  });
  assert.notEqual(patched, entry);
  assert.equal(entry.favorite, false);
  assert.equal(patched.schemaVersion, JOURNAL_ENTRY_SCHEMA_VERSION);
  assert.equal(patched.favorite, true);
  assert.equal(patched.note, 'After\nSecond line');
});
