import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOURNAL_BACKUP_FORMAT,
  JOURNAL_BACKUP_VERSION,
  JournalBackupError,
  createJournalBackup,
  mergeJournalBackup,
  parseJournalBackup,
} from '../src/features/journal/journalBackup.js';

const triad = ['thesis', 'antithesis', 'synthesis'].map((spreadPosition, index) => ({
  id: `import-triad-${spreadPosition}`,
  consultationId: 'import-triad',
  spreadPosition,
  date: '2026-08-05T05:00:00.000Z',
  question: 'What is the complete relation?',
  chapter: index + 1,
  title: 'Canonical title restored during normalization',
  gematria: 333,
  interpretation: null,
  spreadType: 'triad',
  planetary: null,
  lunar: null,
  favorite: false,
  note: '',
}));

function backupEnvelope(entries, totalReadings = 1) {
  return JSON.stringify({
    format: JOURNAL_BACKUP_FORMAT,
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: '2026-08-05T05:30:00.000Z',
    totalReadings,
    entries,
  });
}

test('import reports one new consultation for three retained Triad entries', () => {
  const backup = createJournalBackup({
    entries: triad,
    totalReadings: 1,
    exportedAt: new Date('2026-08-05T05:30:00.000Z'),
  });
  const result = mergeJournalBackup({
    currentEntries: [],
    currentTotalReadings: 0,
    backup,
  });

  assert.equal(result.importedCount, 1);
  assert.equal(result.importedConsultationCount, 1);
  assert.equal(result.importedEntryCount, 3);
  assert.equal(result.totalReadings, 1);
});

test('adding missing rows to an existing consultation is not reported as a new consultation', () => {
  const backup = createJournalBackup({
    entries: triad,
    totalReadings: 1,
    exportedAt: new Date('2026-08-05T05:30:00.000Z'),
  });
  const result = mergeJournalBackup({
    currentEntries: [triad[0]],
    currentTotalReadings: 1,
    backup,
  });

  assert.equal(result.importedCount, 0);
  assert.equal(result.importedConsultationCount, 0);
  assert.equal(result.importedEntryCount, 2);
  assert.equal(result.totalReadings, 1);
});

test('rejects explicit v2 Triads with missing rows', () => {
  assert.throws(
    () => parseJournalBackup(backupEnvelope(triad.slice(0, 2))),
    (error) => error instanceof JournalBackupError
      && error.code === 'invalid_consultation_group'
      && /exactly three entries/.test(error.message),
  );
});

test('rejects explicit v2 Triads with duplicate or missing positions', () => {
  const malformed = triad.map((entry, index) => ({
    ...entry,
    spreadPosition: index === 2 ? 'antithesis' : entry.spreadPosition,
  }));
  assert.throws(
    () => createJournalBackup({ entries: malformed, totalReadings: 1 }),
    /thesis, antithesis, and synthesis exactly once/,
  );
});

test('rejects explicit v2 Triads with extra rows', () => {
  const malformed = [
    ...triad,
    { ...triad[2], id: 'import-triad-extra' },
  ];
  assert.throws(
    () => createJournalBackup({ entries: malformed, totalReadings: 1 }),
    /exactly three entries/,
  );
});

test('rejects internally inconsistent explicit Triad fields', () => {
  for (const [field, value] of [
    ['question', 'A different question'],
    ['date', '2026-08-05T05:00:01.000Z'],
    ['gematria', 334],
  ]) {
    const malformed = triad.map((entry, index) => (
      index === 1 ? { ...entry, [field]: value } : entry
    ));
    assert.throws(
      () => createJournalBackup({ entries: malformed, totalReadings: 1 }),
      new RegExp(`inconsistent ${field} values`),
    );
  }
});

test('rejects a Triad position without an explicit consultation ID in v2', () => {
  const [{ consultationId, ...malformed }] = triad;
  assert.throws(
    () => createJournalBackup({ entries: [malformed], totalReadings: 1 }),
    /Triad position without a consultation ID/,
  );
});
