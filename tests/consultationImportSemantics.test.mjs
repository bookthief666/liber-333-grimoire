import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createJournalBackup,
  mergeJournalBackup,
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

test('adding a missing row to an existing consultation is not reported as a new consultation', () => {
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
