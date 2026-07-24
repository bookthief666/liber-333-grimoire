import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBER_333 } from '../src/data/liber333.js';
import { MAX_JOURNAL_ENTRIES } from '../src/features/journal/journalStorage.js';
import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_VERSION,
  JournalBackupError,
  createJournalBackup,
  getJournalBackupFilename,
  mergeJournalBackup,
  parseJournalBackup,
  serializeJournalBackup,
} from '../src/features/journal/journalBackup.js';

const chapter = (number) => LIBER_333.find((entry) => entry.chapter === number);

const entry = (overrides = {}) => ({
  id: 'entry-1',
  date: '2026-07-24T01:00:00.000Z',
  question: 'What remains unfinished?',
  chapter: 8,
  title: 'Client title is replaced',
  gematria: 314,
  interpretation: 'A retained interpretation.',
  spreadType: 'single',
  planetary: 'Mercury',
  lunar: 'Full Moon',
  ...overrides,
});

test('backup creation and parsing round-trip through the versioned envelope', () => {
  const exportedAt = new Date('2026-07-24T02:00:00.000Z');
  const text = serializeJournalBackup({
    entries: [entry()],
    totalReadings: 33,
    exportedAt,
  });
  const parsed = parseJournalBackup(text);

  assert.equal(parsed.format, JOURNAL_BACKUP_FORMAT);
  assert.equal(parsed.version, JOURNAL_BACKUP_VERSION);
  assert.equal(parsed.exportedAt, exportedAt.toISOString());
  assert.equal(parsed.totalReadings, 33);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].title, chapter(8).title);
  assert.equal(parsed.entries[0].interpretation, 'A retained interpretation.');
  assert.ok(text.endsWith('\n'));
});

test('backup filenames are readable and date-stable', () => {
  assert.equal(
    getJournalBackupFilename(new Date('2026-07-24T23:59:59.000Z')),
    'liber-333-grimoire-2026-07-24.json',
  );
});

test('lifetime totals cannot be lower than the number of saved entries', () => {
  const backup = createJournalBackup({
    entries: [entry({ id: 'a' }), entry({ id: 'b', chapter: 44 })],
    totalReadings: 1,
    exportedAt: new Date('2026-07-24T02:00:00.000Z'),
  });

  assert.equal(backup.totalReadings, 2);
});

test('invalid JSON, formats, versions, chapters, and duplicate IDs are rejected', () => {
  assert.throws(() => parseJournalBackup('{bad'), JournalBackupError);
  assert.throws(() => parseJournalBackup(JSON.stringify({
    format: 'another-app',
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 0,
    entries: [],
  })), /not a Liber 333/);
  assert.throws(() => parseJournalBackup(JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: 2,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 0,
    entries: [],
  })), /Unsupported backup version/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ chapter: 333 })],
    totalReadings: 1,
  }), /unknown Liber 333 chapter/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ id: 'same' }), entry({ id: 'same', chapter: 44 })],
    totalReadings: 2,
  }), /duplicate entry ID/);
});

test('import merge is non-destructive, deduplicates by ID, and preserves the highest lifetime total', () => {
  const current = [
    entry({ id: 'current', date: '2026-07-24T03:00:00.000Z', interpretation: 'Current copy wins.' }),
    entry({ id: 'duplicate', date: '2026-07-23T03:00:00.000Z' }),
  ];
  const backup = createJournalBackup({
    entries: [
      entry({ id: 'duplicate', date: '2026-07-20T03:00:00.000Z', interpretation: 'Imported duplicate loses.' }),
      entry({ id: 'imported', date: '2026-07-25T03:00:00.000Z', chapter: 44 }),
    ],
    totalReadings: 93,
    exportedAt: new Date('2026-07-25T04:00:00.000Z'),
  });

  const result = mergeJournalBackup({
    currentEntries: current,
    currentTotalReadings: 100,
    backup,
  });

  assert.deepEqual(result.entries.map((item) => item.id), ['imported', 'current', 'duplicate']);
  assert.equal(result.entries.find((item) => item.id === 'duplicate').interpretation, current[1].interpretation);
  assert.equal(result.importedCount, 1);
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.totalReadings, 100);
});

test('merged backups remain newest-first and respect the fifty-entry cap', () => {
  const currentEntries = Array.from({ length: 30 }, (_, index) => entry({
    id: `current-${index}`,
    date: new Date(Date.UTC(2026, 6, 1, 0, index)).toISOString(),
  }));
  const imported = Array.from({ length: 30 }, (_, index) => entry({
    id: `imported-${index}`,
    chapter: 44,
    date: new Date(Date.UTC(2026, 6, 2, 0, index)).toISOString(),
  }));
  const backup = createJournalBackup({
    entries: imported,
    totalReadings: 60,
    exportedAt: new Date('2026-07-24T02:00:00.000Z'),
  });

  const result = mergeJournalBackup({ currentEntries, currentTotalReadings: 30, backup });

  assert.equal(result.entries.length, MAX_JOURNAL_ENTRIES);
  assert.equal(result.entries[0].id, 'imported-29');
  assert.equal(result.entries.at(-1).id, 'current-10');
  assert.equal(result.omittedByCap, 10);
  assert.equal(result.totalReadings, 60);
});

test('optional fields remain nullable and canonical title data is restored', () => {
  const backup = createJournalBackup({
    entries: [entry({
      interpretation: null,
      planetary: null,
      lunar: null,
      spreadType: '',
    })],
    totalReadings: 1,
  });

  assert.equal(backup.entries[0].interpretation, null);
  assert.equal(backup.entries[0].planetary, null);
  assert.equal(backup.entries[0].lunar, null);
  assert.equal(backup.entries[0].spreadType, 'single');
  assert.equal(backup.entries[0].title, chapter(8).title);
});
