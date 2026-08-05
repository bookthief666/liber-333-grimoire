import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JOURNAL_BACKUP_FORMAT,
  createJournalBackup,
  mergeJournalBackup,
  parseJournalBackup,
} from '../src/features/journal/journalBackup.js';

const legacyTriadEntry = (id, chapter, date) => ({
  id,
  date,
  question: 'How should this contradiction be reconciled?',
  chapter,
  title: 'Legacy client title',
  gematria: 333,
  interpretation: null,
  spreadType: 'Thesis/Antithesis/Synthesis',
  planetary: 'Mercury',
  lunar: 'Full Moon',
});

test('version 1 Triads are upgraded before merge and remain strict-v2 exportable', () => {
  const legacyBackup = {
    format: JOURNAL_BACKUP_FORMAT,
    version: 1,
    exportedAt: '2026-07-24T02:00:00.000Z',
    totalReadings: 1,
    entries: [
      legacyTriadEntry('legacy-thesis', 1, '2026-07-24T01:00:00.000Z'),
      legacyTriadEntry('legacy-antithesis', 2, '2026-07-24T01:00:20.000Z'),
      legacyTriadEntry('legacy-synthesis', 3, '2026-07-24T01:00:40.000Z'),
    ],
  };

  const parsed = parseJournalBackup(JSON.stringify(legacyBackup));
  const consultationIds = new Set(parsed.entries.map((entry) => entry.consultationId));

  assert.equal(parsed.sourceVersion, 1);
  assert.equal(consultationIds.size, 1);
  assert.ok(parsed.entries.every((entry) => entry.spreadType === 'triad'));
  assert.deepEqual(
    parsed.entries.map((entry) => entry.spreadPosition),
    ['thesis', 'antithesis', 'synthesis'],
  );
  assert.ok(parsed.entries.every((entry) => entry.date === '2026-07-24T01:00:00.000Z'));

  const merged = mergeJournalBackup({
    currentEntries: [],
    currentTotalReadings: 0,
    backup: parsed,
  });
  const exported = createJournalBackup({
    entries: merged.entries,
    totalReadings: merged.totalReadings,
    exportedAt: new Date('2026-07-24T03:00:00.000Z'),
  });

  assert.equal(merged.importedConsultationCount, 1);
  assert.equal(merged.importedEntryCount, 3);
  assert.equal(exported.entries.length, 3);
  assert.equal(new Set(exported.entries.map((entry) => entry.consultationId)).size, 1);
  assert.deepEqual(
    new Set(exported.entries.map((entry) => entry.spreadPosition)),
    new Set(['thesis', 'antithesis', 'synthesis']),
  );
});
