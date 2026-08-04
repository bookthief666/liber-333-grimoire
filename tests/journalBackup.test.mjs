import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBER_333 } from '../src/data/liber333.js';
import { JOURNAL_ENTRY_SCHEMA_VERSION } from '../src/features/journal/journalSchema.js';
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

const chapter = (number) => LIBER_333.find((item) => item.chapter === number);

const entry = (overrides = {}) => ({
  id: 'entry-1',
  consultationId: 'consultation-1',
  spreadPosition: 'single',
  date: '2026-07-24T01:00:00.000Z',
  question: 'What remains unfinished?',
  chapter: 8,
  title: 'Client title is replaced',
  gematria: 314,
  interpretation: 'A retained interpretation.',
  spreadType: 'single',
  planetary: 'Mercury',
  lunar: 'Full Moon',
  favorite: true,
  note: 'A private integration note.',
  ...overrides,
});

test('backup creation and parsing round-trip through the versioned v2 envelope', () => {
  const exportedAt = new Date('2026-07-24T02:00:00.000Z');
  const text = serializeJournalBackup({
    entries: [entry()],
    totalReadings: 33,
    exportedAt,
  });
  const parsed = parseJournalBackup(text);

  assert.equal(parsed.format, JOURNAL_BACKUP_FORMAT);
  assert.equal(parsed.version, JOURNAL_BACKUP_VERSION);
  assert.equal(parsed.sourceVersion, JOURNAL_BACKUP_VERSION);
  assert.equal(parsed.exportedAt, exportedAt.toISOString());
  assert.equal(parsed.totalReadings, 33);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].title, chapter(8).title);
  assert.equal(parsed.entries[0].interpretation, 'A retained interpretation.');
  assert.equal(parsed.entries[0].schemaVersion, JOURNAL_ENTRY_SCHEMA_VERSION);
  assert.equal(parsed.entries[0].favorite, true);
  assert.equal(parsed.entries[0].note, 'A private integration note.');
  assert.equal(parsed.entries[0].consultationId, 'consultation-1');
  assert.equal(parsed.entries[0].spreadPosition, 'single');
  assert.ok(text.endsWith('\n'));
});

test('version 1 backups ignore accidental v2 fields and import safe Workbench defaults', () => {
  const legacy = {
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries: [{
      id: 'legacy',
      date: '2026-07-24T01:00:00.000Z',
      question: 'What remains unfinished?',
      chapter: 8,
      title: 'Legacy title',
      gematria: 314,
      interpretation: null,
      spreadType: 'single',
      planetary: null,
      lunar: null,
      favorite: 'legacy-noise',
      note: { ignored: true },
      consultationId: 333,
      spreadPosition: 'unknown',
    }],
  };

  const parsed = parseJournalBackup(JSON.stringify(legacy));
  assert.equal(parsed.version, JOURNAL_BACKUP_VERSION);
  assert.equal(parsed.sourceVersion, 1);
  assert.equal(parsed.entries[0].schemaVersion, JOURNAL_ENTRY_SCHEMA_VERSION);
  assert.equal(parsed.entries[0].favorite, false);
  assert.equal(parsed.entries[0].note, '');
  assert.equal('consultationId' in parsed.entries[0], false);
  assert.equal('spreadPosition' in parsed.entries[0], false);
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

test('invalid JSON, formats, future versions, chapters, metadata, and duplicate IDs are rejected', () => {
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
    version: JOURNAL_BACKUP_VERSION + 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 0,
    entries: [],
  })), /Unsupported backup version/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ chapter: 333 })],
    totalReadings: 1,
  }), /unknown Liber 333 chapter/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ favorite: 'yes' })],
    totalReadings: 1,
  }), /favorite state/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ note: 333 })],
    totalReadings: 1,
  }), /Integration note must be text/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ consultationId: 333 })],
    totalReadings: 1,
  }), /Consultation ID must be text/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ spreadPosition: 'middle' })],
    totalReadings: 1,
  }), /Spread position must be/);
  assert.throws(() => createJournalBackup({
    entries: [entry({ id: 'same' }), entry({ id: 'same', chapter: 44 })],
    totalReadings: 2,
  }), /duplicate entry ID/);
});

test('import merge is non-destructive, deduplicates by ID, and preserves local metadata', () => {
  const current = [
    entry({
      id: 'current',
      date: '2026-07-24T03:00:00.000Z',
      interpretation: 'Current copy wins.',
      note: 'Local note wins.',
    }),
    entry({ id: 'duplicate', date: '2026-07-23T03:00:00.000Z', favorite: true }),
  ];
  const backup = createJournalBackup({
    entries: [
      entry({
        id: 'duplicate',
        date: '2026-07-20T03:00:00.000Z',
        interpretation: 'Imported duplicate loses.',
        favorite: false,
        note: 'Imported note loses.',
      }),
      entry({ id: 'imported', date: '2026-07-25T03:00:00.000Z', chapter: 44, favorite: false }),
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
  const duplicate = result.entries.find((item) => item.id === 'duplicate');
  assert.equal(duplicate.interpretation, current[1].interpretation);
  assert.equal(duplicate.favorite, true);
  assert.equal(duplicate.note, 'A private integration note.');
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

test('optional fields remain nullable while Workbench fields receive stable defaults', () => {
  const backup = createJournalBackup({
    entries: [entry({
      interpretation: null,
      planetary: null,
      lunar: null,
      spreadType: '',
      favorite: undefined,
      note: undefined,
      consultationId: undefined,
      spreadPosition: undefined,
    })],
    totalReadings: 1,
  });

  assert.equal(backup.entries[0].interpretation, null);
  assert.equal(backup.entries[0].planetary, null);
  assert.equal(backup.entries[0].lunar, null);
  assert.equal(backup.entries[0].spreadType, 'single');
  assert.equal(backup.entries[0].title, chapter(8).title);
  assert.equal(backup.entries[0].favorite, false);
  assert.equal(backup.entries[0].note, '');
  assert.equal('consultationId' in backup.entries[0], false);
  assert.equal('spreadPosition' in backup.entries[0], false);
  assert.equal(backup.entries[0].schemaVersion, JOURNAL_ENTRY_SCHEMA_VERSION);
});
